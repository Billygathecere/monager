/**
 * Monager Financial Domain Logic
 * Core percentage validation, salary distribution, budget adherence, and multi-factor health scoring.
 */

export const DEFAULT_ALLOCATION_PERCENTAGES = {
  Living: 50,
  Savings: 10,
  SAT: 10,
  Kenya: 10,
  MacBook: 10,
  Investment: 5,
  Buffer: 5
};

/**
 * Validates a dictionary of category percentage allocations.
 * @param {Object.<string, number>} percentages
 * @returns {{ valid: boolean, total: number, unallocated: number, errors: string[] }}
 */
export function validateAllocationPercentages(percentages = {}) {
  const errors = [];
  let total = 0;

  if (!percentages || typeof percentages !== 'object') {
    return { valid: false, total: 0, unallocated: 100, errors: ['Invalid percentages object'] };
  }

  const entries = Object.entries(percentages);
  if (entries.length === 0) {
    return { valid: false, total: 0, unallocated: 100, errors: ['At least one allocation category is required'] };
  }

  for (const [category, percent] of entries) {
    const val = Number(percent);
    if (isNaN(val) || val < 0) {
      errors.push(`Percentage for category "${category}" must be a non-negative number.`);
    } else if (val > 100) {
      errors.push(`Percentage for category "${category}" cannot exceed 100%.`);
    } else {
      total += val;
    }
  }

  // Precision rounding to 2 decimal places to avoid floating point issues
  total = Math.round(total * 100) / 100;
  const unallocated = Math.round((100 - total) * 100) / 100;

  if (total > 100) {
    errors.push(`Total allocation percentage (${total}%) exceeds 100% by ${Math.round((total - 100) * 100) / 100}%.`);
  }

  return {
    valid: errors.length === 0 && total <= 100,
    total,
    unallocated: Math.max(0, unallocated),
    errors
  };
}

/**
 * Automatically distributes salary across allocation buckets according to user-defined percentages.
 * @param {number} salary
 * @param {Object.<string, number>} percentages
 * @returns {{ salary: number, allocations: Object.<string, number>, totalAllocated: number, unallocatedAmount: number, valid: boolean }}
 */
export function calculateSalaryDistribution(salary, percentages = DEFAULT_ALLOCATION_PERCENTAGES) {
  const validSalary = Math.max(0, Number(salary) || 0);
  const validation = validateAllocationPercentages(percentages);

  const allocations = {};
  let totalAllocated = 0;

  for (const [category, percent] of Object.entries(percentages)) {
    const p = Math.max(0, Number(percent) || 0);
    const allocatedAmount = Math.round((validSalary * p) / 100);
    allocations[category] = allocatedAmount;
    totalAllocated += allocatedAmount;
  }

  const unallocatedAmount = Math.max(0, validSalary - totalAllocated);

  return {
    salary: validSalary,
    allocations,
    totalAllocated,
    unallocatedAmount,
    percentages,
    valid: validation.valid
  };
}

/**
 * Creates an immutable income transaction record.
 * @param {Object} params
 * @returns {Object}
 */
export function createIncomeTransaction({
  amount,
  source = 'Monthly Salary',
  currency = 'COP',
  date = new Date().toISOString().split('T')[0],
  note = '',
  allocationSnapshot = null
}) {
  const cleanAmount = Math.max(0, Number(amount) || 0);
  return {
    id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    amount: cleanAmount,
    source: String(source || 'Income').trim(),
    currency: String(currency || 'COP').toUpperCase(),
    date: date || new Date().toISOString().split('T')[0],
    note: String(note || '').trim(),
    allocationSnapshot: allocationSnapshot || null,
    createdAt: new Date().toISOString()
  };
}

/**
 * Computes available cash balance from income transactions, starting balance, and expenses.
 * @param {Object} params
 * @returns {{ startingBalance: number, totalIncome: number, totalExpenses: number, availableBalance: number, netSavings: number }}
 */
export function calculateAvailableBalance({
  startingBalance = 0,
  incomeTransactions = [],
  expenses = []
}) {
  const start = Number(startingBalance) || 0;
  const totalIncome = (incomeTransactions || []).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const availableBalance = start + totalIncome - totalExpenses;
  const netSavings = totalIncome - totalExpenses;

  return {
    startingBalance: start,
    totalIncome,
    totalExpenses,
    availableBalance,
    netSavings
  };
}

/**
 * Aggregates expenses by category.
 * @param {Array} expenses
 * @returns {Object.<string, number>}
 */
export function calculateCategoryBreakdown(expenses = []) {
  const breakdown = {};
  for (const exp of expenses || []) {
    const cat = exp.cat || exp.category || 'General';
    const amt = Number(exp.amount) || 0;
    breakdown[cat] = (breakdown[cat] || 0) + amt;
  }
  return breakdown;
}

/**
 * Evaluates budget allocations versus actual spending.
 * @param {Object.<string, number>} allocations
 * @param {Array} expenses
 * @returns {Object}
 */
export function calculateBudgetVsActual(allocations = {}, expenses = []) {
  const spentByCategory = calculateCategoryBreakdown(expenses);
  const comparison = {};
  let totalAllocated = 0;
  let totalSpent = 0;

  // Include all allocated categories
  const allCategories = new Set([...Object.keys(allocations), ...Object.keys(spentByCategory)]);

  for (const cat of allCategories) {
    const allocated = Number(allocations[cat]) || 0;
    const spent = Number(spentByCategory[cat]) || 0;
    const remaining = allocated - spent;
    const percentUsed = allocated > 0 ? Math.round((spent / allocated) * 100) : (spent > 0 ? 100 : 0);

    totalAllocated += allocated;
    totalSpent += spent;

    comparison[cat] = {
      allocated,
      spent,
      remaining,
      percentUsed,
      isOverBudget: remaining < 0
    };
  }

  return {
    categories: comparison,
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    overallPercentUsed: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0
  };
}

/**
 * Computes a transparent, multi-factor financial health score (0-100).
 * @param {Object} params
 * @returns {Object}
 */
export function calculateFinancialHealthScore({
  monthlyIncome = 0,
  monthlyExpenses = 0,
  savingsAllocated = 0,
  emergencyFundBalance = 0,
  activeGoalsCount = 0,
  goalsOnTrackCount = 0,
  investmentAllocated = 0
}) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const expenses = Math.max(0, Number(monthlyExpenses) || 0);

  // If no income recorded yet, return baseline default
  if (income === 0 && expenses === 0) {
    return {
      score: 50,
      status: 'FAIR',
      color: 'amber',
      summary: 'Baseline status: Add your monthly salary and budget to generate a live score.',
      factors: [
        { name: 'Savings Velocity', points: 15, maxPoints: 25, reason: 'Pending salary entry' },
        { name: 'Budget Discipline', points: 15, maxPoints: 25, reason: 'Pending expense data' },
        { name: 'Emergency Buffer', points: 10, maxPoints: 20, reason: 'Buffer setup in progress' },
        { name: 'Goal Progress', points: 10, maxPoints: 20, reason: 'Define your first goal' }
      ],
      disclaimer: 'Application-generated financial behavior indicator, not an official credit score or financial advice.'
    };
  }

  const factors = [];
  let score = 0;

  // Factor 1: Savings & Buffer Allocation Rate (Max 25 pts)
  const savingsRate = income > 0 ? (savingsAllocated / income) * 100 : 0;
  let savingsPoints = 0;
  let savingsReason = '';
  if (savingsRate >= 20) {
    savingsPoints = 25;
    savingsReason = `Strong savings allocation rate (${savingsRate.toFixed(1)}% of income).`;
  } else if (savingsRate >= 10) {
    savingsPoints = 18;
    savingsReason = `Moderate savings allocation (${savingsRate.toFixed(1)}% of income).`;
  } else if (savingsRate > 0) {
    savingsPoints = 10;
    savingsReason = `Low savings rate (${savingsRate.toFixed(1)}%). Consider increasing to 15-20%.`;
  } else {
    savingsPoints = 4;
    savingsReason = 'No active savings allocation detected.';
  }
  factors.push({ name: 'Savings Velocity', points: savingsPoints, maxPoints: 25, reason: savingsReason });
  score += savingsPoints;

  // Factor 2: Budget Discipline & Expense Control (Max 25 pts)
  const burnRate = income > 0 ? (expenses / income) * 100 : 100;
  let budgetPoints = 0;
  let budgetReason = '';
  if (burnRate <= 70) {
    budgetPoints = 25;
    budgetReason = `Excellent expense discipline (spent ${burnRate.toFixed(1)}% of income).`;
  } else if (burnRate <= 90) {
    budgetPoints = 18;
    budgetReason = `Balanced spending (spent ${burnRate.toFixed(1)}% of income).`;
  } else if (burnRate <= 100) {
    budgetPoints = 10;
    budgetReason = `Near budget limit (${burnRate.toFixed(1)}% spent). Low buffer remaining.`;
  } else {
    budgetPoints = 2;
    budgetReason = `Expenses exceed income by ${(burnRate - 100).toFixed(1)}%. Negative monthly cash flow.`;
  }
  factors.push({ name: 'Budget Discipline', points: budgetPoints, maxPoints: 25, reason: budgetReason });
  score += budgetPoints;

  // Factor 3: Emergency Reserve / Buffer Resilience (Max 20 pts)
  const monthlyBurn = Math.max(1, expenses || (income * 0.7));
  const emergencyMonths = emergencyFundBalance / monthlyBurn;
  let emergencyPoints = 0;
  let emergencyReason = '';
  if (emergencyMonths >= 3) {
    emergencyPoints = 20;
    emergencyReason = `Strong emergency reserve (${emergencyMonths.toFixed(1)} months of coverage).`;
  } else if (emergencyMonths >= 1) {
    emergencyPoints = 14;
    emergencyReason = `Basic buffer active (${emergencyMonths.toFixed(1)} month of expenses).`;
  } else if (emergencyFundBalance > 0) {
    emergencyPoints = 8;
    emergencyReason = 'Initial emergency buffer established; build toward 3 months of living costs.';
  } else {
    emergencyPoints = 3;
    emergencyReason = 'No designated emergency reserve fund logged.';
  }
  factors.push({ name: 'Emergency Buffer', points: emergencyPoints, maxPoints: 20, reason: emergencyReason });
  score += emergencyPoints;

  // Factor 4: Goals Progress & Velocity (Max 20 pts)
  let goalPoints = 0;
  let goalReason = '';
  if (activeGoalsCount === 0) {
    goalPoints = 10;
    goalReason = 'No active savings goals configured.';
  } else {
    const onTrackRatio = goalsOnTrackCount / activeGoalsCount;
    if (onTrackRatio >= 0.8) {
      goalPoints = 20;
      goalReason = `${goalsOnTrackCount} of ${activeGoalsCount} goals are on schedule.`;
    } else if (onTrackRatio >= 0.5) {
      goalPoints = 14;
      goalReason = `${goalsOnTrackCount} of ${activeGoalsCount} goals progressing on schedule.`;
    } else {
      goalPoints = 7;
      goalReason = 'Multiple goals are falling behind their target deadlines.';
    }
  }
  factors.push({ name: 'Goal Velocity', points: goalPoints, maxPoints: 20, reason: goalReason });
  score += goalPoints;

  // Factor 5: Investment & Future Wealth Building (Max 10 pts bonus/factor)
  const investRate = income > 0 ? (investmentAllocated / income) * 100 : 0;
  let investPoints = 0;
  let investReason = '';
  if (investRate >= 5) {
    investPoints = 10;
    investReason = `Active wealth-building allocation (${investRate.toFixed(1)}% to investments).`;
  } else if (investRate > 0) {
    investPoints = 5;
    investReason = `Initial investment allocation (${investRate.toFixed(1)}%).`;
  } else {
    investPoints = 2;
    investReason = 'No investment or long-term growth allocation yet.';
  }
  factors.push({ name: 'Investment Allocation', points: investPoints, maxPoints: 10, reason: investReason });
  score += investPoints;

  // Normalize to 100 scale
  score = Math.min(100, Math.max(0, Math.round(score)));

  let status = 'FAIR';
  let color = 'amber';
  let summary = '';

  if (score >= 80) {
    status = 'OPTIMAL';
    color = 'emerald';
    summary = 'Outstanding financial discipline. Balances robust savings, goal velocity, and buffer resilience.';
  } else if (score >= 65) {
    status = 'HEALTHY';
    color = 'green';
    summary = 'Solid financial foundation with steady savings rate and controllable expenses.';
  } else if (score >= 45) {
    status = 'FAIR';
    color = 'amber';
    summary = 'Stable foundation, but watch discretionary expenses and reinforce your emergency buffer.';
  } else {
    status = 'ATTENTION_REQUIRED';
    color = 'rose';
    summary = 'High monthly burn or low reserves. Review allocations to prioritize essentials and buffers.';
  }

  return {
    score,
    status,
    color,
    summary,
    factors,
    disclaimer: 'Application-generated financial behavior indicator, not an official credit score or financial rating.'
  };
}
