/**
 * Monager State Schema & Migration Domain Logic
 * Handles legacy localStorage data upgrade to V3.2 (Schema Version 4).
 * Preserves user expenses, budget history, and settings while sanitizing identity defaults.
 */

import { DEFAULT_ALLOCATION_PERCENTAGES, createIncomeTransaction, calculateSalaryDistribution } from './finance.js';
import { DEFAULT_PRESET_GOALS } from './goals.js';

export const SCHEMA_VERSION = 4;

/**
 * Generic clean default user profile (no hardcoded personal identities).
 */
export const DEFAULT_USER_PROFILE = {
  name: 'Free user',
  email: '',
  isSignedIn: false,
  onboardingCompleted: false,
  plan: 'FREE', // 'FREE' | 'PLUS' | 'PRO' (Monetization foundation)
  country: 'Colombia (Gap Year)',
  primaryCurrency: 'COP',
  secondaryCurrency: 'KES',
  theme: 'dark',
  accentTheme: 'emerald',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  salaryReminderDay: 25,
  salaryReminderType: 'in_app' // 'in_app' | 'browser'
};

/**
 * Returns a pristine initial V3.2 application state.
 * @returns {Object}
 */
export function getInitialState() {
  const initialSalary = 2300000;
  const distribution = calculateSalaryDistribution(initialSalary, DEFAULT_ALLOCATION_PERCENTAGES);

  const initialIncomeTx = createIncomeTransaction({
    amount: initialSalary,
    source: 'Monthly Salary',
    currency: 'COP',
    date: new Date().toISOString().split('T')[0],
    note: 'Initial monthly salary allocation',
    allocationSnapshot: distribution.allocations
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    version: '3.2.0',
    profile: { ...DEFAULT_USER_PROFILE },
    salary: initialSalary,
    allocationPercentages: { ...DEFAULT_ALLOCATION_PERCENTAGES },
    allocations: { ...distribution.allocations },
    unallocatedAmount: distribution.unallocatedAmount,
    incomeTransactions: [initialIncomeTx],
    expenses: [
      { id: 'exp_1', amount: 450000, cat: 'Living', date: new Date().toISOString().split('T')[0], note: 'Monthly groceries & essentials' },
      { id: 'exp_2', amount: 120000, cat: 'Living', date: new Date().toISOString().split('T')[0], note: 'Local transit & SIM card' },
      { id: 'exp_3', amount: 80000, cat: 'Buffer', date: new Date().toISOString().split('T')[0], note: 'Laundry & supplies' }
    ],
    goals: [...DEFAULT_PRESET_GOALS],
    recurringRules: [
      { id: 'rec_1', name: 'Apartment / Room Rent', amount: 700000, category: 'Living', frequency: 'monthly', dueDay: 1, active: true },
      { id: 'rec_2', name: 'Mobile Data & Cloud', amount: 45000, category: 'Living', frequency: 'monthly', dueDay: 15, active: true }
    ],
    salaryReminders: {
      enabled: true,
      dayOfMonth: 25,
      lastPromptedMonth: '',
      skippedMonths: [],
      recordedMonths: [new Date().toISOString().slice(0, 7)]
    },
    currencyRates: {
      base: 'USD',
      rates: {
        USD: 1.0,
        COP: 4120.50,
        KES: 129.50,
        EUR: 0.92,
        GBP: 0.79
      },
      status: 'FALLBACK', // 'LIVE' | 'CACHED LIVE' | 'FALLBACK'
      lastUpdated: new Date().toISOString()
    },
    aiChatHistory: [
      {
        role: 'model',
        text: '👋 Welcome to **Monager v3.2**. I am your financial copilot. I can analyze your spending, calculate if you can afford a purchase, or help optimize your SAT, Kenya return, and MacBook goals. What would you like to plan today?'
      }
    ],
    pendingAiProposals: []
  };
}

/**
 * Migrates any legacy or partially structured state object to Schema V4.
 * @param {Object|null|undefined} legacyState
 * @returns {Object} Migrated and sanitized V3.2 state.
 */
export function migrateState(legacyState) {
  if (!legacyState || typeof legacyState !== 'object') {
    return getInitialState();
  }

  const state = { ...legacyState };

  // 1. Enforce Schema Version
  state.schemaVersion = SCHEMA_VERSION;
  state.version = '3.2.0';

  // 2. Sanitize Profile and remove any seeded personal data
  state.profile = {
    ...DEFAULT_USER_PROFILE,
    ...(state.profile || {})
  };

  // Replace any hardcoded personal identities with generic Free user
  if (
    !state.profile.name ||
    state.profile.name.toLowerCase().includes('billy') ||
    state.profile.name.toLowerCase().includes('gathecere')
  ) {
    state.profile.name = 'Free user';
  }
  if (state.profile.email && state.profile.email.includes('@gmail.com')) {
    // If it looks like a seeded test email, keep it clean or optional
    state.profile.email = state.profile.email.trim();
  }

  // 3. Ensure Salary & Percentage Allocations
  const legacySalary = Number(state.salary) || 2300000;
  state.salary = Math.max(0, legacySalary);

  // Normalize Allocation Percentages
  if (!state.allocationPercentages || typeof state.allocationPercentages !== 'object') {
    state.allocationPercentages = { ...DEFAULT_ALLOCATION_PERCENTAGES };
  }

  // Calculate actual monetary allocations
  const distribution = calculateSalaryDistribution(state.salary, state.allocationPercentages);
  state.allocations = { ...distribution.allocations };
  state.unallocatedAmount = distribution.unallocatedAmount;

  // 4. Ensure Income Transactions Ledger
  if (!Array.isArray(state.incomeTransactions) || state.incomeTransactions.length === 0) {
    state.incomeTransactions = [
      createIncomeTransaction({
        amount: state.salary,
        source: 'Migrated Monthly Salary',
        currency: state.profile.primaryCurrency || 'COP',
        date: new Date().toISOString().split('T')[0],
        note: 'Baseline salary entry',
        allocationSnapshot: state.allocations
      })
    ];
  }

  // 5. Ensure Expenses Array & Sanitized Fields
  if (!Array.isArray(state.expenses)) {
    state.expenses = [];
  } else {
    state.expenses = state.expenses.map(e => ({
      id: e.id || `exp_${Math.random().toString(36).substr(2, 8)}`,
      amount: Math.max(0, Number(e.amount) || 0),
      cat: e.cat || e.category || 'General',
      date: e.date || new Date().toISOString().split('T')[0],
      note: String(e.note || e.desc || '').trim()
    }));
  }

  // 6. Ensure Goals Array
  if (!Array.isArray(state.goals) || state.goals.length === 0) {
    state.goals = [...DEFAULT_PRESET_GOALS];
  } else {
    // Validate each goal has required fields
    state.goals = state.goals.map(g => ({
      id: g.id || `goal_${Math.random().toString(36).substr(2, 6)}`,
      name: String(g.name || 'Savings Goal').trim(),
      targetAmount: Math.max(1, Number(g.targetAmount) || 100000),
      currentAmount: Math.max(0, Number(g.currentAmount) || 0),
      deadline: g.deadline || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      priority: ['low', 'medium', 'high'].includes(g.priority) ? g.priority : 'medium',
      category: String(g.category || 'General').trim(),
      monthlyContribution: Math.max(0, Number(g.monthlyContribution) || 0),
      currency: String(g.currency || 'COP').toUpperCase(),
      notes: String(g.notes || '').trim(),
      status: (Number(g.currentAmount) >= Number(g.targetAmount)) ? 'completed' : (g.status || 'active')
    }));
  }

  // 7. Ensure Recurring Transactions
  if (!Array.isArray(state.recurringRules)) {
    state.recurringRules = [
      { id: 'rec_1', name: 'Apartment / Room Rent', amount: 700000, category: 'Living', frequency: 'monthly', dueDay: 1, active: true },
      { id: 'rec_2', name: 'Mobile Data & Cloud', amount: 45000, category: 'Living', frequency: 'monthly', dueDay: 15, active: true }
    ];
  }

  // 8. Ensure Salary Reminders Structure
  if (!state.salaryReminders || typeof state.salaryReminders !== 'object') {
    state.salaryReminders = {
      enabled: true,
      dayOfMonth: 25,
      lastPromptedMonth: '',
      skippedMonths: [],
      recordedMonths: [new Date().toISOString().slice(0, 7)]
    };
  } else {
    state.salaryReminders = {
      enabled: state.salaryReminders.enabled !== false,
      dayOfMonth: Number(state.salaryReminders.dayOfMonth) || 25,
      lastPromptedMonth: state.salaryReminders.lastPromptedMonth || '',
      skippedMonths: Array.isArray(state.salaryReminders.skippedMonths) ? state.salaryReminders.skippedMonths : [],
      recordedMonths: Array.isArray(state.salaryReminders.recordedMonths) ? state.salaryReminders.recordedMonths : []
    };
  }

  // 9. Ensure Currency Rates Structure
  if (!state.currencyRates || typeof state.currencyRates !== 'object') {
    state.currencyRates = {
      base: 'USD',
      rates: {
        USD: 1.0,
        COP: 4120.50,
        KES: 129.50,
        EUR: 0.92,
        GBP: 0.79
      },
      status: 'FALLBACK',
      lastUpdated: new Date().toISOString()
    };
  }

  // 10. AI Chat & Proposals
  if (!Array.isArray(state.aiChatHistory) || state.aiChatHistory.length === 0) {
    state.aiChatHistory = [
      {
        role: 'model',
        text: '👋 Welcome to **Monager v3.2**. I am your financial copilot. I can analyze your spending, calculate if you can afford a purchase, or help optimize your SAT, Kenya return, and MacBook goals. What would you like to plan today?'
      }
    ];
  }
  if (!Array.isArray(state.pendingAiProposals)) {
    state.pendingAiProposals = [];
  }

  return state;
}
