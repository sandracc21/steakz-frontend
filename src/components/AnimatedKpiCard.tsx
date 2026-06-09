import { useCountUp } from "../hooks/useCountUp";

interface AnimatedKpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  highlight?: boolean;
  decimals?: number;
}

export function AnimatedKpiCard({
  label, value, prefix = "", suffix = "", sub, highlight = false, decimals = 0,
}: AnimatedKpiCardProps) {
  const animated = useCountUp(value, 1200);
  const display = decimals > 0
    ? (animated / Math.pow(10, decimals)).toFixed(2)
    : animated.toLocaleString();

  return (
    <div className={`kpi-card${highlight ? " kpi-highlight" : ""}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {prefix}{display}{suffix}
      </span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}
