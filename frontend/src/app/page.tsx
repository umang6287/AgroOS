"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

type HealthState =
  | { status: "loading"; message: string }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export default function Home() {
  const [health, setHealth] = useState<HealthState>({
    status: "loading",
    message: "Checking backend health..."
  });

  const apiBaseUrl = API_URL;

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        setHealth({
          status: data.status === "ok" ? "ok" : "error",
          message: JSON.stringify(data)
        });
      })
      .catch((error: Error) => {
        setHealth({ status: "error", message: error.message });
      });
  }, [apiBaseUrl]);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">AgriOS Deployment Smoke Test</p>
        <h1>Frontend is running.</h1>
        <p className="lede">
          This page intentionally checks only the FastAPI health endpoint. Farm features will be implemented after deployment is proven.
        </p>

        <div className={`status ${health.status}`}>
          <span>Backend health</span>
          <strong>{health.status}</strong>
        </div>

        <pre>{health.message}</pre>
        <p className="hint">API base URL: {apiBaseUrl}</p>
      </section>
    </main>
  );
}
