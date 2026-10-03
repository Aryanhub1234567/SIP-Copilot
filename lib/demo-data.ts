export const demo = {
  investor: { name: "Aarav", initials: "AK" },
  portfolio: {
    value: 842500,
    invested: 785000,
    changePercent: -2.4,
    equityPercent: 68,
    debtPercent: 24,
    otherPercent: 8,
  },
  goal: {
    name: "A home of your own",
    target: 8000000,
    current: 1260000,
    targetYear: 2032,
    yearsRemaining: 6,
  },
  sip: {
    fund: "Parag Parikh Flexi Cap Fund",
    category: "Equity · Flexi cap",
    monthlyAmount: 10000,
    nextDate: "12 Oct 2026",
    linkedGoal: "A home of your own",
  },
  market: {
    label: "Elevated volatility",
    detail: "Markets have been choppy over the past month",
    periodChange: -3.2,
  },
};

export const inr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
