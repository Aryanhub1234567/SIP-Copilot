/** Deterministic contribution arithmetic. No return or market forecast is implied. */
export function contributionDifference(monthlyAmount: number, months: number, newAmount = 0) {
  const monthlyDifference = Math.max(0, monthlyAmount - newAmount);
  return {
    monthlyDifference,
    totalDifference: monthlyDifference * months,
    contributionsAtCurrentRate: monthlyAmount * months,
    contributionsAtNewRate: newAmount * months,
  };
}
