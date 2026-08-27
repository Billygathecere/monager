/**
 * Monager Money View
 * Unified financial command center:
 * Salary & Income management, automatic allocation distribution,
 * explicit percentage validation, itemized expense ledger, and recurring groundwork.
 */

import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';
import {
  validateAllocationPercentages,
  calculateSalaryDistribution,
  createIncomeTransaction,
  calculateBudgetVsActual,
  calculateAvailableBalance
} from '../domain/finance.js';

export function renderMoney(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';

  const budgetInfo = calculateBudgetVsActual(state.allocations || {}, state.expenses || []);
  const balanceInfo = calculateAvailableBalance({
    startingBalance: 0,
    incomeTransactions: state.incomeTransactions || [],
    expenses: state.expenses || []
  });

  const percentages = { ...(state.allocationPercentages || {}) };
  const validation = validateAllocationPercentages(percentages);

  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      <!-- Top Header & Balance Summary -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">Financial Ledger & Rules</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">Money Management</h1>
          <p class="text-xs text-slate-400 font-mono mt-0.5">Control salary auto-distribution, percentage allocation rules, and expenses.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="glass-card px-4 py-2 rounded-xl border border-white/10 font-mono text-right">
            <span class="text-[10px] text-slate-400 uppercase">Available Cash</span>
            <div class="text-lg font-bold text-emerald-400">${currencyService.format(balanceInfo.availableBalance, curr)}</div>
          </div>
        </div>
      </div>

      <!-- Section 1: Salary Distribution Engine -->
      <div class="glass-card p-6 rounded-2xl border border-white/10 relative">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="material-icons-outlined text-emerald-400 text-lg">payments</span>
              <h2 class="text-lg font-bold text-white font-mono uppercase tracking-wide">Monthly Salary Inflow</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">Entering your salary automatically calculates and distributes your category allocations.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">${curr}</span>
              <input type="number" id="money-salary-input" value="${state.salary || 2300000}" step="10000" min="0"
                class="bg-slate-900/80 border border-white/15 rounded-xl pl-14 pr-4 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 w-44 md:w-52" />
            </div>
            <button id="money-distribute-btn" class="btn-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider">
              Allocate
            </button>
          </div>
        </div>

        <!-- Automatic Allocation Breakdown -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 font-mono">
          ${Object.entries(percentages).map(([category, pct]) => {
            const allocatedAmt = state.allocations?.[category] || Math.round(((state.salary || 0) * pct) / 100);
            return `
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-slate-200 truncate">${category}</span>
                    <span class="text-emerald-400 text-[11px]">${pct}%</span>
                  </div>
                </div>
                <div class="mt-2">
                  <div class="text-xs font-bold text-white truncate">${currencyService.format(allocatedAmt, curr)}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Spent: ${currencyService.format(budgetInfo.categories[category]?.spent || 0, curr)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${validation.unallocated > 0 ? `
          <div class="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 flex items-center justify-between">
            <span>ℹ️ Unallocated Buffer: <strong>${validation.unallocated}%</strong> (${currencyService.format(Math.round(((state.salary || 0) * validation.unallocated) / 100), curr)})</span>
            <span class="text-[10px] text-blue-400">Available for discretionary cash</span>
          </div>
        ` : ''}
      </div>

      <!-- Section 2: Allocation Percentage Rules Customizer -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="material-icons-outlined text-purple-400 text-lg">tune</span>
            <h2 class="text-lg font-bold text-white font-mono uppercase tracking-wide">Percentage Allocation Rules</h2>
          </div>
          <div id="allocation-total-badge" class="px-3 py-1 rounded-full text-xs font-mono font-bold ${validation.valid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
            Total: ${validation.total}% ${validation.valid ? '✓ Valid' : '⚠️ Exceeds 100%'}
          </div>
        </div>

        <p class="text-xs text-slate-400 mb-6">Define your target percentages for Living, Savings, SAT, Kenya Travel, MacBook, Investment, and Emergency Buffer.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="percentage-sliders-container">
          ${Object.entries(percentages).map(([category, pct]) => `
            <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div class="flex justify-between items-center mb-1.5 font-mono">
                <span class="text-xs font-bold text-white">${category}</span>
                <span class="text-xs font-bold text-emerald-400" id="pct-label-${category}">${pct}%</span>
              </div>
              <div class="flex items-center gap-3">
                <input type="range" min="0" max="100" step="1" value="${pct}" data-cat="${category}"
                  class="pct-slider flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                <input type="number" min="0" max="100" step="1" value="${pct}" data-cat="${category}"
                  class="pct-num-input w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          `).join('')}
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button id="reset-percentages-btn" class="btn-secondary px-4 py-2 rounded-xl text-xs font-mono">
            Reset to Defaults
          </button>
          <button id="save-percentages-btn" class="btn-primary px-5 py-2 rounded-xl text-xs font-mono font-bold">
            Save Allocation Rules
          </button>
        </div>
      </div>

      <!-- Section 3: Log New Expense & Expense History Ledger -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Log Expense Form (5 cols) -->
        <div class="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/10">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-icons-outlined text-emerald-400 text-lg">add_shopping_cart</span>
            <h2 class="text-base font-bold text-white font-mono uppercase tracking-wide">Log New Expense</h2>
          </div>

          <form id="add-expense-form" class="space-y-4 font-mono">
            <div>
              <label class="text-xs text-slate-400 block mb-1">Amount (${curr})</label>
              <input type="number" id="exp-amount" required min="1" step="100" placeholder="e.g. 45000"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="text-xs text-slate-400 block mb-1">Category</label>
              <select id="exp-cat" class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                ${Object.keys(percentages).map(c => `<option value="${c}">${c}</option>`).join('')}
                <option value="General">General / Miscellaneous</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-400 block mb-1">Description / Notes</label>
              <input type="text" id="exp-note" placeholder="e.g. Groceries, SIM card, Metro"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="text-xs text-slate-400 block mb-1">Date</label>
              <input type="date" id="exp-date" value="${new Date().toISOString().split('T')[0]}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <button type="submit" class="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider mt-2">
              Record Expense
            </button>
          </form>
        </div>

        <!-- Right: Itemized Expense Ledger (7 cols) -->
        <div class="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons-outlined text-blue-400 text-lg">receipt_long</span>
                <h2 class="text-base font-bold text-white font-mono uppercase tracking-wide">Expense Ledger</h2>
              </div>
              <span class="text-xs font-mono text-slate-400">${(state.expenses || []).length} records</span>
            </div>

            <div class="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              ${(state.expenses && state.expenses.length > 0) ? state.expenses.slice().reverse().map(exp => `
                <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono hover:bg-white/[0.04] transition">
                  <div class="flex-1 min-w-0 pr-3">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] bg-white/10 text-slate-300">${exp.cat || 'General'}</span>
                      <span class="text-[11px] text-slate-400">${exp.date}</span>
                    </div>
                    <p class="text-slate-200 mt-1 truncate">${exp.note || 'Expense'}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-bold text-rose-400 whitespace-nowrap">-${currencyService.format(exp.amount, curr)}</span>
                    <button class="delete-exp-btn text-slate-500 hover:text-rose-400 transition" data-id="${exp.id}">
                      <span class="material-icons-outlined text-base">delete_outline</span>
                    </button>
                  </div>
                </div>
              `).join('') : `
                <div class="text-center py-12 text-slate-500 text-xs font-mono">
                  No expenses logged yet. Add your first expense above.
                </div>
              `}
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Event handlers
  attachMoneyEvents(container, percentages);
}

function attachMoneyEvents(container, currentPercentages) {
  const salaryInput = container.querySelector('#money-salary-input');
  const distributeBtn = container.querySelector('#money-distribute-btn');
  const addExpenseForm = container.querySelector('#add-expense-form');

  // Salary allocation button
  distributeBtn?.addEventListener('click', () => {
    const amt = Number(salaryInput.value) || 0;
    if (amt <= 0) return;

    storageService.update(state => {
      const dist = calculateSalaryDistribution(amt, state.allocationPercentages);
      const newIncomeTx = createIncomeTransaction({
        amount: amt,
        source: 'Monthly Salary',
        currency: state.profile?.primaryCurrency || 'COP',
        date: new Date().toISOString().split('T')[0],
        note: 'Manual salary allocation',
        allocationSnapshot: dist.allocations
      });

      return {
        ...state,
        salary: amt,
        allocations: dist.allocations,
        unallocatedAmount: dist.unallocatedAmount,
        incomeTransactions: [newIncomeTx, ...(state.incomeTransactions || [])]
      };
    });

    renderMoney(container);
  });

  // Slider & Number input sync for percentages
  const sliders = container.querySelectorAll('.pct-slider');
  const numInputs = container.querySelectorAll('.pct-num-input');
  const badge = container.querySelector('#allocation-total-badge');

  function updateTotals() {
    const updated = {};
    sliders.forEach(slider => {
      const cat = slider.dataset.cat;
      updated[cat] = Number(slider.value) || 0;
    });

    const val = validateAllocationPercentages(updated);
    if (badge) {
      badge.className = `px-3 py-1 rounded-full text-xs font-mono font-bold ${val.valid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`;
      badge.textContent = `Total: ${val.total}% ${val.valid ? '✓ Valid' : '⚠️ Exceeds 100%'}`;
    }
  }

  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const cat = e.target.dataset.cat;
      const numInput = container.querySelector(`.pct-num-input[data-cat="${cat}"]`);
      const label = container.querySelector(`#pct-label-${cat}`);
      if (numInput) numInput.value = e.target.value;
      if (label) label.textContent = `${e.target.value}%`;
      updateTotals();
    });
  });

  numInputs.forEach(num => {
    num.addEventListener('input', (e) => {
      const cat = e.target.dataset.cat;
      const slider = container.querySelector(`.pct-slider[data-cat="${cat}"]`);
      const label = container.querySelector(`#pct-label-${cat}`);
      if (slider) slider.value = e.target.value;
      if (label) label.textContent = `${e.target.value}%`;
      updateTotals();
    });
  });

  // Save percentage rules
  container.querySelector('#save-percentages-btn')?.addEventListener('click', () => {
    const updated = {};
    sliders.forEach(slider => {
      updated[slider.dataset.cat] = Number(slider.value) || 0;
    });

    const val = validateAllocationPercentages(updated);
    if (!val.valid) {
      alert(`Invalid percentage allocation: ${val.errors.join(' ')}`);
      return;
    }

    storageService.update(state => {
      const dist = calculateSalaryDistribution(state.salary, updated);
      return {
        ...state,
        allocationPercentages: updated,
        allocations: dist.allocations,
        unallocatedAmount: dist.unallocatedAmount
      };
    });

    renderMoney(container);
  });

  // Add Expense form
  addExpenseForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(container.querySelector('#exp-amount').value) || 0;
    const cat = container.querySelector('#exp-cat').value;
    const note = container.querySelector('#exp-note').value;
    const date = container.querySelector('#exp-date').value;

    if (amount <= 0) return;

    storageService.update(state => ({
      ...state,
      expenses: [
        ...(state.expenses || []),
        {
          id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          amount,
          cat,
          date,
          note: note.trim()
        }
      ]
    }));

    renderMoney(container);
  });

  // Delete expense buttons
  container.querySelectorAll('.delete-exp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      storageService.update(state => ({
        ...state,
        expenses: (state.expenses || []).filter(e => e.id !== id)
      }));
      renderMoney(container);
    });
  });
}
