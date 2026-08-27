/**
 * Monager Affordability View ("Can I Afford This?")
 * Interactive purchase decision engine evaluating liquid balance, emergency buffer,
 * active goals, and upcoming obligations.
 */

import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';
import { evaluateAffordability, AFFORDABILITY_VERDICTS } from '../domain/affordability.js';
import { calculateAvailableBalance, calculateBudgetVsActual } from '../domain/finance.js';

export function renderAffordability(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';

  const balanceInfo = calculateAvailableBalance({
    startingBalance: 0,
    incomeTransactions: state.incomeTransactions || [],
    expenses: state.expenses || []
  });

  const budgetInfo = calculateBudgetVsActual(state.allocations || {}, state.expenses || []);
  const emergencyBuffer = (state.allocations?.Buffer || 0) + (state.allocations?.Savings || 0);
  const upcomingObligations = (state.recurringRules || []).filter(r => r.active).reduce((a, b) => a + Number(b.amount || 0), 0);

  // Initial assessment with empty or sample item
  let currentResult = evaluateAffordability({
    itemName: 'MacBook Upgrade',
    itemPrice: 2500000,
    availableBalance: balanceInfo.availableBalance,
    monthlyIncome: state.salary,
    monthlyExpenses: budgetInfo.totalSpent,
    emergencyBuffer,
    upcomingObligations,
    currency: curr
  });

  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in font-mono">
      
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Decision Engine</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">Can I Afford This?</h1>
          <p class="text-xs text-slate-400 mt-0.5">Test any planned purchase against your real balance, emergency buffer, and active goals.</p>
        </div>
        <div class="glass-card px-4 py-2 rounded-xl border border-white/10 text-right">
          <span class="text-[10px] text-slate-400 uppercase">Available Liquid Cash</span>
          <div class="text-base font-bold text-emerald-400">${currencyService.format(balanceInfo.availableBalance, curr)}</div>
        </div>
      </div>

      <!-- Main Two Column Grid: Inputs vs Verdict -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Purchase Simulator Form (5 cols) -->
        <div class="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/10 space-y-5">
          <div class="flex items-center gap-2">
            <span class="material-icons-outlined text-emerald-400 text-lg">shopping_bag</span>
            <h2 class="text-sm font-bold text-white uppercase tracking-wide">Purchase Parameters</h2>
          </div>

          <form id="afford-calc-form" class="space-y-4 text-xs">
            <div>
              <label class="text-slate-300 block mb-1">Item or Experience Name</label>
              <input type="text" id="afford-item-name" value="${currentResult.itemName}" placeholder="e.g. MacBook Pro, Kenya Transit, Dinner"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold" />
            </div>

            <div>
              <label class="text-slate-300 block mb-1">Estimated Price (${curr})</label>
              <input type="number" id="afford-item-price" value="${currentResult.itemPrice}" min="1" step="10000" placeholder="e.g. 2500000"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold font-mono" />
            </div>

            <!-- Quick Presets -->
            <div>
              <span class="text-[11px] text-slate-400 block mb-2">Or test sample items:</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="preset-btn px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  data-name="SAT Prep Course" data-price="450000">SAT Prep (450k)</button>
                <button type="button" class="preset-btn px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  data-name="Kenya Flight Ticket" data-price="3200000">Kenya Flight (3.2M)</button>
                <button type="button" class="preset-btn px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  data-name="MacBook Upgrade" data-price="5500000">MacBook (5.5M)</button>
                <button type="button" class="preset-btn px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  data-name="Weekend Trip" data-price="350000">Weekend Trip (350k)</button>
              </div>
            </div>

            <div class="pt-2">
              <button type="submit" class="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                Evaluate Affordability
              </button>
            </div>
          </form>

          <!-- Current Reserves Reference -->
          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] space-y-1.5 text-slate-400">
            <div class="flex justify-between">
              <span>Emergency Buffer Target:</span>
              <span class="text-slate-200 font-bold">${currencyService.format(emergencyBuffer, curr)}</span>
            </div>
            <div class="flex justify-between">
              <span>Upcoming Obligations:</span>
              <span class="text-slate-200 font-bold">${currencyService.format(upcomingObligations, curr)}</span>
            </div>
            <div class="flex justify-between">
              <span>Net Disposable Surplus:</span>
              <span class="text-emerald-400 font-bold">${currencyService.format(Math.max(0, balanceInfo.availableBalance - emergencyBuffer - upcomingObligations), curr)}</span>
            </div>
          </div>
        </div>

        <!-- Right: Real-Time Affordability Verdict (7 cols) -->
        <div class="lg:col-span-7 glass-card p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col justify-between" id="verdict-container">
          ${renderVerdictCard(currentResult, curr)}
        </div>

      </div>

    </div>
  `;

  attachAffordabilityEvents(container, balanceInfo, emergencyBuffer, upcomingObligations, curr);
}

function renderVerdictCard(res, curr) {
  let badgeColor = 'emerald';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  let icon = 'check_circle';

  if (res.verdict === AFFORDABILITY_VERDICTS.WAIT) {
    badgeColor = 'amber';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    icon = 'hourglass_top';
  } else if (res.verdict === AFFORDABILITY_VERDICTS.NOT_RECOMMENDED) {
    badgeColor = 'rose';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    icon = 'cancel';
  }

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase tracking-widest text-slate-400">Affordability Analysis</span>
        <div class="px-3.5 py-1 rounded-full text-xs font-bold font-mono border ${badgeBg} flex items-center gap-1.5">
          <span class="material-icons-outlined text-sm">${icon}</span>
          <span>${res.verdict}</span>
        </div>
      </div>

      <!-- Big Item & Score Banner -->
      <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs text-slate-400">Target Item</span>
          <h3 class="text-xl font-bold text-white mt-0.5">${res.itemName}</h3>
          <span class="text-sm font-mono font-bold text-slate-300">${currencyService.format(res.itemPrice, curr)}</span>
        </div>
        <div class="text-left sm:text-right font-mono">
          <span class="text-xs text-slate-400">Balance After Purchase</span>
          <div class="text-xl font-bold ${res.balanceAfterPurchase >= 0 ? 'text-slate-200' : 'text-rose-400'}">
            ${currencyService.format(res.balanceAfterPurchase, curr)}
          </div>
          <span class="text-[11px] text-slate-500">Max safe spend: ${currencyService.format(res.maxSafeSpend, curr)}</span>
        </div>
      </div>

      <!-- Reasoning Factor Points -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Detailed Financial Assessment</h4>
        ${res.reasoning.map(r => `
          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 flex items-start gap-2">
            <span class="material-icons-outlined text-xs text-emerald-400 mt-0.5">arrow_forward</span>
            <span>${r}</span>
          </div>
        `).join('')}
      </div>

      <!-- Recommendation Card -->
      <div class="p-4 rounded-xl bg-${badgeColor}-500/10 border border-${badgeColor}-500/20 text-xs text-${badgeColor}-200 leading-relaxed">
        <div class="flex items-start gap-2">
          <span class="material-icons-outlined text-base text-${badgeColor}-400">lightbulb</span>
          <div>
            <strong class="block mb-0.5 font-bold uppercase">Strategic Next Move:</strong>
            <span>${res.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachAffordabilityEvents(container, balanceInfo, emergencyBuffer, upcomingObligations, curr) {
  const form = container.querySelector('#afford-calc-form');
  const nameInput = container.querySelector('#afford-item-name');
  const priceInput = container.querySelector('#afford-item-price');
  const verdictContainer = container.querySelector('#verdict-container');

  function calculate() {
    const state = storageService.getState();
    const budgetInfo = calculateBudgetVsActual(state.allocations || {}, state.expenses || []);
    const name = nameInput.value;
    const price = Number(priceInput.value) || 0;

    const result = evaluateAffordability({
      itemName: name,
      itemPrice: price,
      availableBalance: balanceInfo.availableBalance,
      monthlyIncome: state.salary,
      monthlyExpenses: budgetInfo.totalSpent,
      emergencyBuffer,
      upcomingObligations,
      currency: curr
    });

    if (verdictContainer) {
      verdictContainer.innerHTML = renderVerdictCard(result, curr);
    }
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  priceInput?.addEventListener('input', calculate);
  nameInput?.addEventListener('input', calculate);

  // Preset buttons
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nameInput.value = btn.dataset.name;
      priceInput.value = btn.dataset.price;
      calculate();
    });
  });
}
