import { mockFarmState } from "@/data/mockFarmState";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { FarmZone } from "@/types/farm";

function riskTone(riskLevel: FarmZone["riskLevel"]) {
  if (riskLevel === "critical" || riskLevel === "high") return "danger";
  if (riskLevel === "medium") return "warning";
  return "success";
}

export function FarmMapPanel() {
  return (
    <SectionCard title="Farm Zones" eyebrow="Telemetry">
      <div className="grid gap-3 md:grid-cols-3">
        {mockFarmState.zones.map((zone) => (
          <article key={zone.id} className="rounded-lg border border-emerald-900/10 bg-field p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{zone.name}</h3>
                <p className="text-sm text-neutral-600">{zone.cropType}</p>
              </div>
              <StatusBadge label={zone.riskLevel} tone={riskTone(zone.riskLevel)} />
            </div>
            <div className="mt-5 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-leaf" style={{ width: `${zone.soilMoisturePct}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-neutral-500">Moisture</dt>
                <dd className="font-semibold">{zone.soilMoisturePct}%</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Temp</dt>
                <dd className="font-semibold">{zone.temperatureC}C</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Humidity</dt>
                <dd className="font-semibold">{zone.humidityPct}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
