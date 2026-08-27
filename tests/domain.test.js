/**
 * Monager Automated Domain Test Suite (V3.2)
 * Tests percentage validation, salary distribution, goals projections,
 * affordability engine, health scores, and state migrations.
 */

import assert from 'assert';
import {
  validateAllocationPercentages,
  calculateSalaryDistribution,
  createIncomeTransaction,
  calculateAvailableBalance,
  calculateBudgetVsActual,
  calculateFinancialHealthScore,
  DEFAULT_ALLOCATION_PERCENTAGES
} from '../src/domain/finance.js';

import {
  createGoal,
  calculateGoalProgress,
  projectGoalCompletion,
  calculateGoalsSummary
} from '../src/domain/goals.js';

import {
  evaluateAffordability,
  AFFORDABILITY_VERDICTS
} from '../src/domain/affordability.js';

import {
  migrateState,
  getInitialState,
  SCHEMA_VERSION
} from '../src/domain/migrate.js';

import { authService, AUTH_STATUS } from '../src/services/auth.js';
import { storageService } from '../src/services/storage.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('  RUNNING MONAGER V3.2 DOMAIN TESTS');
console.log('========================================\n');

// 1. Percentage Allocation Tests
console.log('1. Financial Domain: Percentage Allocations');

runTest('Validates default allocations summing to 100%', () => {
  const result = validateAllocationPercentages(DEFAULT_ALLOCATION_PERCENTAGES);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.total, 100);
  assert.strictEqual(result.unallocated, 0);
  assert.strictEqual(result.errors.length, 0);
});

runTest('Validates allocation summing to less than 100% with unallocated buffer', () => {
  const custom = { Living: 50, Savings: 20, Travel: 10 };
  const result = validateAllocationPercentages(custom);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.total, 80);
  assert.strictEqual(result.unallocated, 20);
});

runTest('Rejects allocation exceeding 100%', () => {
  const over = { Living: 60, Savings: 30, Travel: 20 };
  const result = validateAllocationPercentages(over);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.total, 110);
  assert(result.errors.length > 0);
});

runTest('Calculates monetary distribution accurately for COP 2,000,000', () => {
  const salary = 2000000;
  const dist = calculateSalaryDistribution(salary, DEFAULT_ALLOCATION_PERCENTAGES);
  assert.strictEqual(dist.salary, 2000000);
  assert.strictEqual(dist.allocations.Living, 1000000); // 50%
  assert.strictEqual(dist.allocations.Savings, 200000);  // 10%
  assert.strictEqual(dist.allocations.SAT, 200000);      // 10%
  assert.strictEqual(dist.allocations.Kenya, 200000);    // 10%
  assert.strictEqual(dist.allocations.MacBook, 200000);  // 10%
  assert.strictEqual(dist.allocations.Investment, 100000); // 5%
  assert.strictEqual(dist.allocations.Buffer, 100000);     // 5%
  assert.strictEqual(dist.totalAllocated, 2000000);
  assert.strictEqual(dist.unallocatedAmount, 0);
});

runTest('Computes available cash balance and net savings', () => {
  const incomeTransactions = [
    { amount: 2000000 },
    { amount: 300000 }
  ];
  const expenses = [
    { amount: 800000 },
    { amount: 250000 }
  ];
  const balance = calculateAvailableBalance({ startingBalance: 500000, incomeTransactions, expenses });
  assert.strictEqual(balance.totalIncome, 2300000);
  assert.strictEqual(balance.totalExpenses, 1050000);
  assert.strictEqual(balance.availableBalance, 1750000); // 500k + 2.3M - 1.05M
  assert.strictEqual(balance.netSavings, 1250000);
});

runTest('Calculates budget vs actual and detects over-budget categories', () => {
  const allocations = { Living: 1000000, Travel: 300000 };
  const expenses = [
    { cat: 'Living', amount: 800000 },
    { cat: 'Travel', amount: 350000 }
  ];
  const report = calculateBudgetVsActual(allocations, expenses);
  assert.strictEqual(report.categories.Living.remaining, 200000);
  assert.strictEqual(report.categories.Living.isOverBudget, false);
  assert.strictEqual(report.categories.Travel.remaining, -50000);
  assert.strictEqual(report.categories.Travel.isOverBudget, true);
});

// 2. Financial Health Tests
console.log('\n2. Financial Domain: Multi-Factor Health Scoring');

runTest('Calculates high health score for disciplined budget & active savings', () => {
  const health = calculateFinancialHealthScore({
    monthlyIncome: 2500000,
    monthlyExpenses: 1200000,
    savingsAllocated: 500000,
    emergencyFundBalance: 4000000,
    activeGoalsCount: 3,
    goalsOnTrackCount: 3,
    investmentAllocated: 150000
  });
  assert(health.score >= 80, `Expected score >= 80, got ${health.score}`);
  assert.strictEqual(health.status, 'OPTIMAL');
  assert.strictEqual(health.color, 'emerald');
  assert.strictEqual(health.factors.length, 5);
});

runTest('Flags low score when expenses exceed income', () => {
  const health = calculateFinancialHealthScore({
    monthlyIncome: 2000000,
    monthlyExpenses: 2400000,
    savingsAllocated: 0,
    emergencyFundBalance: 100000,
    activeGoalsCount: 2,
    goalsOnTrackCount: 0,
    investmentAllocated: 0
  });
  assert(health.score < 50, `Expected score < 50, got ${health.score}`);
  assert.strictEqual(health.status, 'ATTENTION_REQUIRED');
  assert.strictEqual(health.color, 'rose');
});

// 3. Goals Domain Tests
console.log('\n3. Goals Domain: Progress, Velocity & Delay Analysis');

runTest('Calculates goal progress and required monthly contribution', () => {
  const refDate = new Date('2026-08-01');
  const goal = createGoal({
    name: 'SAT Exams',
    targetAmount: 1200000,
    currentAmount: 600000,
    deadline: '2026-11-01', // 3 months
    monthlyContribution: 200000
  });

  const progress = calculateGoalProgress(goal, refDate);
  assert.strictEqual(progress.progressPercent, 50);
  assert.strictEqual(progress.remainingAmount, 600000);
  assert(progress.monthsRemaining >= 2.9 && progress.monthsRemaining <= 3.2);
  assert.strictEqual(progress.requiredMonthlyContribution, 200000);
});

runTest('Projects delay and generates actionable analysis when pace is slow', () => {
  const refDate = new Date('2026-08-01');
  const goal = createGoal({
    name: 'MacBook Pro',
    targetAmount: 5000000,
    currentAmount: 1000000,
    deadline: '2026-12-01', // 4 months remaining to save 4,000,000 (needs 1,000,000/mo)
    monthlyContribution: 300000 // only saving 300,000/mo -> delayed
  });

  const projection = projectGoalCompletion({ goal, monthlyVelocity: 300000, referenceDate: refDate });
  assert.strictEqual(projection.pace, 'behind');
  assert.strictEqual(projection.isDelayed, true);
  assert(projection.delayAnalysis.includes('behind schedule'));
});

// 4. Affordability Engine Tests
console.log('\n4. Affordability Engine: "Can I Afford This?"');

runTest('Returns SAFE TO BUY when cash flow & emergency buffer remain protected', () => {
  const result = evaluateAffordability({
    itemName: 'Noise Cancelling Headphones',
    itemPrice: 350000,
    availableBalance: 3000000,
    monthlyIncome: 2300000,
    monthlyExpenses: 1200000,
    emergencyBuffer: 1000000,
    upcomingObligations: 500000
  });
  assert.strictEqual(result.verdict, AFFORDABILITY_VERDICTS.SAFE_TO_BUY);
  assert.strictEqual(result.verdictClass, 'safe');
  assert.strictEqual(result.balanceAfterPurchase, 2650000);
  assert.strictEqual(result.impact.bufferIntact, true);
});

runTest('Returns WAIT when purchase requires dipping into emergency buffer', () => {
  const result = evaluateAffordability({
    itemName: 'MacBook Upgrade',
    itemPrice: 2000000,
    availableBalance: 2500000,
    monthlyIncome: 2000000,
    monthlyExpenses: 1200000,
    emergencyBuffer: 1000000,
    upcomingObligations: 200000
  });
  // Balance after purchase: 500k. Buffer + obligations = 1.2M. Deficit = 700k into buffer.
  assert.strictEqual(result.verdict, AFFORDABILITY_VERDICTS.WAIT);
  assert.strictEqual(result.verdictClass, 'warning');
  assert.strictEqual(result.impact.bufferIntact, false);
  assert(result.reasoning.some(r => r.includes('emergency buffer')));
});

runTest('Returns NOT RECOMMENDED when price exceeds total available balance', () => {
  const result = evaluateAffordability({
    itemName: 'International Flight',
    itemPrice: 4000000,
    availableBalance: 1500000,
    monthlyIncome: 2000000,
    monthlyExpenses: 1400000,
    emergencyBuffer: 500000
  });
  assert.strictEqual(result.verdict, AFFORDABILITY_VERDICTS.NOT_RECOMMENDED);
  assert.strictEqual(result.verdictClass, 'danger');
  assert(result.reasoning.some(r => r.includes('exceeds your total available balance')));
});

// 5. State Schema & Migration Tests
console.log('\n5. State Schema & Migration');

runTest('Migrates legacy raw state and cleans seeded personal identities', () => {
  const legacyState = {
    salary: 2100000,
    profile: {
      name: 'Billy Gathecere',
      email: 'bgathecere2@gmail.com'
    },
    expenses: [
      { amount: 150000, cat: 'Living', note: 'Dinner' }
    ]
  };

  const migrated = migrateState(legacyState);
  assert.strictEqual(migrated.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(migrated.profile.name, 'Free user'); // Identity sanitized
  assert.strictEqual(migrated.salary, 2100000);
  assert(Array.isArray(migrated.incomeTransactions));
  assert.strictEqual(migrated.incomeTransactions.length, 1);
  assert.strictEqual(migrated.incomeTransactions[0].amount, 2100000);
  assert(Array.isArray(migrated.goals));
  assert(migrated.goals.length >= 4); // Default preset goals initialized
  assert.strictEqual(migrated.expenses[0].amount, 150000);
});

// 6. Monager Appearance & Currency Settings Verification
console.log('\n6. Appearance, Currency & Identity Baseline Verification');

runTest('Pristine state initializes with complete appearance & currency metadata', () => {
  const state = getInitialState();
  assert.strictEqual(state.profile.primaryCurrency, 'COP');
  assert.strictEqual(state.profile.secondaryCurrency, 'KES');
  assert.strictEqual(state.profile.theme, 'dark');
  assert.strictEqual(state.profile.accentTheme, 'emerald');
  assert.strictEqual(state.profile.plan, 'FREE');
  assert.strictEqual(state.profile.isSignedIn, false);
  assert.strictEqual(state.profile.onboardingCompleted, false);
});

// 7. Auth, Session & Onboarding Lifecycle Verification
console.log('\n7. Auth, Session & Onboarding Lifecycle');

runTest('Initial guest session defaults to unauthenticated state', () => {
  const session = authService.getSession();
  assert.strictEqual(typeof session.isSignedIn, 'boolean');
  assert.strictEqual(session.plan, 'FREE');
  assert.strictEqual(typeof session.status, 'string');
});

runTest('Signs in user and transitions session to active local session', () => {
  const res = authService.signIn({ email: 'alex@example.com', name: 'Alex Rivera', rememberMe: true });
  assert.strictEqual(res.success, true);
  const session = authService.getSession();
  assert.strictEqual(session.isSignedIn, true);
  assert.strictEqual(session.email, 'alex@example.com');
  assert.strictEqual(session.name, 'Alex Rivera');
  assert.strictEqual(session.status, AUTH_STATUS.LOCAL_ACTIVE);
});

runTest('Completes onboarding setup with salary allocation and custom goal', () => {
  const res = authService.completeOnboarding({
    name: 'Elena Rostova',
    email: 'elena@example.com',
    primaryCurrency: 'USD',
    salary: 4500,
    initialGoal: {
      name: 'Relocation Fund',
      targetAmount: 12000,
      category: 'Savings',
      deadline: '2027-01-01'
    }
  });
  assert.strictEqual(res.success, true);
  const session = authService.getSession();
  assert.strictEqual(session.isSignedIn, true);
  assert.strictEqual(session.name, 'Elena Rostova');
  assert.strictEqual(session.primaryCurrency, 'USD');

  const state = storageService.getState();
  assert.strictEqual(state.salary, 4500);
  assert.strictEqual(state.goals[0].name, 'Relocation Fund');
  assert.strictEqual(state.goals[0].targetAmount, 12000);
  assert(state.incomeTransactions.length >= 1);
});

runTest('Signs out user: preserves financial records and reverts to guest mode', () => {
  const stateBefore = storageService.getState();
  const txCountBefore = stateBefore.incomeTransactions.length;
  const goalsCountBefore = stateBefore.goals.length;

  const res = authService.signOut();
  assert.strictEqual(res.success, true);

  const session = authService.getSession();
  assert.strictEqual(session.isSignedIn, false);
  assert.strictEqual(session.status, AUTH_STATUS.GUEST);

  const stateAfter = storageService.getState();
  assert.strictEqual(stateAfter.incomeTransactions.length, txCountBefore);
  assert.strictEqual(stateAfter.goals.length, goalsCountBefore);
});


console.log('\n========================================');
console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
