import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createSipSchema } from "@/lib/schemas";

/** Saves a user-entered SIP record for decision support; it does not contact an investment provider. */
export async function POST(request: Request) {
  try {
    const input = createSipSchema.parse(await request.json());
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const sip = await prisma.sip.create({
      data: {
        userId,
        fundName: input.fundName,
        category: input.category,
        monthlyAmount: input.monthlyAmount,
        status: "ACTIVE",
        nextDate: input.nextDate ? new Date(`${input.nextDate}T00:00:00.000Z`) : null,
      },
      select: { id: true, fundName: true, status: true },
    });

    return NextResponse.json({ sip, message: "SIP saved to your account." }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Enter a fund name, category, and valid monthly amount." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save this SIP right now." }, { status: 503 });
  }
}
