import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sip = await prisma.sip.findFirst({ where: { id, userId } });
    if (!sip) return NextResponse.json({ error: "SIP not found." }, { status: 404 });
    const goal = sip.goalId ? await prisma.goal.findFirst({ where: { id: sip.goalId, userId } }) : null;
    return NextResponse.json({
      source: "database",
      sip: {
        id: sip.id,
        fund: sip.fundName,
        category: sip.category,
        monthlyAmount: Number(sip.monthlyAmount),
        status: sip.status,
        nextDate: sip.nextDate,
        linkedGoal: goal?.name ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "SIP data is temporarily unavailable." }, { status: 503 });
  }
}
