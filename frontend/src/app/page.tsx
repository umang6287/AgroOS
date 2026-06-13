"use client";

import { useEffect, useState } from "react";

import { FarmCommandCenter } from "@/components/command-center/FarmCommandCenter";
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

  return <FarmCommandCenter apiBaseUrl={apiBaseUrl} backendHealth={health} />;
}
