import { z } from "zod";

export const decisionContextRequestSchema = z.object({
  sipId: z.string().min(1).max(100),
  action: z.enum(["PAUSE", "REDUCE"]),
  durationMonths: z.number().int().min(1).max(12),
  proposedAmount: z.number().finite().nonnegative().optional(),
}).superRefine((input, ctx) => {
  if (input.action === "REDUCE" && input.proposedAmount === undefined) {
    ctx.addIssue({ code: "custom", path: ["proposedAmount"], message: "A new monthly amount is required for a reduction." });
  }
});

export const actionRequestSchema = decisionContextRequestSchema.safeExtend({
  action: z.enum(["PAUSE", "REDUCE"]),
});

export const createSipSchema = z.object({
  fundName: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(100),
  monthlyAmount: z.number().finite().positive().max(100_000_000),
  nextDate: z.string().date().optional().or(z.literal("")),
});

export const copilotRequestSchema = z.object({
  context: z.object({
    action: z.enum(["PAUSE", "REDUCE"]),
    durationMonths: z.number().int().min(1).max(12),
    monthlyAmount: z.number().nonnegative(),
    proposedAmount: z.number().nonnegative(),
    contributionDifference: z.number().nonnegative(),
    goalName: z.string(),
    yearsRemaining: z.number().int().nonnegative(),
    marketLabel: z.string(),
    marketSummary: z.string(),
  }),
});
