import { PrismaClient, RiskProfile, SipStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "aarav.demo@example.com" },
    update: { name: "Aarav Kumar", riskProfile: RiskProfile.MODERATE },
    create: { id: "demo-user-1", name: "Aarav Kumar", email: "aarav.demo@example.com", riskProfile: RiskProfile.MODERATE },
  });
  const goal = await prisma.goal.upsert({
    where: { id: "demo-goal-home" },
    update: { userId: user.id, name: "A home of your own", targetAmount: 8000000, currentAmount: 1260000, targetDate: new Date("2032-10-01") },
    create: { id: "demo-goal-home", userId: user.id, name: "A home of your own", targetAmount: 8000000, currentAmount: 1260000, targetDate: new Date("2032-10-01") },
  });

  await prisma.sip.upsert({
    where: { id: "demo-sip-1" },
    update: { userId: user.id, goalId: goal.id, fundName: "Parag Parikh Flexi Cap Fund", category: "Equity · Flexi cap", monthlyAmount: 10000, status: SipStatus.ACTIVE, nextDate: new Date("2026-10-12") },
    create: { id: "demo-sip-1", userId: user.id, goalId: goal.id, fundName: "Parag Parikh Flexi Cap Fund", category: "Equity · Flexi cap", monthlyAmount: 10000, status: SipStatus.ACTIVE, nextDate: new Date("2026-10-12") },
  });
  await prisma.sip.upsert({
    where: { id: "demo-sip-2" },
    update: { userId: user.id, goalId: null, fundName: "HDFC Balanced Advantage Fund", category: "Hybrid · Dynamic asset allocation", monthlyAmount: 5000, status: SipStatus.ACTIVE },
    create: { id: "demo-sip-2", userId: user.id, goalId: null, fundName: "HDFC Balanced Advantage Fund", category: "Hybrid · Dynamic asset allocation", monthlyAmount: 5000, status: SipStatus.ACTIVE },
  });

  const portfolio = await prisma.portfolio.upsert({
    where: { userId: user.id },
    update: { investedValue: 785000, currentValue: 842500 },
    create: { userId: user.id, investedValue: 785000, currentValue: 842500 },
  });
  for (const holding of [
    { id: "demo-holding-equity", fundName: "Diversified equity funds", assetType: "EQUITY", value: 572900, allocation: 68 },
    { id: "demo-holding-debt", fundName: "Debt funds", assetType: "DEBT", value: 202200, allocation: 24 },
    { id: "demo-holding-other", fundName: "Other assets", assetType: "OTHER", value: 67400, allocation: 8 },
  ]) {
    await prisma.holding.upsert({ where: { id: holding.id }, update: { ...holding, portfolioId: portfolio.id }, create: { ...holding, portfolioId: portfolio.id } });
  }

  await prisma.marketSnapshot.upsert({
    where: { id: "demo-market-2026-10" },
    update: { label: "Elevated volatility", summary: "Markets have been choppy over the past month", periodChange: -3.2, observedAt: new Date("2026-10-03"), expiresAt: new Date("2026-10-10") },
    create: { id: "demo-market-2026-10", source: "SYNTHETIC_DEMO", label: "Elevated volatility", summary: "Markets have been choppy over the past month", periodChange: -3.2, observedAt: new Date("2026-10-03"), expiresAt: new Date("2026-10-10") },
  });
  console.log("Seeded SIP Compass demo investor, portfolio, goal, SIPs and market context.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
