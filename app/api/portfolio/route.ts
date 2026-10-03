import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const portfolio = await prisma.portfolio.findFirst({ where: { userId }, include: { holdings: true } });
    if (!portfolio) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });
    return NextResponse.json({
      source: "database",
      portfolio: {
        invested: Number(portfolio.investedValue),
        value: Number(portfolio.currentValue),
        holdings: portfolio.holdings.map((holding) => ({ fundName: holding.fundName, assetType: holding.assetType, value: Number(holding.value), allocation: Number(holding.allocation) })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Portfolio data is temporarily unavailable." }, { status: 503 });
  }
}
