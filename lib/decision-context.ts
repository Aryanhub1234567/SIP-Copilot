import { demo } from "@/lib/demo-data";
import { contributionDifference } from "@/lib/calculations";

export function buildDemoDecisionContext(input: {
  action: "PAUSE" | "REDUCE";
  durationMonths: number;
  proposedAmount?: number;
}) {
  const amount = input.action === "PAUSE" ? 0 : (input.proposedAmount ?? 0);
  const impact = contributionDifference(demo.sip.monthlyAmount, input.durationMonths, amount);
  return {
    source: "synthetic-demo-data" as const,
    sip: { id: "demo-sip-1", fundName: demo.sip.fund, monthlyAmount: demo.sip.monthlyAmount, goalName: demo.goal.name },
    proposal: { action: input.action, durationMonths: input.durationMonths, proposedAmount: amount },
    impact,
    goal: { name: demo.goal.name, yearsRemaining: demo.goal.yearsRemaining, currentAmount: demo.goal.current, targetAmount: demo.goal.target },
    portfolio: { currentValue: demo.portfolio.value, equityPercent: demo.portfolio.equityPercent, debtPercent: demo.portfolio.debtPercent, riskProfile: "Moderate" },
    market: { label: demo.market.label, summary: demo.market.detail, periodChangePercent: demo.market.periodChange },
    caveat: "Contribution arithmetic only; no future return or goal achievement is forecast.",
  };
}
