/**
 * Monager Affordability Domain Engine ("Can I Afford This?")
 * Multi-layer purchase safety evaluator considering available cash, emergency buffer,
 * upcoming obligations, active goals, and monthly cash flow.
 */

export const AFFORDABILITY_VERDICTS = {
  SAFE_TO_BUY: 'SAFE TO BUY',
  WAIT: 'WAIT',
  NOT_RECOMMENDED: 'NOT RECOMMENDED'
};

/**
 * Evaluates whether a planned purchase is safe, requires waiting, or is not recommended.
 * @param {Object} params
 * @returns {Object}
 */
export function evaluateAffordability({
  itemName = 'Item',
  itemPrice = 0,
  availableBalance = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  emergencyBuffer = 0,
  upcomingObligations = 0,
  activeGoalsCommitment = 0,
  currency = 'COP'
}) {
  const price = Math.max(0, Number(itemPrice) || 0);
  const balance = Number(availableBalance) || 0;
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const expenses = Math.max(0, Number(monthlyExpenses) || 0);
  const buffer = Math.max(0, Number(emergencyBuffer) || 0);
  const obligations = Math.max(0, Number(upcomingObligations) || 0);
  const goalsCommitted = Math.max(0, Number(activeGoalsCommitment) || 0);

  const cleanItemName = String(itemName || 'This item').trim();

  if (price <= 0) {
    return {
      verdict: AFFORDABILITY_VERDICTS.SAFE_TO_BUY,
      verdictClass: 'safe',
      color: 'emerald',
      score: 100,
      itemName: cleanItemName,
      itemPrice: 0,
      availableBalance: balance,
      balanceAfterPurchase: balance,
      maxSafeSpend: Math.max(0, balance - buffer - obligations),
      reasoning: ['Item cost is zero or negligible.'],
      recommendation: 'Safe to proceed.',
      impact: {
        bufferIntact: true,
        obligationsCovered: true,
        burnImpactPercent: 0
      }
    };
  }

  // Baseline net liquidity after mandatory reserve & upcoming bills
  const protectedReserves = buffer + obligations;
  const netAvailableCash = balance - protectedReserves;
  const balanceAfterPurchase = balance - price;
  const netCashAfterPurchase = netAvailableCash - price;

  const monthlySurplus = Math.max(0, income - expenses);

  const reasoning = [];
  let score = 0;
  let verdict = AFFORDABILITY_VERDICTS.SAFE_TO_BUY;
  let verdictClass = 'safe';
  let color = 'emerald';
  let recommendation = '';

  // Analysis Factor 1: Raw Balance vs Purchase
  if (price > balance) {
    verdict = AFFORDABILITY_VERDICTS.NOT_RECOMMENDED;
    verdictClass = 'danger';
    color = 'rose';
    score = 10;
    reasoning.push(`Purchase price (${currency} ${price.toLocaleString()}) exceeds your total available balance of ${currency} ${balance.toLocaleString()}.`);
    reasoning.push(`Shortfall: ${currency} ${(price - balance).toLocaleString()}.`);
    
    if (monthlySurplus > 0) {
      const monthsNeeded = Math.ceil((price - balance) / monthlySurplus);
      recommendation = `Not recommended immediately. At your current monthly surplus of ${currency} ${monthlySurplus.toLocaleString()}, you need approximately ${monthsNeeded} month(s) of dedicated saving.`;
    } else {
      recommendation = 'Not recommended. Expense exceeds current total assets without a positive monthly cash flow.';
    }

    return {
      verdict,
      verdictClass,
      color,
      score,
      itemName: cleanItemName,
      itemPrice: price,
      availableBalance: balance,
      balanceAfterPurchase,
      maxSafeSpend: Math.max(0, netAvailableCash),
      reasoning,
      recommendation,
      impact: {
        bufferIntact: false,
        obligationsCovered: false,
        burnImpactPercent: income > 0 ? Math.round((price / income) * 100) : 100
      }
    };
  }

  // Analysis Factor 2: Protected Buffer & Obligations Check
  const touchesObligations = balanceAfterPurchase < obligations;
  const touchesBuffer = balanceAfterPurchase < protectedReserves;

  if (touchesObligations) {
    verdict = AFFORDABILITY_VERDICTS.NOT_RECOMMENDED;
    verdictClass = 'danger';
    color = 'rose';
    score = 25;
    reasoning.push(`Purchasing "${cleanItemName}" will leave only ${currency} ${balanceAfterPurchase.toLocaleString()}, which is below your upcoming mandatory obligations (${currency} ${obligations.toLocaleString()}).`);
    recommendation = `Do not purchase yet. Keep your mandatory living and transit obligations secured first.`;
  } else if (touchesBuffer) {
    verdict = AFFORDABILITY_VERDICTS.WAIT;
    verdictClass = 'warning';
    color = 'amber';
    score = 55;
    const bufferDeficit = protectedReserves - balanceAfterPurchase;
    reasoning.push(`You have enough cash (${currency} ${balance.toLocaleString()}), but buying "${cleanItemName}" cuts into your designated emergency buffer of ${currency} ${buffer.toLocaleString()} by ${currency} ${bufferDeficit.toLocaleString()}.`);
    
    if (monthlySurplus > 0) {
      const monthsToBuffer = Math.ceil(bufferDeficit / monthlySurplus);
      recommendation = `Wait ${monthsToBuffer} month(s) to fund this purchase purely from disposable cash flow without dipping into your emergency buffer.`;
    } else {
      recommendation = `Proceed with caution or wait until your emergency buffer is replenished.`;
    }
  } else {
    // Net cash remains positive even after emergency buffer + obligations
    const priceToIncomeRatio = income > 0 ? (price / income) : 0.5;

    if (priceToIncomeRatio > 0.6) {
      // Large discretionary expense relative to monthly salary
      verdict = AFFORDABILITY_VERDICTS.WAIT;
      verdictClass = 'warning';
      color = 'amber';
      score = 70;
      reasoning.push(`You have sufficient buffer, but this purchase represents ${Math.round(priceToIncomeRatio * 100)}% of your monthly income.`);
      reasoning.push(`Post-purchase cash reserve will be ${currency} ${balanceAfterPurchase.toLocaleString()} (buffer intact).`);
      recommendation = `Consider splitting this purchase over 2 paychecks or ensuring active goals (SAT, Kenya, MacBook) stay funded.`;
    } else {
      verdict = AFFORDABILITY_VERDICTS.SAFE_TO_BUY;
      verdictClass = 'safe';
      color = 'emerald';
      score = 92;
      reasoning.push(`Full emergency buffer of ${currency} ${buffer.toLocaleString()} and obligations remain 100% protected.`);
      reasoning.push(`Remaining liquid balance after purchase: ${currency} ${balanceAfterPurchase.toLocaleString()}.`);
      recommendation = `Safe to buy! Fits comfortably within your discretionary surplus.`;
    }
  }

  return {
    verdict,
    verdictClass,
    color,
    score,
    itemName: cleanItemName,
    itemPrice: price,
    availableBalance: balance,
    balanceAfterPurchase,
    maxSafeSpend: Math.max(0, netAvailableCash),
    reasoning,
    recommendation,
    impact: {
      bufferIntact: !touchesBuffer,
      obligationsCovered: !touchesObligations,
      burnImpactPercent: income > 0 ? Math.round((price / income) * 100) : 0
    }
  };
}
