import Image from "next/image";

import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function LeafUploadPanel() {
  return (
    <SectionCard title="Leaf Vision" eyebrow="Demo image">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-emerald-900/10">
          <Image src="/images/pest-leaf.jpg" alt="Demo leaf sample" fill className="object-cover" sizes="120px" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge label="fallback:demo_vision_result" tone="warning" />
            <StatusBadge label="86% confidence" tone="success" />
          </div>
          <p className="mt-3 text-sm text-neutral-700">
            Possible early blight detected. Assign robot inspection and ask farmer to review treatment before spraying.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
