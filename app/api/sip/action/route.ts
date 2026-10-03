import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUserId } from "@/lib/auth";
import { contributionDifference } from "@/lib/calculations";
import { actionRequestSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

/** This prototype records intent only. It never changes a SIP or submits a provider instruction. */
export async function POST(request: Request) {
  try {
    const input = actionRequestSchema.parse(await request.json());
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const proposedAmount = input.action === "PAUSE" ? 0 : input.proposedAmount ?? 0;
    const sip = await prisma.sip.findFirst({ where: { id: input.sipId, userId, status: "ACTIVE" } });
    if (!sip) return NextResponse.json({ error: "Active SIP not found." }, { status: 404 });
    const monthlyAmount = Number(sip.monthlyAmount);
    if (input.action === "REDUCE" && proposedAmount >= monthlyAmount) {
      return NextResponse.json({ error: "The new amount must be lower than the current SIP." }, { status: 400 });
    }
    const impact = contributionDifference(monthlyAmount, input.durationMonths, proposedAmount);
    await prisma.decisionEvent.create({ data: {
      userId,
      sipId: input.sipId,
      action: input.action,
      proposedAmount,
      durationMonths: input.durationMonths,
      contributionDelta: impact.totalDifference,
      status: "REVIEW_REQUESTED",
    } });
    return NextResponse.json({
      accepted: true,
      reviewOnly: true,
      action: input.action,
      proposedAmount,
      durationMonths: input.durationMonths,
      contributionDifference: impact.totalDifference,
      status: "REVIEW_REQUESTED",
      message: "SIP change intent saved for review. No real SIP instruction was sent.",
    }, { status: 202 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid SIP action.", details: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}
