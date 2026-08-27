/**
 * Monager Goals Domain Logic
 * Manages savings targets, velocity projections, monthly contributions, and schedule delay analysis.
 */

export const DEFAULT_PRESET_GOALS = [
  {
    id: 'goal_sat',
    name: 'SAT Exams Prep & Registration',
    targetAmount: 1500000,
    currentAmount: 450000,
    deadline: '2026-11-30',
    priority: 'high',
    category: 'Education',
    monthlyContribution: 200000,
    currency: 'COP',
    notes: 'Exam registration fees, prep materials, and travel to test center.'
  },
  {
    id: 'goal_kenya',
    name: 'Kenya Transport & Return Flight',
    targetAmount: 3200000,
    currentAmount: 900000,
    deadline: '2027-02-15',
    priority: 'high',
    category: 'Travel',
    monthlyContribution: 300000,
    currency: 'COP',
    notes: 'International return ticket to Nairobi + transit buffer.'
  },
  {
    id: 'goal_macbook',
    name: 'MacBook Upgrade (Work & Study)',
    targetAmount: 5500000,
    currentAmount: 1100000,
    deadline: '2027-05-30',
    priority: 'medium',
    category: 'Tech',
    monthlyContribution: 250000,
    currency: 'COP',
    notes: 'Upgraded workstation for programming and studies.'
  },
  {
    id: 'goal_emergency',
    name: '3-Month Emergency Reserve',
    targetAmount: 3000000,
    currentAmount: 1200000,
    deadline: '2026-12-31',
    priority: 'high',
    category: 'Security',
    monthlyContribution: 200000,
    currency: 'COP',
    notes: 'Liquid emergency fund buffer.'
  }
];

/**
 * Creates a new goal data structure.
 * @param {Object} params
 * @returns {Object}
 */
export function createGoal({
  id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  name,
  targetAmount,
  currentAmount = 0,
  deadline,
  priority = 'medium',
  category = 'General',
  monthlyContribution = 0,
  currency = 'COP',
  notes = ''
}) {
  const target = Math.max(1, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);
  const contribution = Math.max(0, Number(monthlyContribution) || 0);

  return {
    id,
    name: String(name || 'Untitled Goal').trim(),
    targetAmount: target,
    currentAmount: current,
    deadline: deadline || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    category: String(category || 'General').trim(),
    monthlyContribution: contribution,
    currency: String(currency || 'COP').toUpperCase(),
    notes: String(notes || '').trim(),
    createdAt: new Date().toISOString(),
    status: current >= target ? 'completed' : 'active'
  };
}

/**
 * Calculates metrics and progress percentage for a single goal.
 * @param {Object} goal
 * @param {Date} [referenceDate=new Date()]
 * @returns {Object}
 */
export function calculateGoalProgress(goal, referenceDate = new Date()) {
  const target = Math.max(1, Number(goal.targetAmount) || 1);
  const current = Math.max(0, Number(goal.currentAmount) || 0);
  const remaining = Math.max(0, target - current);
  const progressPercent = Math.min(100, Math.round((current / target) * 100));

  // Time remaining to deadline
  const refTime = referenceDate.getTime();
  const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date(refTime + (180 * 86400000));
  const msRemaining = Math.max(0, deadlineDate.getTime() - refTime);
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(0.1, Number((daysRemaining / 30.4375).toFixed(1)));
  const roundedMonths = Math.max(1, Math.round(daysRemaining / 30.4375));

  // Required monthly savings to hit deadline
  const requiredMonthlyContribution = remaining > 0 ? Math.ceil(remaining / roundedMonths) : 0;

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: target,
    currentAmount: current,
    remainingAmount: remaining,
    progressPercent,
    isCompleted: current >= target,
    daysRemaining,
    monthsRemaining,
    requiredMonthlyContribution
  };
}

/**
 * Projects completion date and computes delay analysis for a goal.
 * @param {Object} params
 * @returns {Object}
 */
export function projectGoalCompletion({
  goal,
  monthlyVelocity = 0,
  referenceDate = new Date()
}) {
  const progress = calculateGoalProgress(goal, referenceDate);
  const plannedMonthly = Math.max(0, Number(monthlyVelocity || goal.monthlyContribution) || 0);

  if (progress.isCompleted) {
    return {
      status: 'completed',
      pace: 'completed',
      completionDate: 'Achieved',
      monthsToComplete: 0,
      daysAheadOrBehind: 0,
      delayAnalysis: `Goal "${goal.name}" is fully funded!`,
      isDelayed: false
    };
  }

  if (plannedMonthly <= 0) {
    return {
      status: 'no_velocity',
      pace: 'stalled',
      completionDate: 'No active contribution rate',
      monthsToComplete: Infinity,
      daysAheadOrBehind: -999,
      delayAnalysis: `No monthly contribution allocated. At COP 0/mo, this goal will not reach its target by ${goal.deadline}.`,
      isDelayed: true
    };
  }

  const monthsToComplete = progress.remainingAmount / plannedMonthly;
  const daysToComplete = Math.ceil(monthsToComplete * 30.4375);

  const estimatedDate = new Date(referenceDate.getTime() + (daysToComplete * 86400000));
  const deadlineDate = new Date(goal.deadline);

  const daysDifference = Math.round((deadlineDate.getTime() - estimatedDate.getTime()) / (1000 * 60 * 60 * 24));

  let pace = 'on_track';
  let isDelayed = false;
  let delayAnalysis = '';

  if (daysDifference >= 14) {
    pace = 'ahead';
    const weeksAhead = Math.round(daysDifference / 7);
    delayAnalysis = `At your current velocity of ${goal.currency} ${plannedMonthly.toLocaleString()}/mo, you are ~${weeksAhead} weeks ahead of schedule. Estimated completion: ${estimatedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`;
  } else if (daysDifference >= -7) {
    pace = 'on_track';
    delayAnalysis = `On track! Funding pace aligns with your target deadline of ${goal.deadline}.`;
  } else {
    pace = 'behind';
    isDelayed = true;
    const weeksBehind = Math.abs(Math.round(daysDifference / 7));
    const shortfallPerMonth = Math.max(0, progress.requiredMonthlyContribution - plannedMonthly);
    delayAnalysis = `Your ${goal.name} goal is approximately ${weeksBehind} week${weeksBehind === 1 ? '' : 's'} behind schedule. Increasing contributions by ${goal.currency} ${shortfallPerMonth.toLocaleString()}/mo will restore target pace.`;
  }

  return {
    status: 'projected',
    pace,
    estimatedCompletionDate: estimatedDate.toISOString().split('T')[0],
    monthsToComplete: Number(monthsToComplete.toFixed(1)),
    daysAheadOrBehind: daysDifference,
    isDelayed,
    delayAnalysis,
    requiredMonthlyContribution: progress.requiredMonthlyContribution,
    currentMonthlyVelocity: plannedMonthly
  };
}

/**
 * Calculates overall goals portfolio health.
 * @param {Array} goals
 * @returns {Object}
 */
export function calculateGoalsSummary(goals = []) {
  const active = (goals || []).filter(g => g.status !== 'archived');
  let totalTarget = 0;
  let totalSaved = 0;
  let totalMonthlyAllocation = 0;
  let onTrackCount = 0;

  for (const g of active) {
    totalTarget += Number(g.targetAmount) || 0;
    totalSaved += Number(g.currentAmount) || 0;
    totalMonthlyAllocation += Number(g.monthlyContribution) || 0;

    const proj = projectGoalCompletion({ goal: g });
    if (proj.pace === 'ahead' || proj.pace === 'on_track' || proj.pace === 'completed') {
      onTrackCount++;
    }
  }

  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return {
    totalGoals: active.length,
    completedGoals: active.filter(g => g.currentAmount >= g.targetAmount).length,
    onTrackCount,
    totalTarget,
    totalSaved,
    totalRemaining: Math.max(0, totalTarget - totalSaved),
    totalMonthlyAllocation,
    overallProgress
  };
}
