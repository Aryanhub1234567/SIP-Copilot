import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { decisionContextRequestSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const input = decisionContextRequestSchema.parse(await request.json());
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sip = await prisma.sip.findFirst({ where: { id: input.sipId, userId, status: "ACTIVE" } });
    if (!sip) return NextResponse.json({ error: "Active SIP not found." }, { status: 404 });
    const [goal, portfolio, owner] = await Promise.all([
      sip.goalId ? prisma.goal.findFirst({ where: { id: sip.goalId, userId } }) : null,
      prisma.portfolio.findUnique({ where: { userId }, include: { holdings: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { riskProfile: true } }),
    ]);
    const proposedAmount = input.action === "PAUSE" ? 0 : (input.proposedAmount ?? 0);
    const monthlyAmount = Number(sip.monthlyAmount);
    if (input.action === "REDUCE" && proposedAmount >= monthlyAmount) {
      return NextResponse.json({ error: "The new amount must be lower than the current SIP." }, { status: 400 });
    }
    const monthlyDifference = Math.max(0, monthlyAmount - proposedAmount);
    const snapshot = await prisma.marketSnapshot.findFirst({ where: { expiresAt: { gt: new Date() } }, orderBy: { observedAt: "desc" } });
    return NextResponse.json({ context: {
      source: "database",
      sip: { id: sip.id, fundName: sip.fundName, monthlyAmount, goalName: goal?.name ?? "Unlinked SIP" },
      proposal: { action: input.action, durationMonths: input.durationMonths, proposedAmount },
      impact: { monthlyDifference, totalDifference: monthlyDifference * input.durationMonths, contributionsAtCurrentRate: monthlyAmount * input.durationMonths, contributionsAtNewRate: proposedAmount * input.durationMonths },
      goal: goal ? { name: goal.name, yearsRemaining: Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))), currentAmount: Number(goal.currentAmount), targetAmount: Number(goal.targetAmount) } : null,
      portfolio: portfolio ? { currentValue: Number(portfolio.currentValue), holdings: portfolio.holdings.map((holding) => ({ fundName: holding.fundName, assetType: holding.assetType, allocation: Number(holding.allocation) })), riskProfile: owner?.riskProfile ?? "MODERATE" } : null,
      market: snapshot ? { label: snapshot.label, summary: snapshot.summary, observedAt: snapshot.observedAt } : { label: "No fresh snapshot", summary: "Market context is unavailable or stale." },
      caveat: "Contribution arithmetic only; no future return or goal achievement is forecast.",
    } });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid decision details.", details: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}
