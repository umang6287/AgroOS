import { mockFarmState } from "@/data/mockFarmState";
import { MetricCard } from "@/components/shared/MetricCard";

export function LiveMetricsPanel() {
  const dryZone = mockFarmState.zones.find((zone) => zone.riskLevel === "high" || zone.riskLevel === "critical");
  const robot = mockFarmState.robots[0];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Active farm" value={mockFarmState.name} helper={mockFarmState.autonomyMode.replaceAll("_", " ")} />
      <MetricCard label="Priority zone" value={dryZone?.name ?? "Clear"} helper={dryZone ? `${dryZone.soilMoisturePct}% soil moisture` : "No active anomaly"} />
      <MetricCard label="Robot" value={robot.name} helper={`${robot.status}, ${robot.batteryPct}% battery`} />
      <MetricCard label="Pending approvals" value={String(mockFarmState.pendingApprovals.length)} helper="High-risk items stay reviewable" />
    </div>
  );
}
