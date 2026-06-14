import type { FarmState } from "@/types/farm";

const mockFarmTimestamp = new Date().toISOString();

export const mockFarmState: FarmState = {
  farmId: "demo-farm",
  name: "Ratnagiri Mango Estate",
  autonomyMode: "require_approval_high_risk",
  updatedAt: mockFarmTimestamp,
  zones: [
    {
      id: "zone-a",
      name: "Zone A",
      cropType: "mango_alphonso",
      soilMoisturePct: 37,
      temperatureC: 29.8,
      humidityPct: 62,
      riskLevel: "low",
      lastUpdatedAt: mockFarmTimestamp
    },
    {
      id: "zone-b",
      name: "Zone B",
      cropType: "mango_kesar",
      soilMoisturePct: 24,
      temperatureC: 34.2,
      humidityPct: 46,
      riskLevel: "high",
      lastUpdatedAt: mockFarmTimestamp
    },
    {
      id: "zone-c",
      name: "Zone C",
      cropType: "mango_dasheri",
      soilMoisturePct: 31,
      temperatureC: 31.7,
      humidityPct: 57,
      riskLevel: "medium",
      lastUpdatedAt: mockFarmTimestamp
    },
    {
      id: "zone-d",
      name: "Zone D",
      cropType: "mango_young_grafts",
      soilMoisturePct: 42,
      temperatureC: 30.6,
      humidityPct: 61,
      riskLevel: "low",
      lastUpdatedAt: mockFarmTimestamp
    }
  ],
  robots: [
    {
      id: "robot-r1",
      name: "Robot R1",
      status: "assigned",
      batteryPct: 81,
      currentZoneId: "zone-b"
    }
  ],
  activeActions: [
    {
      id: "act-irrigate-zone-b-001",
      type: "schedule_irrigation",
      zoneId: "zone-b",
      priority: "high",
      status: "scheduled",
      summary: "12 minute drip irrigation scheduled for Zone B."
    },
    {
      id: "act-inspect-zone-b-001",
      type: "robot_inspection",
      zoneId: "zone-b",
      priority: "medium",
      status: "scheduled",
      summary: "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks."
    },
    {
      id: "act-voice-farmer-001",
      type: "farmer_voice_brief",
      zoneId: "zone-b",
      priority: "medium",
      status: "scheduled",
      summary: "Marathi voice brief prepared for the farmer."
    },
    {
      id: "act-outcome-zone-b-001",
      type: "verify_outcome",
      zoneId: "zone-b",
      priority: "medium",
      status: "recommended",
      summary: "Outcome Agent will compare follow-up telemetry after irrigation."
    }
  ],
  pendingApprovals: [
    {
      id: "approval-treatment-001",
      title: "Fungal treatment review",
      reason: "Vision Agent found possible early fungal marks on mango leaves. Spraying requires farmer approval.",
      channel: "whatsapp"
    }
  ]
};
