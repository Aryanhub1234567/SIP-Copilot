import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const [sips, portfolio, owner] = await Promise.all([
    prisma.sip.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.portfolio.findUnique({
      where: { userId },
      include: { holdings: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { riskProfile: true } }),
  ]);
  const primarySip = sips[0];
  const goal = primarySip?.goalId
    ? await prisma.goal.findFirst({ where: { id: primarySip.goalId, userId } })
    : null;
  const allocation = (assetType: string) => portfolio?.holdings
    .filter((holding) => holding.assetType.toUpperCase() === assetType)
    .reduce((total, holding) => total + Number(holding.allocation), 0) ?? 0;

  return <Dashboard
    user={{ name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }}
    sip={primarySip ? {
      id: primarySip.id,
      fundName: primarySip.fundName,
      category: primarySip.category,
      monthlyAmount: Number(primarySip.monthlyAmount),
      nextDate: primarySip.nextDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "Not set",
      goal: goal ? {
        name: goal.name,
        current: Number(goal.currentAmount),
        target: Number(goal.targetAmount),
        targetYear: goal.targetDate.getFullYear(),
        yearsRemaining: Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))),
      } : null,
    } : null}
    activeSipCount={sips.length}
    riskProfile={owner?.riskProfile ?? "MODERATE"}
    portfolio={portfolio ? {
      invested: Number(portfolio.investedValue),
      value: Number(portfolio.currentValue),
      equityPercent: allocation("EQUITY"),
      debtPercent: allocation("DEBT"),
      otherPercent: allocation("OTHER"),
    } : null}
  />;
}
