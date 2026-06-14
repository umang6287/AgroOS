type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-emerald-900/10 bg-field p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-1 text-sm text-neutral-600">{helper}</p> : null}
    </article>
  );
}
