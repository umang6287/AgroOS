type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClass = {
  neutral: "bg-neutral-100 text-neutral-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800"
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>{label}</span>;
}
