import { SectionCard } from "@/components/shared/SectionCard";

export function VoiceFarmManager() {
  return (
    <SectionCard title="Voice Farm Manager" eyebrow="Call my farm">
      <div className="rounded-lg bg-ink p-4 text-sm text-white">
        <p className="font-semibold">Fallback response</p>
        <p className="mt-2 text-white/80">
          Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.
        </p>
      </div>
      <button className="mt-4 rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white">Run voice demo</button>
    </SectionCard>
  );
}
