/**
 * Monager Analytics View
 * Provides deep visual telemetry into cash velocity:
 * Category breakdowns, Budget vs Actual variance, Burn rates, and Goal funding distributions.
 */

import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';
import { calculateBudgetVsActual, calculateAvailableBalance } from '../domain/finance.js';

export function renderAnalytics(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';

  const budgetInfo = calculateBudgetVsActual(state.allocations || {}, state.expenses || []);
  const balanceInfo = calculateAvailableBalance({
    startingBalance: 0,
    incomeTransactions: state.incomeTransactions || [],
    expenses: state.expenses || []
  });

  // Calculate Category-Level aggregations
  const categoryTotals = {};
  let totalExpenses = 0;
  for (const exp of state.expenses || []) {
    const cat = exp.cat || 'General';
    const amt = Number(exp.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalExpenses += amt;
  }

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in font-mono">
      
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-purple-400 font-semibold">Financial Intelligence</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">Spending & Velocity Analytics</h1>
          <p class="text-xs text-slate-400 mt-0.5">Real data-driven breakdown derived from your actual income and expense logs.</p>
        </div>
        <div class="glass-card px-4 py-2 rounded-xl border border-white/10 text-right">
          <span class="text-[10px] text-slate-400 uppercase">Savings Ratio</span>
          <div class="text-base font-bold text-emerald-400">
            ${state.salary > 0 ? Math.max(0, Math.round(((state.salary - totalExpenses) / state.salary) * 100)) : 0}%
          </div>
        </div>
      </div>

      <!-- 3 Key Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass-card p-5 rounded-2xl border border-white/10">
          <span class="text-xs text-slate-400 uppercase tracking-wider">Total Recorded Inflow</span>
          <div class="text-xl font-bold text-emerald-400 mt-1">${currencyService.format(balanceInfo.totalIncome, curr)}</div>
          <span class="text-[11px] text-slate-500">${(state.incomeTransactions || []).length} income transactions</span>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-white/10">
          <span class="text-xs text-slate-400 uppercase tracking-wider">Total Recorded Burn</span>
          <div class="text-xl font-bold text-rose-400 mt-1">${currencyService.format(totalExpenses, curr)}</div>
          <span class="text-[11px] text-slate-500">${(state.expenses || []).length} expense entries</span>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-white/10">
          <span class="text-xs text-slate-400 uppercase tracking-wider">Net Retained Cash</span>
          <div class="text-xl font-bold text-blue-400 mt-1">${currencyService.format(balanceInfo.netSavings, curr)}</div>
          <span class="text-[11px] text-slate-500">Accumulated surplus</span>
        </div>
      </div>

      <!-- Budget vs Actual Variance Table -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <span class="material-icons-outlined text-purple-400 text-lg">compare_arrows</span>
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Budget Allocation vs Actual Burn</h2>
          </div>
          <span class="text-xs text-slate-400 font-bold">${budgetInfo.overallPercentUsed}% budget utilized</span>
        </div>

        <div class="space-y-4">
          ${Object.entries(budgetInfo.categories).map(([cat, data]) => {
            let barColor = 'from-blue-500 to-emerald-400';
            if (data.isOverBudget) {
              barColor = 'from-rose-500 to-amber-500';
            } else if (data.percentUsed > 80) {
              barColor = 'from-amber-500 to-emerald-400';
            }

            return `
              <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white">${cat}</span>
                    ${data.isOverBudget ? `
                      <span class="px-2 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        OVER BUDGET (${currencyService.format(Math.abs(data.remaining), curr)})
                      </span>
                    ` : ''}
                  </div>
                  <div>
                    <span class="text-slate-300 font-bold">${currencyService.format(data.spent, curr)}</span>
                    <span class="text-slate-500">/ ${currencyService.format(data.allocated, curr)}</span>
                    <span class="text-xs text-slate-400 ml-1.5">(${data.percentUsed}%)</span>
                  </div>
                </div>

                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div class="bg-gradient-to-r ${barColor} h-2 rounded-full transition-all duration-500" style="width: ${Math.min(100, data.percentUsed)}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Itemized Expense Distribution -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-icons-outlined text-emerald-400 text-lg">pie_chart</span>
          <h2 class="text-base font-bold text-white uppercase tracking-wide">Category Expense Distribution</h2>
        </div>

        ${categoryEntries.length > 0 ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${categoryEntries.map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return `
                <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div class="flex justify-between text-xs">
                    <span class="font-bold text-slate-200">${cat}</span>
                    <span class="text-emerald-400 font-bold">${pct}%</span>
                  </div>
                  <div class="text-sm font-bold text-white mt-1">${currencyService.format(amt, curr)}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="text-center py-8 text-slate-500 text-xs">
            No expenses recorded yet to generate distribution graphs.
          </div>
        `}
      </div>

    </div>
  `;
}
