/**
 * Monager Dashboard View
 * Delivers a concise, high-clarity financial pulse:
 * Available Balance, Monthly Burn, Financial Health indicator, Goals pacing, and Actionable Insights.
 */

import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';
import { calculateAvailableBalance, calculateFinancialHealthScore, calculateBudgetVsActual } from '../domain/finance.js';
import { calculateGoalsSummary } from '../domain/goals.js';
import { navigation } from './navigation.js';

export function renderDashboard(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';

  const balanceInfo = calculateAvailableBalance({
    startingBalance: 0,
    incomeTransactions: state.incomeTransactions || [],
    expenses: state.expenses || []
  });

  const budgetInfo = calculateBudgetVsActual(state.allocations || {}, state.expenses || []);
  const goalsInfo = calculateGoalsSummary(state.goals || []);

  const healthScore = calculateFinancialHealthScore({
    monthlyIncome: state.salary || balanceInfo.totalIncome,
    monthlyExpenses: budgetInfo.totalSpent,
    savingsAllocated: (state.allocations?.Savings || 0) + (state.allocations?.SAT || 0) + (state.allocations?.Kenya || 0) + (state.allocations?.MacBook || 0),
    emergencyFundBalance: (state.allocations?.Buffer || 0) + (state.allocations?.Savings || 0),
    activeGoalsCount: goalsInfo.totalGoals,
    goalsOnTrackCount: goalsInfo.onTrackCount,
    investmentAllocated: state.allocations?.Investment || 0
  });

  const secondaryCurr = state.profile?.secondaryCurrency || 'KES';
  const convertedBalance = currencyService.convert(balanceInfo.availableBalance, curr, secondaryCurr);

  container.innerHTML = `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      <!-- Top Overview Hero Card -->
      <div class="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden border border-white/10 shadow-2xl">
        <div class="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">Available Balance</span>
              <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-slate-300 border border-white/10">LIVE STATE</span>
            </div>
            <h1 class="text-3xl md:text-5xl font-black tracking-tight text-white font-mono">
              ${currencyService.format(balanceInfo.availableBalance, curr)}
            </h1>
            <p class="text-sm text-slate-400 mt-1 font-mono flex items-center gap-2">
              ≈ <span class="text-slate-200 font-semibold">${currencyService.format(convertedBalance, secondaryCurr)}</span>
              <span class="text-xs text-slate-500">(${curr}/${secondaryCurr} pivot)</span>
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
            <button id="dash-btn-expense" class="btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span class="material-icons-outlined text-sm">add_circle_outline</span> Log Expense
            </button>
            <button id="dash-btn-afford" class="btn-accent px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span class="material-icons-outlined text-sm">calculate</span> Can I Afford This?
            </button>
            <button id="dash-btn-ai" class="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span class="material-icons-outlined text-sm">smart_toy</span> Ask Monager AI
            </button>
          </div>
        </div>

        <!-- 3 Metric Columns -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span class="text-xs text-slate-400 font-mono">Monthly Inflow</span>
            <div class="text-lg md:text-xl font-bold text-emerald-400 mt-0.5 font-mono">
              ${currencyService.format(state.salary, curr)}
            </div>
            <span class="text-[11px] text-slate-400">Next auto-dist: 25th</span>
          </div>

          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span class="text-xs text-slate-400 font-mono">Monthly Burn (Spent)</span>
            <div class="text-lg md:text-xl font-bold text-amber-400 mt-0.5 font-mono">
              ${currencyService.format(budgetInfo.totalSpent, curr)}
            </div>
            <span class="text-[11px] text-slate-400">${budgetInfo.overallPercentUsed}% of planned budget</span>
          </div>

          <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span class="text-xs text-slate-400 font-mono">Buffer & Liquid Reserve</span>
            <div class="text-lg md:text-xl font-bold text-blue-400 mt-0.5 font-mono">
              ${currencyService.format((state.allocations?.Buffer || 0) + (state.allocations?.Savings || 0), curr)}
            </div>
            <span class="text-[11px] text-slate-400">Emergency & unallocated funds</span>
          </div>
        </div>
      </div>

      <!-- Two-Column Health & Goals Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Financial Health Score (5 cols) -->
        <div class="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons-outlined text-emerald-400 text-lg">health_and_safety</span>
                <h2 class="font-bold text-white tracking-wide text-sm uppercase font-mono">Financial Health Score</h2>
              </div>
              <span class="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-${healthScore.color}-500/20 text-${healthScore.color}-400 border border-${healthScore.color}-500/30">
                ${healthScore.status}
              </span>
            </div>

            <!-- Big Gauge / Score Display -->
            <div class="flex items-center gap-5 my-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div class="relative w-20 h-20 flex items-center justify-center rounded-full bg-slate-900 border-4 border-${healthScore.color}-500/60 shadow-inner">
                <span class="text-2xl font-black font-mono text-white">${healthScore.score}</span>
                <span class="absolute bottom-1 text-[9px] text-slate-400 font-mono">/100</span>
              </div>
              <div class="flex-1">
                <p class="text-xs text-slate-300 leading-relaxed">${healthScore.summary}</p>
              </div>
            </div>

            <!-- Factor Drilldown -->
            <div class="space-y-2 mt-4">
              ${healthScore.factors.map(f => `
                <div class="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                  <div class="flex justify-between font-mono font-semibold text-slate-200">
                    <span>${f.name}</span>
                    <span class="text-emerald-400">${f.points}/${f.maxPoints} pts</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">${f.reason}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <p class="text-[10px] text-slate-400 mt-4 pt-3 border-t border-white/5 font-mono italic">
            ${healthScore.disclaimer}
          </p>
        </div>

        <!-- Right: Active Goals & Allocations (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Active Goals Card -->
          <div class="glass-card p-6 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons-outlined text-blue-400 text-lg">flag</span>
                <h2 class="font-bold text-white tracking-wide text-sm uppercase font-mono">Active Goals Summary</h2>
              </div>
              <button id="dash-btn-view-goals" class="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1">
                View all ${goalsInfo.totalGoals} goals <span class="material-icons-outlined text-xs">arrow_forward</span>
              </button>
            </div>

            <div class="space-y-3">
              ${(state.goals || []).slice(0, 3).map(goal => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return `
                  <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
                    <div class="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 class="text-sm font-semibold text-white">${goal.name}</h4>
                        <span class="text-[11px] text-slate-400 font-mono">Target deadline: ${goal.deadline}</span>
                      </div>
                      <div class="text-right font-mono">
                        <span class="text-sm font-bold text-slate-200">${currencyService.format(goal.currentAmount, curr)}</span>
                        <span class="text-xs text-slate-400">/ ${currencyService.format(goal.targetAmount, curr)}</span>
                      </div>
                    </div>
                    <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-2">
                      <div class="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Quick Budget Distribution Snapshot -->
          <div class="glass-card p-6 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons-outlined text-purple-400 text-lg">pie_chart</span>
                <h2 class="font-bold text-white tracking-wide text-sm uppercase font-mono">Budget Allocation Plan</h2>
              </div>
              <button id="dash-btn-view-money" class="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1">
                Manage Money <span class="material-icons-outlined text-xs">arrow_forward</span>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              ${Object.entries(state.allocationPercentages || {}).map(([cat, pct]) => `
                <div class="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div class="text-[11px] text-slate-400 truncate">${cat}</div>
                  <div class="text-sm font-bold text-white mt-0.5">${pct}%</div>
                  <div class="text-[10px] text-slate-400 truncate">${currencyService.format(state.allocations?.[cat] || 0, curr)}</div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  // Attach Dashboard event handlers
  container.querySelector('#dash-btn-expense')?.addEventListener('click', () => {
    navigation.navigate('money');
  });

  container.querySelector('#dash-btn-afford')?.addEventListener('click', () => {
    navigation.navigate('affordability');
  });

  container.querySelector('#dash-btn-ai')?.addEventListener('click', () => {
    navigation.navigate('ai');
  });

  container.querySelector('#dash-btn-view-goals')?.addEventListener('click', () => {
    navigation.navigate('goals');
  });

  container.querySelector('#dash-btn-view-money')?.addEventListener('click', () => {
    navigation.navigate('money');
  });
}
