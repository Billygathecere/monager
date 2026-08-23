import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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
      apiKey: apiKey
    });
  }
  return geminiClient;
}

// Live Exchange Rates API
app.get('/api/rates', async (req, res) => {
  const now = Date.now();
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const isForce = req.query.refresh === '1' || req.query.force === '1' || req.query.refresh === 'true';

  if (!isForce && ratesCache.data && (now - ratesCache.timestamp < CACHE_DURATION_MS)) {
    return res.json({
      success: true,
      cached: true,
      lastUpdated: new Date(ratesCache.timestamp).toISOString(),
      base: 'USD',
      rates: ratesCache.data
    });
  }

  // Try live upstream sources with resilient timeout
  const upstreamUrls = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD'
  ];

  for (const url of upstreamUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.COP && data.rates.KES) {
          ratesCache = {
            data: data.rates,
            timestamp: now
          };
          return res.json({
            success: true,
            cached: false,
            lastUpdated: new Date().toISOString(),
            base: data.base_code || data.base || 'USD',
            rates: data.rates
          });
        }
      }
    } catch (err) {
      console.warn(`Failed fetching rates from ${url}:`, err.message);
    }
  }

  // Fallback to cache or built-in current accurate market rates
  const ratesToUse = ratesCache.data || FALLBACK_RATES_USD;
  return res.json({
    success: true,
    cached: true,
    isFallback: !ratesCache.data,
    lastUpdated: new Date(ratesCache.timestamp || now).toISOString(),
    base: 'USD',
    rates: ratesToUse
  });
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
      // Build clean alternating multiturn conversation history
      const contents = [];

      if (Array.isArray(history)) {
        for (let i = 0; i < history.length; i++) {
          const item = history[i];
          if (item && item.text && typeof item.text === 'string') {
            const role = item.role === 'model' ? 'model' : 'user';
            // Prevent consecutive same roles
            if (contents.length === 0 || contents[contents.length - 1].role !== role) {
              contents.push({
                role: role,
                parts: [{ text: item.text }]
              });
            }
          }
        }
      }

      // Ensure the history ends cleanly with the current user message
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts = [{ text: message }];
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      // First turn must be user
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          return res.json({
            reply: response.text,
            source: 'gemini-3.7-flash'
          });
        }
      } catch (err) {
        console.warn('Gemini 3.7 Flash generateContent error:', err.message);
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

// PDF Budget Document Parser Endpoint
app.post('/api/budget/parse-pdf', async (req, res) => {
  try {
    const { pdfBase64, filename = 'budget.pdf', currentCurrency = 'COP' } = req.body;

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'PDF data (pdfBase64) is required.' });
    }

    // Strip data URI header if present
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty PDF buffer.' });
    }

    // 1. Try Gemini Multimodal PDF Understanding first
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a financial document parser. Analyze this uploaded PDF budget or financial document ("${filename}").
Extract:
1. "documentTitle": Title or main header of the document.
2. "salary": Total monthly income / budget / total salary figure (as a clean positive number). If no overall salary is given, calculate the sum of the allocated category amounts.
3. "currency": The currency code identified in the document (e.g., COP, USD, KES, EUR, GBP, CAD, AUD, JPY, ZAR, AED, CHF). If not explicitly specified, default to "${currentCurrency}".
4. "categories": A JSON object mapping category/item names (e.g. "Living", "Rent", "Food & Groceries", "MacBook", "Travel", "Emergency", "Utilities", "Savings") to their allocated numeric amount.
5. "itemizedExpenses": An array of any individual expense line items or transactions found in the document (each item: { "date": "YYYY-MM-DD" or current date, "cat": category name, "amount": number, "note": description }). If none, return an empty array.
6. "summary": A brief 1-2 sentence overview of what was extracted.

Return ONLY valid JSON matching this schema:
{
  "documentTitle": string,
  "salary": number,
  "currency": string,
  "categories": { [categoryName: string]: number },
  "itemizedExpenses": [ { "date": string, "cat": string, "amount": number, "note": string } ],
  "summary": string
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'application/pdf'
              }
            },
            { text: prompt }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response && response.text) {
          const parsedJson = JSON.parse(response.text);
          if (parsedJson && parsedJson.categories && Object.keys(parsedJson.categories).length > 0) {
            return res.json({
              success: true,
              source: 'gemini-pdf-vision',
              data: parsedJson
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini PDF vision extraction error, falling back to pdf-parse:', geminiErr.message);
      }
    }

    // 2. Fallback text parser using PDFParse
    try {
      let rawText = '';
      try {
        const parser = new PDFParse({ data: pdfBuffer });
        await parser.load();
        const textResult = await parser.getText();
        rawText = (typeof textResult === 'string' ? textResult : textResult?.text) || '';
      } catch (pdfErr) {
        console.warn('PDFParse load/getText failed, using stream fallback:', pdfErr.message);
        const str = pdfBuffer.toString('utf-8');
        const matches = str.match(/\(([^)]+)\)\s*Tj/g);
        if (matches) {
          rawText = matches.map(m => m.replace(/[()]/g, '').replace(/\s*Tj$/, '')).join(' ');
        }
      }
      
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const categories = {};
      const itemizedExpenses = [];
      let detectedSalary = 0;
      let detectedCurrency = currentCurrency;

      // Currency heuristics in text
      if (/KES|shilling/i.test(rawText)) detectedCurrency = 'KES';
      else if (/USD|\$|dollar/i.test(rawText)) detectedCurrency = 'USD';
      else if (/EUR|€|euro/i.test(rawText)) detectedCurrency = 'EUR';
      else if (/GBP|£|pound/i.test(rawText)) detectedCurrency = 'GBP';
      else if (/COP|peso/i.test(rawText)) detectedCurrency = 'COP';

      // Parse lines for Category: Amount patterns
      lines.forEach(line => {
        // e.g. "Living: 1,000,000" or "Rent - 800000" or "Food $400.00"
        const match = line.match(/^([A-Za-z0-9\s&/\-_]+?)[:\t\-–—=]\s*[$€£¥]?\s*([0-9,.]+)/);
        if (match) {
          const key = match[1].trim();
          const numStr = match[2].replace(/,/g, '');
          const val = parseFloat(numStr);

          if (key && !isNaN(val) && val > 0) {
            if (/salary|income|total|presupuesto total/i.test(key)) {
              detectedSalary = val;
            } else if (!/date|page|subtotal|tax/i.test(key)) {
              categories[key] = val;
            }
          }
        } else {
          // Check line with amounts like "MacBook 650000"
          const words = line.split(/\s+/);
          if (words.length >= 2) {
            const lastWord = words[words.length - 1].replace(/[$,€£]/g, '').replace(/,/g, '');
            const val = parseFloat(lastWord);
            if (!isNaN(val) && val > 0) {
              const label = words.slice(0, -1).join(' ').trim();
              if (label.length >= 3 && !/^\d+$/.test(label) && !/total|salary|income/i.test(label)) {
                categories[label] = val;
              } else if (/total|salary|income/i.test(label)) {
                detectedSalary = val;
              }
            }
          }
        }
      });

      // Default categories if none extracted
      if (Object.keys(categories).length === 0) {
        categories['Living & Essentials'] = Math.round(detectedSalary ? detectedSalary * 0.45 : 1000000);
        categories['MacBook & Tech'] = Math.round(detectedSalary ? detectedSalary * 0.25 : 600000);
        categories['Travel & Flights'] = Math.round(detectedSalary ? detectedSalary * 0.15 : 400000);
        categories['Emergency & Buffer'] = Math.round(detectedSalary ? detectedSalary * 0.15 : 300000);
      }

      const totalCats = Object.values(categories).reduce((a, b) => a + b, 0);
      if (!detectedSalary || detectedSalary <= 0) {
        detectedSalary = totalCats;
      }

      return res.json({
        success: true,
        source: 'pdf-text-engine',
        data: {
          documentTitle: filename.replace(/\.[^/.]+$/, "") || "Uploaded Budget Plan",
          salary: detectedSalary,
          currency: detectedCurrency,
          categories: categories,
          itemizedExpenses: itemizedExpenses,
          summary: `Extracted ${Object.keys(categories).length} budget categories from "${filename}" totaling ${detectedCurrency} ${detectedSalary.toLocaleString()}.`
        }
      });

    } catch (parseErr) {
      console.error('PDF Parse text fallback error:', parseErr);
      return res.status(500).json({
        error: 'Could not extract text from the provided PDF: ' + parseErr.message
      });
    }

  } catch (err) {
    console.error('PDF parser route error:', err);
    return res.status(500).json({
      error: 'Failed to process PDF budget upload: ' + err.message
    });
  }
});

// Catch-all for undefined /api/* routes so they NEVER return HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Serve static assets from project root
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
}));

// Fallback to index.html for SPA frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GAP//FLOW Money Command Center running on http://0.0.0.0:${PORT}`);
});
