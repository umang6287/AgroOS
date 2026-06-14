import { mockAgentTrace } from "@/data/mockAgentTrace";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function AgentTimelinePanel() {
  return (
    <SectionCard title="Agent Timeline" eyebrow={mockAgentTrace.workflow.replaceAll("_", " ")}>
      <ol className="space-y-3">
        {mockAgentTrace.trace.map((step) => (
          <li key={`${step.agent}-${step.latencyMs}`} className="rounded-lg border border-emerald-900/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold capitalize text-ink">{step.agent} Agent</p>
                <p className="mt-1 text-sm text-neutral-600">{step.summary}</p>
              </div>
              <StatusBadge label={step.status} tone={step.requiresHumanReview ? "warning" : "success"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span>{Math.round(step.confidence * 100)}% confidence</span>
              <span>{step.latencyMs} ms</span>
              <span>${step.estimatedCostUsd.toFixed(3)}</span>
              {step.warnings?.map((warning) => <span key={warning}>{warning}</span>)}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
