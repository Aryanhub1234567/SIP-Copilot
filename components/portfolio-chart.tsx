const colors = ["#56856b", "#a9bfaa", "#e7c28e"];

export function PortfolioChart({ equity, debt, other }: { equity: number; debt: number; other: number }) {
  const data = [equity, debt, other];
  const total = data.reduce((sum, value) => sum + Math.max(0, value), 0);
  const circumference = 2 * Math.PI * 29;
  let offset = 0;

  return (
    <div className="portfolio-chart" role="img" aria-label={`Portfolio allocation: ${equity}% equity, ${debt}% debt, ${other}% other`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="29" fill="none" stroke="#edf0ed" strokeWidth="8" />
        {total > 0 && data.map((value, index) => {
          const segment = (Math.max(0, value) / total) * circumference;
          const circle = <circle key={index} cx="36" cy="36" r="29" fill="none" stroke={colors[index]} strokeWidth="8" strokeDasharray={`${segment} ${circumference - segment}`} strokeDashoffset={-offset} transform="rotate(-90 36 36)" />;
          offset += segment;
          return circle;
        })}
        <circle cx="36" cy="36" r="21" fill="white" />
      </svg>
    </div>
  );
}
