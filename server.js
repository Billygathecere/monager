import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Set custom MIME types
express.static.mime.define({
  'application/manifest+json': ['webmanifest'],
  'application/javascript': ['js'],
  'image/svg+xml': ['svg']
});

// Cache for exchange rates
let ratesCache = {
  data: null,
  timestamp: 0
};

// Fallback rates base USD in case network or API is unreachable
const FALLBACK_RATES_USD = {
  USD: 1.0,
  COP: 4120.50,    // Colombian Peso
  KES: 129.50,     // Kenyan Shilling
  EUR: 0.92,       // Euro
  GBP: 0.79,       // British Pound
  CAD: 1.36,       // Canadian Dollar
  AUD: 1.52,       // Australian Dollar
  JPY: 154.20,     // Japanese Yen
  INR: 83.45,      // Indian Rupee
  ZAR: 18.20,      // South African Rand
  AED: 3.6725,     // UAE Dirham
  CHF: 0.89,       // Swiss Franc
  BRL: 5.45,       // Brazilian Real
  CNY: 7.23,       // Chinese Yuan
  MXN: 18.15       // Mexican Peso
};

// Lazy initialize Gemini client
let geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// Live Exchange Rates API
app.get('/api/rates', async (req, res) => {
  const now = Date.now();
  const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  if (ratesCache.data && (now - ratesCache.timestamp < CACHE_DURATION_MS)) {
    return res.json({
      success: true,
      cached: true,
      lastUpdated: new Date(ratesCache.timestamp).toISOString(),
      base: 'USD',
      rates: ratesCache.data
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        ratesCache = {
          data: data.rates,
          timestamp: now
        };
        return res.json({
          success: true,
          cached: false,
          lastUpdated: new Date().toISOString(),
          base: data.base_code || 'USD',
          rates: data.rates
        });
      }
    }
    throw new Error('Upstream exchange rates response invalid');
  } catch (err) {
    console.warn('Could not fetch live rates from upstream API, serving cached or fallback rates:', err.message);
    const ratesToUse = ratesCache.data || FALLBACK_RATES_USD;
    return res.json({
      success: true,
      cached: true,
      isFallback: !ratesCache.data,
      lastUpdated: new Date(ratesCache.timestamp || now).toISOString(),
      base: 'USD',
      rates: ratesToUse
    });
  }
});

// Gemini AI Financial Advisor Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, financialContext, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getGeminiClient();

    // Prepare rich financial summary for prompt
    const ctx = financialContext || {};
    const formattedSalary = ctx.salary ? `COP ${Number(ctx.salary).toLocaleString('es-CO')}` : 'COP 2,300,000';
    const formattedSpent = ctx.totalSpent ? `COP ${Number(ctx.totalSpent).toLocaleString('es-CO')}` : 'COP 0';
    const formattedUnallocated = ctx.unallocated ? `COP ${Number(ctx.unallocated).toLocaleString('es-CO')}` : 'COP 0';
    
    let bucketBreakdown = 'No active bucket breakdown.';
    if (ctx.allocations && typeof ctx.allocations === 'object') {
      bucketBreakdown = Object.entries(ctx.allocations)
        .map(([bucket, amount]) => `- **${bucket}**: COP ${Number(amount).toLocaleString('es-CO')} allocated (Spent this month: COP ${Number(ctx.spentByCategory?.[bucket] || 0).toLocaleString('es-CO')}, Remaining: COP ${Math.max(0, Number(amount) - Number(ctx.spentByCategory?.[bucket] || 0)).toLocaleString('es-CO')})`)
        .join('\n');
    }

    let recentExpenseList = 'No recent expenses logged.';
    if (Array.isArray(ctx.recentExpenses) && ctx.recentExpenses.length > 0) {
      recentExpenseList = ctx.recentExpenses.slice(0, 12)
        .map(e => `- ${e.date} | ${e.cat}: COP ${Number(e.amount).toLocaleString('es-CO')} (${e.note || 'No description'})`)
        .join('\n');
    }

    const systemInstruction = `You are GAP//AI, an elite personal financial strategist and money command center advisor for a user managing their money between Colombia (COP) and Kenya (KES), planning travel, upgrading tech (MacBook), investing, and building wealth.

USER REAL-TIME FINANCIAL STATE:
- Monthly Salary: ${formattedSalary}
- Total Spent This Month: ${formattedSpent}
- Unallocated / Safe Buffer Remaining: ${formattedUnallocated}
- Current Financial Health Status: ${ctx.healthStatus || 'GREEN'}
- Primary Currency: ${ctx.currency || 'COP'} (with active exchange interest in KES, USD, EUR, GBP)
- Category Bucket Allocations & Real-Time Remaining Balances:
${bucketBreakdown}
- Recent Logged Expenses:
${recentExpenseList}

YOUR BEHAVIOR & GUIDELINES:
1. Provide precise, actionable, smart, and direct financial answers using the user's REAL live numbers shown above.
2. If asked "Can I afford X?", calculate exact deductions from their relevant bucket (e.g. Living or Travel), state the exact remaining balance after purchase, and give a clear Verdict (Affordable / Exceeds Budget / Split Needed).
3. If asked about travel between Colombia and Kenya, advise on smart currency conversions (COP to KES or USD), M-Pesa, card foreign transaction fees, and flight savings targets.
4. When suggesting plans, give concise structured bullet points with bold numbers. Avoid fluff or repetitive disclaimers. End with 1 actionable recommendation or follow-up prompt.`;

    if (ai) {
      const contents = [];

      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item && item.text) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Try primary model, fallback to flash model if busy
      const modelsToTry = ['gemini-2.5-flash', 'gemini-3.7-flash'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            return res.json({
              reply: response.text,
              source: modelName
            });
          }
        } catch (err) {
          console.warn(`Model ${modelName} attempt error:`, err.message);
        }
      }
    }

    // High-intelligence Local Fallback Engine if AI models are unreachable or key is missing
    const lower = message.toLowerCase();
    let fallbackReply = '';
    
    const parsedNum = (message.match(/\d+[\d,.]*/g) || ['0'])[0].replace(/[.,]/g, '');
    const val = Number(parsedNum);
    const livingAlloc = ctx.allocations?.Living || 1000000;
    const livingSpent = ctx.spentByCategory?.Living || 0;
    const livingRemaining = Math.max(0, livingAlloc - livingSpent);

    if (lower.includes('spend') || lower.includes('buy') || lower.includes('afford') || lower.includes('cost')) {
      if (val > 0) {
        const wouldLeave = livingRemaining - val;
        if (wouldLeave >= 0) {
          fallbackReply = `### 📊 Affordability Verdict: COP ${val.toLocaleString('es-CO')}
- **Living Bucket Allocation**: COP ${livingAlloc.toLocaleString('es-CO')}
- **Current Spent in Living**: COP ${livingSpent.toLocaleString('es-CO')}
- **Available in Living Before Purchase**: COP ${livingRemaining.toLocaleString('es-CO')}
- **Remaining After Purchase**: **COP ${wouldLeave.toLocaleString('es-CO')}**

✅ **Verdict: Affordable**
This purchase fits comfortably inside your Living allocation. Your overall unspent salary balance will be **COP ${(ctx.unallocated - val).toLocaleString('es-CO')}**.`;
        } else {
          fallbackReply = `### ⚠️ Budget Overrun Warning: COP ${val.toLocaleString('es-CO')}
- **Living Bucket Allocation**: COP ${livingAlloc.toLocaleString('es-CO')}
- **Current Spent**: COP ${livingSpent.toLocaleString('es-CO')}
- **Available Before Purchase**: COP ${livingRemaining.toLocaleString('es-CO')}
- **Budget Shortfall**: **COP ${Math.abs(wouldLeave).toLocaleString('es-CO')}**

⚠️ **Verdict: Over Budget**
This purchase exceeds your remaining Living allocation for this month.
**Smart Alternatives:**
1. Reallocate COP ${Math.abs(wouldLeave).toLocaleString('es-CO')} from your discretionary or Tech fund.
2. Defer purchase until the next salary cycle on the 25th.
3. Split the cost into two installments.`;
        }
      } else {
        fallbackReply = `To analyze affordability, provide the estimated amount (e.g. *"Can I afford COP 180,000 for groceries and dinner?"*). Your active salary is **${formattedSalary}** with **${formattedUnallocated}** currently unspent.`;
      }
    } else if (lower.includes('salary') || lower.includes('distribut') || lower.includes('bucket')) {
      fallbackReply = `### ⚡ Salary Allocation Snapshot
- **Total Monthly Salary**: ${formattedSalary}
- **Allocations**:
${bucketBreakdown}
- **Total Spent This Month**: ${formattedSpent}
- **Unspent Balance**: ${formattedUnallocated}

*Tip*: You can adjust percentages or select presets anytime in the **Budget** tab.`;
    } else if (lower.includes('currency') || lower.includes('exchange') || lower.includes('kes') || lower.includes('shilling') || lower.includes('dollar') || lower.includes('rate')) {
      fallbackReply = `### 💱 Live Forex & Travel Intelligence
- **Primary Conversion**: Colombian Peso (COP) ⇄ Kenyan Shilling (KES)
- **Live Benchmark**: 1 KES ≈ 31.8 COP (COP 1,000,000 ≈ ~31,400 KES / ~$242 USD).
- **Travel Strategy**: When traveling between Colombia and Kenya, maintain a multi-currency card (USD/KES) to bypass exorbitant double-conversion bank ATM fees. Check the **Currency** tab for real-time rates.`;
    } else {
      fallbackReply = `### 🧠 GAP//AI Financial Summary
- **Active Salary**: ${formattedSalary}
- **Month-to-Date Spending**: ${formattedSpent} (${ctx.healthStatus || 'GREEN'} Status)
- **Remaining Buffer**: ${formattedUnallocated}
- **Key Goals**: Living Essentials, MacBook savings, Return Home / Kenya travel, Emergency buffer.

**Ask me anything:**
- *"Can I afford COP 300,000 for a weekend trip?"*
- *"How should I allocate my next pay increase?"*
- *"How much KES do I get for COP 500,000?"*`;
    }

    return res.json({
      reply: fallbackReply,
      source: 'local-intelligence'
    });

  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({
      error: 'Failed to process AI query: ' + err.message
    });
  }
});

// Serve static assets from project root
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GAP//FLOW Money Command Center running on http://0.0.0.0:${PORT}`);
});
