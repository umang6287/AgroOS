type FarmCommandCenterProps = {
  apiBaseUrl: string;
  backendHealth: {
    status: "loading" | "ok" | "error";
    message: string;
  };
};

const commandCenterAssets = [
  {
    title: "Sensor network",
    description: "Soil moisture, tank level, and climate readings from the mango orchard.",
    image: "/images/sensor-icon.png",
    value: "Live"
  },
  {
    title: "Robot scout",
    description: "Autonomous inspection tasks for trees that need closer review.",
    image: "/images/robot-icon.png",
    value: "Ready"
  }
];

export function FarmCommandCenter({ apiBaseUrl, backendHealth }: FarmCommandCenterProps) {
  return (
    <main className="min-h-screen bg-[#eef6ea] px-4 py-5 text-[#142014] sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-lg border border-[#d5e4cf] bg-white shadow-sm">
          <div className="relative min-h-[360px]">
            <img
              src="/images/farm-demo.png"
              alt="Mango orchard with farm technology"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-100">AgriOS Command Center</p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">Mango orchard operations</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                Live farm telemetry, agent recommendations, inspection tasks, and outcome verification in one demo view.
              </p>
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-lg border border-[#d5e4cf] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60715a]">Backend health</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-[#60715a]">{apiBaseUrl}</span>
              <strong className="rounded-full bg-[#e8f4df] px-3 py-1 text-sm text-[#2f6b1f]">{backendHealth.status}</strong>
            </div>
            <pre className="mt-3 overflow-auto rounded-md bg-[#f5f8f2] p-3 text-xs text-[#31402d]">{backendHealth.message}</pre>
          </div>

          {commandCenterAssets.map((asset) => (
            <article key={asset.title} className="flex gap-4 rounded-lg border border-[#d5e4cf] bg-white p-4 shadow-sm">
              <img src={asset.image} alt="" className="h-20 w-20 rounded-md object-cover" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{asset.title}</h2>
                  <span className="rounded-full bg-[#fff6d8] px-2 py-0.5 text-xs font-semibold text-[#765800]">{asset.value}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-[#60715a]">{asset.description}</p>
              </div>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
