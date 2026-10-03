import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { explainDecision } from "@/lib/ai";
import { copilotRequestSchema } from "@/lib/schemas";
import { requireUserId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { context } = copilotRequestSchema.parse(await request.json());
    if (!(await requireUserId())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const explanation = await explainDecision(context);
    return NextResponse.json({ explanation });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid decision context.", details: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Unable to explain this decision right now." }, { status: 500 });
  }
}
