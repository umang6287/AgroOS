import { mockFarmState } from "@/data/mockFarmState";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function AutonomousActionsPanel() {
  return (
    <SectionCard title="Actions And Approvals" eyebrow="Planner">
      <div className="space-y-3">
        {mockFarmState.activeActions.map((action) => (
          <article key={action.id} className="rounded-lg border border-emerald-900/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{action.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm text-neutral-600">{action.summary}</p>
              </div>
              <StatusBadge label={action.status} tone={action.priority === "high" ? "warning" : "success"} />
            </div>
          </article>
        ))}
        {mockFarmState.pendingApprovals.map((approval) => (
          <article key={approval.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-950">{approval.title}</p>
                <p className="mt-1 text-sm text-amber-800">{approval.reason}</p>
              </div>
              <StatusBadge label={approval.channel} tone="warning" />
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
