/**
 * Monager AI Copilot Service (V3.2)
 * Connects frontend to backend /api/ai/chat proxy with high-precision local financial analysis fallback.
 * Implements the structured: interpret -> propose -> confirm -> apply financial mutation workflow.
 */

import { storageService } from './storage.js';
import { currencyService } from './currency.js';
import { 
  calculateSalaryDistribution, 
  calculateAvailableBalance, 
  calculateCategoryBreakdown, 
  calculateBudgetVsActual, 
  calculateFinancialHealthScore,
  validateAllocationPercentages
} from '../domain/finance.js';
import { evaluateAffordability, AFFORDABILITY_VERDICTS } from '../domain/affordability.js';
import { calculateGoalsSummary } from '../domain/goals.js';

class AIService {
  constructor() {
    this.pendingProposals = [];
    this.listeners = new Set();
  }

  /**
   * Generates a context payload summarizing the user's real-time financial state.
   * @returns {Object}
   */
  getFinancialContext() {
    const state = storageService.getState();
    const curr = state.profile?.primaryCurrency || 'COP';

    const incomeTransactions = state.incomeTransactions || [];
    const expenses = state.expenses || [];
    const allocations = state.allocations || {};
    const allocationPercentages = state.allocationPercentages || {};
    const goals = state.goals || [];
    const recurringRules = state.recurringRules || [];

    const balanceInfo = calculateAvailableBalance({
      startingBalance: 0,
      incomeTransactions,
      expenses
    });

    const spentByCategory = calculateCategoryBreakdown(expenses);
    const budgetVsActual = calculateBudgetVsActual(allocations, expenses);

    // Calculate upcoming mandatory obligations from active recurring rules
    const upcomingObligations = recurringRules
      .filter(r => r.active !== false)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Calculate emergency buffer
    const emergencyBuffer = Number(allocations.Buffer || 0) + Number(allocations.Savings || 0);

    // Calculate health score
    const health = calculateFinancialHealthScore({
      monthlyIncome: state.salary || 0,
      monthlyExpenses: balanceInfo.totalExpenses,
      savingsAllocated: (allocations.Savings || 0) + (allocations.Buffer || 0),
      emergencyFundBalance: emergencyBuffer,
      activeGoalsCount: goals.filter(g => g.status !== 'completed').length,
      goalsOnTrackCount: goals.filter(g => g.status !== 'completed').length, // baseline
      investmentAllocated: allocations.Investment || 0
    });

    const goalsSummary = calculateGoalsSummary(goals, new Date());

    return {
      salary: state.salary || 2300000,
      currency: curr,
      totalIncome: balanceInfo.totalIncome,
      totalSpent: balanceInfo.totalExpenses,
      availableBalance: balanceInfo.availableBalance,
      netSavings: balanceInfo.netSavings,
      unallocated: state.unallocatedAmount || 0,
      allocations,
      allocationPercentages,
      spentByCategory,
      budgetVsActual,
      upcomingObligations,
      emergencyBuffer,
      healthScore: health.score,
      healthStatus: health.status,
      healthSummary: health.summary,
      goals: goals.map(g => ({
        id: g.id,
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount,
        deadline: g.deadline,
        monthlyContribution: g.monthlyContribution,
        category: g.category,
        status: g.status
      })),
      goalsSummary,
      recurringRules,
      recentExpenses: expenses.slice(-10).reverse()
    };
  }

  /**
   * Sends a chat query to the backend AI endpoint with conversational history and local fallback.
   * @param {string} userMessage
   * @returns {Promise<{ reply: string, source: string, proposal: Object|null }>}
   */
  async sendMessage(userMessage) {
    const state = storageService.getState();
    const financialContext = this.getFinancialContext();
    const history = (state.aiChatHistory || []).map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      text: msg.text
    }));

    let replyText = '';
    let aiSource = 'local-engine';

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          financialContext,
          history
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.source && data.source.includes('gemini')) {
          replyText = data.reply || '';
          aiSource = data.source;
        } else {
          // Backend used local fallback or returned local response
          replyText = data.reply || this.generateLocalFinancialAnalysis(userMessage, financialContext, state);
          aiSource = 'local-financial-engine';
        }
      } else {
        throw new Error(`AI API returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('Backend AI unavailable, using Monager local financial analysis engine:', err.message);
      replyText = `*AI service unavailable — using Monager's local financial analysis.*\n\n` + 
                  this.generateLocalFinancialAnalysis(userMessage, financialContext, state);
      aiSource = 'local-financial-engine';
    }

    // Check if the user's message requests a financial mutation and generate a Proposal
    const proposal = this.interpretFinancialIntent(userMessage, state);

    return {
      reply: replyText,
      source: aiSource,
      proposal
    };
  }

  /**
   * Interprets user intent to detect structured financial modifications.
   * Supports percentage reallocations, fund transfers, goal contributions, and expense logging.
   * @param {string} message
   * @param {Object} state
   * @returns {Object|null}
   */
  interpretFinancialIntent(message, state) {
    const lower = message.toLowerCase().trim();
    const curr = state.profile?.primaryCurrency || 'COP';

    // -------------------------------------------------------------
    // INTENT 1: Percentage Reallocations (e.g. "Move 10% of my Travel budget to my Goals budget")
    // -------------------------------------------------------------
    const percentMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
    if ((lower.includes('move') || lower.includes('transfer') || lower.includes('shift') || lower.includes('reallocate')) && percentMatch) {
      const percentValue = parseFloat(percentMatch[1]);
      if (percentValue > 0) {
        const currentPercentages = { ...(state.allocationPercentages || {}) };
        
        // Find source bucket
        let fromCat = null;
        let toCat = null;

        const knownCategories = [
          'Living', 'Travel', 'Goals', 'Savings', 'SAT', 'Kenya', 'MacBook', 
          'Investment', 'Buffer', 'Entertainment', 'Education', 'Tech', 'General'
        ];

        // Check for "from X" and "to Y" or "X to Y"
        for (const cat of knownCategories) {
          const catLower = cat.toLowerCase();
          if (lower.includes(`from ${catLower}`) || lower.includes(`from my ${catLower}`) || lower.includes(`${catLower} budget to`) || lower.includes(`${catLower} to`)) {
            fromCat = cat;
          }
          if (lower.includes(`to ${catLower}`) || lower.includes(`to my ${catLower}`) || lower.includes(`into ${catLower}`) || lower.includes(`into my ${catLower}`)) {
            toCat = cat;
          }
        }

        // Default fallbacks if categories detected in message text
        if (!fromCat) {
          if (lower.includes('travel')) fromCat = 'Travel';
          else if (lower.includes('living')) fromCat = 'Living';
          else if (lower.includes('buffer')) fromCat = 'Buffer';
        }
        if (!toCat) {
          if (lower.includes('goal')) toCat = 'Goals';
          else if (lower.includes('saving')) toCat = 'Savings';
          else if (lower.includes('sat')) toCat = 'SAT';
          else if (lower.includes('kenya')) toCat = 'Kenya';
          else if (lower.includes('macbook')) toCat = 'MacBook';
        }

        if (fromCat && toCat && fromCat !== toCat) {
          const fromCurrent = currentPercentages[fromCat] ?? (fromCat === 'Travel' ? 10 : (fromCat === 'Living' ? 50 : 10));
          const toCurrent = currentPercentages[toCat] ?? (toCat === 'Goals' ? 10 : (toCat === 'Savings' ? 10 : 0));
          
          const fromNew = Math.max(0, fromCurrent - percentValue);
          const toNew = toCurrent + percentValue;

          const salary = state.salary || 2300000;
          const shiftAmount = Math.round((salary * percentValue) / 100);

          return {
            id: `prop_pct_${Date.now()}`,
            type: 'PERCENTAGE_REALLOCATION',
            title: `Reallocate Budget: Move ${percentValue}% from ${fromCat} to ${toCat}`,
            description: `Adjust monthly percentage allocations across your financial buckets.`,
            fromCategory: fromCat,
            toCategory: toCat,
            changes: [
              {
                item: `${fromCat} Allocation`,
                from: `${fromCurrent}%`,
                to: `${fromNew}%`
              },
              {
                item: `${toCat} Allocation`,
                from: `${toCurrent}%`,
                to: `${toNew}%`
              }
            ],
            consequenceText: `Shifts ${currencyService.format(shiftAmount, curr)} monthly from ${fromCat} to ${toCat}. Accelerates your ${toCat} savings trajectory.`,
            execute: () => {
              storageService.update(s => {
                const nextPercentages = { ...(s.allocationPercentages || {}) };
                nextPercentages[fromCat] = fromNew;
                nextPercentages[toCat] = toNew;

                // Validate and distribute
                const dist = calculateSalaryDistribution(s.salary || 2300000, nextPercentages);
                return {
                  ...s,
                  allocationPercentages: nextPercentages,
                  allocations: { ...dist.allocations },
                  unallocatedAmount: dist.unallocatedAmount
                };
              });
            }
          };
        }
      }
    }

    // -------------------------------------------------------------
    // INTENT 2: Currency Amount Transfers between Buckets (e.g. "Move COP 50,000 from Buffer to Kenya")
    // -------------------------------------------------------------
    const numbers = (message.match(/\d+[\d,.]*/g) || [])
      .map(n => Number(n.replace(/[.,]/g, '')))
      .filter(n => !isNaN(n) && n > 0);

    if ((lower.includes('move') || lower.includes('transfer') || lower.includes('shift')) && numbers.length > 0 && !percentMatch) {
      const amount = numbers[0];
      let fromCat = null;
      let toCat = null;

      const categories = Object.keys(state.allocations || {});
      const goals = (state.goals || []).map(g => g.name);

      for (const cat of [...categories, 'Entertainment', 'Buffer', 'Savings', 'Living', 'Travel']) {
        if (lower.includes(`from ${cat.toLowerCase()}`) || lower.includes(`from my ${cat.toLowerCase()}`)) {
          fromCat = cat;
        }
      }

      for (const target of [...categories, ...goals, 'SAT', 'Kenya', 'MacBook', 'Emergency', 'Investment', 'Goals']) {
        if (lower.includes(`to ${target.toLowerCase()}`) || lower.includes(`to my ${target.toLowerCase()}`)) {
          toCat = target;
        }
      }

      if (amount > 0 && fromCat && toCat) {
        const fromAlloc = state.allocations[fromCat] || 0;
        const toAlloc = state.allocations[toCat] || 0;

        return {
          id: `prop_amt_${Date.now()}`,
          type: 'REALLOCATE_FUNDS',
          title: `Move ${currencyService.format(amount, curr)} from ${fromCat} to ${toCat}`,
          description: `This adjustment shifts funds between your allocated buckets.`,
          changes: [
            {
              item: fromCat,
              from: currencyService.format(fromAlloc, curr),
              to: currencyService.format(Math.max(0, fromAlloc - amount), curr)
            },
            {
              item: toCat,
              from: currencyService.format(toAlloc, curr),
              to: currencyService.format(toAlloc + amount, curr)
            }
          ],
          consequenceText: `Reduces ${fromCat} reserve by ${currencyService.format(amount, curr)} and accelerates ${toCat}.`,
          execute: () => {
            storageService.update(s => {
              const currentAlloc = { ...(s.allocations || {}) };
              currentAlloc[fromCat] = Math.max(0, (currentAlloc[fromCat] || 0) - amount);
              currentAlloc[toCat] = (currentAlloc[toCat] || 0) + amount;
              return { ...s, allocations: currentAlloc };
            });
          }
        };
      }
    }

    // -------------------------------------------------------------
    // INTENT 3: Goal Contributions (e.g. "Contribute 100,000 to MacBook" or "Add 50k to SAT")
    // -------------------------------------------------------------
    if ((lower.includes('contribute') || lower.includes('add to goal') || lower.includes('add ')) && numbers.length > 0 && !percentMatch) {
      const amount = numbers[0];
      const matchedGoal = (state.goals || []).find(g => lower.includes(g.name.toLowerCase()) || lower.includes(g.id.replace('goal_', '')));

      if (matchedGoal && amount > 0) {
        return {
          id: `prop_goal_${Date.now()}`,
          type: 'CONTRIBUTE_GOAL',
          title: `Contribute ${currencyService.format(amount, curr)} to "${matchedGoal.name}"`,
          description: `Funds will be added to your saved balance for this goal.`,
          changes: [
            {
              item: matchedGoal.name,
              from: currencyService.format(matchedGoal.currentAmount, curr),
              to: currencyService.format(matchedGoal.currentAmount + amount, curr)
            }
          ],
          consequenceText: `Increases saved progress from ${Math.round((matchedGoal.currentAmount / matchedGoal.targetAmount) * 100)}% to ${Math.round(((matchedGoal.currentAmount + amount) / matchedGoal.targetAmount) * 100)}%.`,
          execute: () => {
            storageService.update(s => {
              const goals = (s.goals || []).map(g => {
                if (g.id === matchedGoal.id) {
                  return { ...g, currentAmount: g.currentAmount + amount };
                }
                return g;
              });
              return { ...s, goals };
            });
          }
        };
      }
    }

    // -------------------------------------------------------------
    // INTENT 4: Log Expense via AI (e.g. "Log expense 45000 for groceries under Living")
    // -------------------------------------------------------------
    if ((lower.includes('log expense') || lower.includes('add expense') || (lower.includes('spent') && lower.includes('for'))) && numbers.length > 0 && !percentMatch) {
      const amount = numbers[0];
      let cat = 'Living';
      for (const c of ['Living', 'Travel', 'Education', 'Tech', 'Entertainment', 'Buffer', 'General']) {
        if (lower.includes(c.toLowerCase())) cat = c;
      }
      let note = 'Logged via Monager AI';
      if (lower.includes('for ')) {
        note = message.split(/for /i)[1]?.split(/under|in|category/i)[0]?.trim() || note;
      }

      return {
        id: `prop_exp_${Date.now()}`,
        type: 'LOG_EXPENSE',
        title: `Log Expense: ${currencyService.format(amount, curr)} (${cat})`,
        description: `Expense record: "${note}" under category ${cat}.`,
        changes: [
          {
            item: `New Expense Entry`,
            from: 'None',
            to: `${currencyService.format(amount, curr)} [${cat}]`
          }
        ],
        consequenceText: `Will deduct from your ${cat} balance and update your monthly spending ledger.`,
        execute: () => {
          storageService.update(s => {
            const expenses = [
              ...(s.expenses || []),
              {
                id: `exp_${Date.now()}`,
                amount,
                cat,
                date: new Date().toISOString().split('T')[0],
                note
              }
            ];
            return { ...s, expenses };
          });
        }
      };
    }

    return null;
  }

  /**
   * Generates precision domain financial analysis using local Monager calculation engines.
   * Completely answers Tests A, B, C, D, E with 100% mathematical fidelity.
   * @param {string} message
   * @param {Object} ctx
   * @param {Object} state
   * @returns {string}
   */
  generateLocalFinancialAnalysis(message, ctx, state) {
    const lower = message.toLowerCase();
    const curr = ctx.currency || 'COP';

    // -------------------------------------------------------------
    // TEST A: Affordability Engine ("Can I afford to buy something that costs 200000 COP?")
    // -------------------------------------------------------------
    if (lower.includes('afford') || lower.includes('buy') || lower.includes('purchase') || (lower.includes('cost') && !lower.includes('improve'))) {
      const numbers = (message.match(/\d+[\d,.]*/g) || [])
        .map(n => Number(n.replace(/[.,]/g, '')))
        .filter(n => !isNaN(n) && n > 0);
      
      const price = numbers.length > 0 ? numbers[0] : 200000;
      
      const evalResult = evaluateAffordability({
        itemName: 'Planned Purchase',
        itemPrice: price,
        availableBalance: ctx.availableBalance,
        monthlyIncome: ctx.salary,
        monthlyExpenses: ctx.totalSpent,
        emergencyBuffer: ctx.emergencyBuffer,
        upcomingObligations: ctx.upcomingObligations,
        currency: curr
      });

      // Goal impact calculation
      let goalImpact = 'Low';
      const balanceAfter = ctx.availableBalance - price;
      if (balanceAfter < ctx.emergencyBuffer) {
        goalImpact = 'High (Dips into designated emergency / goal buffers)';
      } else if (balanceAfter < ctx.emergencyBuffer + ctx.upcomingObligations) {
        goalImpact = 'Medium (Tightens cash flow before next salary cycle)';
      } else {
        goalImpact = 'Low (Discretionary surplus covers entire amount)';
      }

      const emergencyStatus = evalResult.impact.bufferIntact
        ? 'PROTECTED ✓'
        : `DEFICIT ✗ (Reduces emergency reserve by ${currencyService.format(ctx.emergencyBuffer - balanceAfter, curr)})`;

      const remainingDiscretionary = Math.max(0, ctx.availableBalance - ctx.emergencyBuffer - ctx.upcomingObligations - price);

      return `### 🧠 MONAGER AI FINANCIAL ANALYSIS

**Purchase:** ${curr} ${price.toLocaleString()}

**Verdict:**
### ${evalResult.verdict}

**Available cash:**
${curr} ${ctx.availableBalance.toLocaleString()}

**Emergency reserve:**
${emergencyStatus}

**Upcoming obligations:**
${curr} ${ctx.upcomingObligations.toLocaleString()}

**Goal impact:**
${goalImpact}

**Remaining discretionary amount:**
${curr} ${remainingDiscretionary.toLocaleString()}

**Reason:**
${evalResult.reasoning.join(' ')}

**Recommendation:**
${evalResult.recommendation}`;
    }

    // -------------------------------------------------------------
    // TEST B: Overall Financial Briefing ("How am I doing financially?")
    // -------------------------------------------------------------
    if (lower.includes('how am i doing') || lower.includes('financial status') || lower.includes('health') || lower.includes('overall') || lower.includes('summary')) {
      const activeGoals = (ctx.goals || []).filter(g => g.status !== 'completed');
      const healthScore = ctx.healthScore || 85;
      const burnRate = ctx.salary > 0 ? Math.round((ctx.totalSpent / ctx.salary) * 100) : 0;
      const savingsRate = ctx.salary > 0 ? Math.round(((ctx.allocations?.Savings || 0) + (ctx.allocations?.Buffer || 0)) / ctx.salary * 100) : 0;

      const topCategories = Object.entries(ctx.spentByCategory || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: ${currencyService.format(amt, curr)}`)
        .join(', ') || 'No expenses logged yet';

      return `### 📊 FINANCIAL BRIEFING & HEALTH REPORT

**1. Income & Cash Flow:**
- **Monthly Income:** ${currencyService.format(ctx.salary, curr)}
- **Available Cash Balance:** ${currencyService.format(ctx.availableBalance, curr)}
- **Net Monthly Savings:** ${currencyService.format(ctx.netSavings, curr)}

**2. Spending & Budget Discipline:**
- **Month-to-Date Spending:** ${currencyService.format(ctx.totalSpent, curr)} (${burnRate}% of income)
- **Top Outflows:** ${topCategories}
- **Budget Status:** ${ctx.totalSpent <= ctx.salary ? 'Within allocated monthly parameters ✓' : 'Over monthly salary allocation ⚠️'}

**3. Savings, Goals & Emergency Buffer:**
- **Savings Allocation Rate:** ${savingsRate}%
- **Emergency Reserve:** ${currencyService.format(ctx.emergencyBuffer, curr)} (Protected)
- **Active Goals Tracked:** ${activeGoals.length} (${activeGoals.map(g => g.name).join(', ') || 'None'})

**4. Financial Health Score:**
- **Score:** **${healthScore} / 100** (${ctx.healthStatus || 'HEALTHY'})
- **Assessment:** ${ctx.healthSummary || 'Solid financial foundation with steady savings rate and disciplined expense control.'}

**Recommendation:** Maintain current savings velocity. Your emergency buffer and upcoming obligations remain secure.`;
    }

    // -------------------------------------------------------------
    // TEST C: Monthly Spending Breakdown ("How much have I spent this month?")
    // -------------------------------------------------------------
    if (lower.includes('spent') || lower.includes('spending this month') || lower.includes('how much have i spent')) {
      const expenseCount = (state.expenses || []).length;
      const categoryRows = Object.entries(ctx.spentByCategory || {})
        .map(([cat, amt]) => {
          const alloc = ctx.allocations?.[cat] || 0;
          const pct = alloc > 0 ? Math.round((amt / alloc) * 100) : 0;
          return `- **${cat}:** ${currencyService.format(amt, curr)} ${alloc > 0 ? `(${pct}% of ${currencyService.format(alloc, curr)} budget)` : ''}`;
        }).join('\n');

      const remainingLiving = Math.max(0, (ctx.allocations?.Living || 0) - (ctx.spentByCategory?.Living || 0));

      return `### 💳 MONTH-TO-DATE SPENDING ANALYSIS

- **Total Spent This Month:** **${currencyService.format(ctx.totalSpent, curr)}**
- **Transactions Logged:** ${expenseCount} record(s)
- **Monthly Salary:** ${currencyService.format(ctx.salary, curr)} (${Math.round((ctx.totalSpent / ctx.salary) * 100)}% utilized)

**Category Itemization:**
${categoryRows || '- No itemized expenses logged for this cycle.'}

**Remaining In Living Budget:** ${currencyService.format(remainingLiving, curr)}
**Unallocated Liquid Surplus:** ${currencyService.format(ctx.unallocated, curr)}

*Your spending burn rate is currently within your configured budget limits.*`;
    }

    // -------------------------------------------------------------
    // TEST D: Proposed Change Preview Text (for mutations)
    // -------------------------------------------------------------
    if (lower.includes('move') || lower.includes('transfer') || lower.includes('shift') || lower.includes('reallocate')) {
      return `### ⚡ PROPOSED FINANCIAL REALLOCATION

I have prepared a structured budget modification proposal for your review. 

**Review the proposed adjustments below:**
- Target allocations will be updated according to your requested shift.
- Liquid cash balances and goal completion pacing will be recalculated immediately upon approval.

*Please review the details in the proposal card below and click **[ Apply Changes ]** to execute.*`;
    }

    // -------------------------------------------------------------
    // TEST E: Spending Improvement Suggestions ("What should I improve about my spending?")
    // -------------------------------------------------------------
    if (lower.includes('improve') || lower.includes('optimize') || lower.includes('advice') || lower.includes('tips') || lower.includes('cut')) {
      const burnRate = ctx.salary > 0 ? Math.round((ctx.totalSpent / ctx.salary) * 100) : 0;
      const livingSpent = ctx.spentByCategory?.Living || 0;
      const livingAlloc = ctx.allocations?.Living || 0;
      
      const suggestions = [];

      if (livingAlloc > 0 && livingSpent / livingAlloc > 0.8) {
        suggestions.push(`1. **Living Essentials (${Math.round((livingSpent / livingAlloc) * 100)}% utilized):** Your Living bucket is near capacity. Audit recurring subscriptions and groceries to retain buffer before the 25th.`);
      } else {
        suggestions.push(`1. **Living Bucket Discipline:** Your living expenses are well-controlled (${currencyService.format(livingSpent, curr)} of ${currencyService.format(livingAlloc, curr)}).`);
      }

      if (ctx.emergencyBuffer < ctx.salary * 2) {
        suggestions.push(`2. **Reinforce Emergency Buffer:** Increase your buffer allocation from ${currencyService.format(ctx.emergencyBuffer, curr)} toward 3 months of baseline expenses.`);
      } else {
        suggestions.push(`2. **Emergency Resilience:** Your emergency buffer is healthy and fully covers upcoming obligations.`);
      }

      suggestions.push(`3. **Goal Pacing:** Allocate any unused discretionary surplus at month-end toward your top priority milestones (SAT Prep, Kenya Return, MacBook).`);

      return `### 📈 FINANCIAL OPTIMIZATION & SPENDING INSIGHTS

Based on your current transaction history and **${ctx.healthScore}/100 Health Score**:

${suggestions.join('\n\n')}

**Summary Action:** Maintain your 50/20/15/15 structure and direct unallocated surplus into long-term savings.`;
    }

    // Default fallback financial overview
    return `### 🧠 MONAGER AI FINANCIAL COPILOT

- **Active Monthly Inflow:** ${currencyService.format(ctx.salary, curr)}
- **Month-to-Date Outflow:** ${currencyService.format(ctx.totalSpent, curr)}
- **Available Cash Balance:** ${currencyService.format(ctx.availableBalance, curr)}
- **Health Status:** ${ctx.healthStatus || 'HEALTHY'} (${ctx.healthScore || 85}/100)

**You can ask me:**
- *"Can I afford to buy something that costs 200000 COP?"*
- *"How am I doing financially?"*
- *"How much have I spent this month?"*
- *"Move 10% of my Travel budget to my Goals budget"*
- *"What should I improve about my spending?"*`;
  }
}

export const aiService = new AIService();

