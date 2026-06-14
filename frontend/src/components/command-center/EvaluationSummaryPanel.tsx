import { mockEvaluation } from "@/data/mockEvaluation";
import { SectionCard } from "@/components/shared/SectionCard";

export function EvaluationSummaryPanel() {
  const averageQuality = mockEvaluation.reduce((total, score) => total + score.qualityScore, 0) / mockEvaluation.length;

  return (
    <SectionCard title="Evaluation" eyebrow="Quality">
      <div className="mb-4 rounded-lg bg-field p-4">
        <p className="text-sm text-neutral-600">Average workflow quality</p>
        <p className="mt-1 text-3xl font-semibold text-ink">{Math.round(averageQuality * 100)}%</p>
      </div>
      <div className="space-y-3">
        {mockEvaluation.map((score) => (
          <div key={score.agent} className="flex items-center justify-between gap-3 text-sm">
            <span className="capitalize text-neutral-700">{score.agent}</span>
            <span className="font-semibold text-ink">{Math.round(score.qualityScore * 100)}%</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
