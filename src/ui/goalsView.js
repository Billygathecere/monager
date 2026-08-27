/**
 * Monager Goals View
 * Dedicated Goals Management Dashboard:
 * Visual progress tracking, target dates, monthly contribution velocities,
 * and automated delay analysis explaining pace vs deadlines.
 */

import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';
import {
  createGoal,
  calculateGoalProgress,
  projectGoalCompletion,
  calculateGoalsSummary
} from '../domain/goals.js';

export function renderGoals(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';
  const goals = state.goals || [];
  const summary = calculateGoalsSummary(goals);

  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      <!-- Top Header & Summary Stats -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-blue-400 font-mono font-semibold">Strategic Savings Targets</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">Financial Goals</h1>
          <p class="text-xs text-slate-400 font-mono mt-0.5">Track your milestones: SAT exams, return transport, workstation upgrades, and emergency buffer.</p>
        </div>
        <div>
          <button id="open-create-goal-btn" class="btn-primary px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <span class="material-icons-outlined text-sm">add</span> Create New Goal
          </button>
        </div>
      </div>

      <!-- Overview Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div class="glass-card p-4 rounded-xl border border-white/10">
          <span class="text-[11px] text-slate-400">Total Saved Across Goals</span>
          <div class="text-lg font-bold text-emerald-400 mt-1">${currencyService.format(summary.totalSaved, curr)}</div>
          <span class="text-[10px] text-slate-500">${summary.overallProgress}% of target portfolio</span>
        </div>

        <div class="glass-card p-4 rounded-xl border border-white/10">
          <span class="text-[11px] text-slate-400">Total Portfolio Target</span>
          <div class="text-lg font-bold text-white mt-1">${currencyService.format(summary.totalTarget, curr)}</div>
          <span class="text-[10px] text-slate-500">${currencyService.format(summary.totalRemaining, curr)} remaining</span>
        </div>

        <div class="glass-card p-4 rounded-xl border border-white/10">
          <span class="text-[11px] text-slate-400">Monthly Contribution Pace</span>
          <div class="text-lg font-bold text-blue-400 mt-1">${currencyService.format(summary.totalMonthlyAllocation, curr)}/mo</div>
          <span class="text-[10px] text-slate-500">Planned auto-savings</span>
        </div>

        <div class="glass-card p-4 rounded-xl border border-white/10">
          <span class="text-[11px] text-slate-400">Schedule Health</span>
          <div class="text-lg font-bold text-emerald-400 mt-1">${summary.onTrackCount} of ${summary.totalGoals} On Track</div>
          <span class="text-[10px] text-slate-500">Velocity vs Deadlines</span>
        </div>
      </div>

      <!-- Goal Cards List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="goals-card-list">
        ${goals.map(goal => {
          const progress = calculateGoalProgress(goal);
          const projection = projectGoalCompletion({ goal });

          let paceBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          if (projection.pace === 'behind') {
            paceBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          } else if (projection.pace === 'stalled') {
            paceBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          }

          return `
            <div class="glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
              <div class="space-y-4">
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-white/10 text-slate-300 uppercase">${goal.category || 'General'}</span>
                      <span class="px-2 py-0.5 text-[10px] font-mono rounded border ${paceBadgeClass} uppercase font-bold">${projection.pace}</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mt-1">${goal.name}</h3>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="delete-goal-btn p-1 text-slate-500 hover:text-rose-400 transition" data-id="${goal.id}" title="Delete goal">
                      <span class="material-icons-outlined text-base">delete_outline</span>
                    </button>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div>
                  <div class="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span class="text-slate-400">Progress: <strong class="text-white">${progress.progressPercent}%</strong></span>
                    <span class="text-slate-300 font-bold">${currencyService.format(goal.currentAmount, curr)} / ${currencyService.format(goal.targetAmount, curr)}</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500" style="width: ${progress.progressPercent}%"></div>
                  </div>
                </div>

                <!-- Monthly Metrics & Pacing -->
                <div class="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span class="text-[10px] text-slate-400 block">Target Deadline</span>
                    <span class="text-slate-200 font-semibold">${goal.deadline || 'No deadline'}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 block">Required Velocity</span>
                    <span class="text-emerald-400 font-semibold">${currencyService.format(progress.requiredMonthlyContribution, curr)}/mo</span>
                  </div>
                </div>

                <!-- Delay Analysis & AI Pace Insight -->
                <div class="p-3 rounded-xl ${projection.isDelayed ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' : 'bg-white/[0.02] border border-white/5 text-slate-300'} text-xs leading-relaxed">
                  <div class="flex items-start gap-2">
                    <span class="material-icons-outlined text-sm mt-0.5 ${projection.isDelayed ? 'text-rose-400' : 'text-blue-400'}">
                      ${projection.isDelayed ? 'warning' : 'insights'}
                    </span>
                    <span>${projection.delayAnalysis}</span>
                  </div>
                </div>

              </div>

              <!-- Action Bar (Contribute Funds) -->
              <div class="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <input type="number" step="10000" min="1" placeholder="Amount" data-goal-id="${goal.id}"
                    class="contribute-input w-28 bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500" />
                  <button class="contribute-btn btn-secondary px-3 py-1.5 rounded-lg text-xs font-mono font-bold" data-id="${goal.id}">
                    + Add Saved
                  </button>
                </div>
                <span class="text-[11px] font-mono text-slate-400">${progress.monthsRemaining} mos left</span>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- Create Goal Modal (Hidden by Default) -->
      <div id="create-goal-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="glass-card max-w-lg w-full p-6 md:p-8 rounded-2xl border border-white/15 shadow-2xl animate-fade-in font-mono">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white uppercase tracking-wider">Create Savings Goal</h3>
            <button id="close-goal-modal-btn" class="text-slate-400 hover:text-white">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <form id="create-goal-form" class="space-y-4 text-xs">
            <div>
              <label class="text-slate-300 block mb-1">Goal Name</label>
              <input type="text" id="goal-name-input" required placeholder="e.g. MacBook Pro, Kenya Flight, SAT Exam"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-slate-300 block mb-1">Target Amount (${curr})</label>
                <input type="number" id="goal-target-input" required min="1" step="10000" placeholder="e.g. 3000000"
                  class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="text-slate-300 block mb-1">Currently Saved (${curr})</label>
                <input type="number" id="goal-current-input" value="0" min="0" step="10000"
                  class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-slate-300 block mb-1">Target Deadline</label>
                <input type="date" id="goal-deadline-input" required value="${new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0]}"
                  class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="text-slate-300 block mb-1">Monthly Planned Velocity</label>
                <input type="number" id="goal-monthly-input" min="0" step="10000" placeholder="e.g. 250000"
                  class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label class="text-slate-300 block mb-1">Category & Priority</label>
              <div class="grid grid-cols-2 gap-3">
                <select id="goal-cat-input" class="bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white">
                  <option value="Education">Education (SAT / Studies)</option>
                  <option value="Travel">Travel & Flights (Kenya)</option>
                  <option value="Tech">Tech (MacBook / Gear)</option>
                  <option value="Security">Emergency Reserve</option>
                  <option value="Investment">Investment & Wealth</option>
                  <option value="General">General Milestone</option>
                </select>
                <select id="goal-priority-input" class="bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white">
                  <option value="high">High Priority</option>
                  <option value="medium" selected>Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" id="cancel-goal-modal-btn" class="btn-secondary px-4 py-2.5 rounded-xl">
                Cancel
              </button>
              <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider">
                Save Goal
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `;

  attachGoalsEvents(container);
}

function attachGoalsEvents(container) {
  const modal = container.querySelector('#create-goal-modal');
  const openBtn = container.querySelector('#open-create-goal-btn');
  const closeBtn = container.querySelector('#close-goal-modal-btn');
  const cancelBtn = container.querySelector('#cancel-goal-modal-btn');
  const form = container.querySelector('#create-goal-form');

  openBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
  cancelBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  // Submit Goal
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#goal-name-input').value;
    const targetAmount = Number(container.querySelector('#goal-target-input').value) || 0;
    const currentAmount = Number(container.querySelector('#goal-current-input').value) || 0;
    const deadline = container.querySelector('#goal-deadline-input').value;
    const monthlyContribution = Number(container.querySelector('#goal-monthly-input').value) || 0;
    const category = container.querySelector('#goal-cat-input').value;
    const priority = container.querySelector('#goal-priority-input').value;

    const newGoal = createGoal({
      name,
      targetAmount,
      currentAmount,
      deadline,
      monthlyContribution,
      category,
      priority
    });

    storageService.update(state => ({
      ...state,
      goals: [...(state.goals || []), newGoal]
    }));

    modal?.classList.add('hidden');
    renderGoals(container);
  });

  // Contribute to Goal
  container.querySelectorAll('.contribute-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.id;
      const input = container.querySelector(`.contribute-input[data-goal-id="${goalId}"]`);
      const amount = Number(input?.value) || 0;
      if (amount <= 0) return;

      storageService.update(state => ({
        ...state,
        goals: (state.goals || []).map(g => {
          if (g.id === goalId) {
            const nextAmount = (Number(g.currentAmount) || 0) + amount;
            return {
              ...g,
              currentAmount: nextAmount,
              status: nextAmount >= g.targetAmount ? 'completed' : 'active'
            };
          }
          return g;
        })
      }));

      renderGoals(container);
    });
  });

  // Delete Goal
  container.querySelectorAll('.delete-goal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.id;
      if (!confirm('Are you sure you want to delete this goal?')) return;

      storageService.update(state => ({
        ...state,
        goals: (state.goals || []).filter(g => g.id !== goalId)
      }));

      renderGoals(container);
    });
  });
}
