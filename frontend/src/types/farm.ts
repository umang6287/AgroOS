export type FarmZone = {
  id: string;
  name: string;
  cropType: string;
  variety?: string;
  treeCount?: number;
  soilMoisturePct: number;
  temperatureC: number;
  humidityPct: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastUpdatedAt: string;
  bounds?: {
    leftPct: number;
    topPct: number;
    widthPct: number;
    heightPct: number;
  };
  sensorIds?: string[];
  valveId?: string;
  currentTreeId?: string;
  canopyHealthPct?: number;
  pestPressure?: "low" | "normal" | "watch" | string;
};

export type RobotStatus = "available" | "assigned" | "charging" | "offline";

export type FarmRobot = {
  id: string;
  name: string;
  status: RobotStatus;
  batteryPct: number;
  currentZoneId: string;
  currentWaypointId?: string;
  currentWaypointLabel?: string;
  currentTarget?: string;
  routeId?: string;
  routeProgressPct?: number;
  location?: {
    xPct: number;
    yPct: number;
  };
  speedMps?: number;
  lastInspection?: {
    kind: string;
    zoneId?: string | null;
    assetId?: string | null;
    observedAtTick: number;
  };
  observations?: string[];
};

export type FarmActionStatus =
  | "recommended"
  | "scheduled"
  | "active"
  | "needs_approval"
  | "pending_verification"
  | "verified"
  | "completed"
  | "failed";

export type CommunicationChannel = "in_app" | "phone_call" | "sms" | "whatsapp" | "telegram";

export type FarmAction = {
  id: string;
  type: string;
  zoneId: string;
  priority: "low" | "medium" | "high" | "critical";
  status: FarmActionStatus;
  summary: string;
  createdAt?: string;
};

export type PendingApproval = {
  id: string;
  title: string;
  reason: string;
  channel: CommunicationChannel;
  createdAt?: string;
  requestedAt?: string;
};

export type CommunicationEvent = {
  communicationId: string;
  severity: string;
  selectedChannel: CommunicationChannel;
  recipientRole: string;
  message: string;
  status: "queued" | "sent" | "delivered" | "failed" | "simulated";
  createdAt?: string;
  provider?: "twilio" | "telegram" | "in_app" | string | null;
  providerStatus?: string | null;
  providerMessageId?: string | null;
  providerCallSid?: string | null;
  fallbackProvider?: "telegram" | string | null;
  fallbackReason?: string | null;
  deliveryError?: string | null;
  displayAgentName?: string;
  requiresHumanReview?: boolean;
};

export type OutcomeCheck = {
  outcomeId: string;
  actionId: string;
  zoneId: string;
  status: string;
  metric: string;
  beforeValue: number;
  afterValue: number;
  targetValue: number;
  deltaPct: number;
  summary: string;
  verifiedAt?: string;
};

export type FarmJournalEntry = {
  id: string;
  type: string;
  zoneId: string;
  summary: string;
  createdAt: string;
  relatedActionId?: string | null;
};

export type FarmState = {
  farmId: string;
  name: string;
  autonomyMode: "observe_only" | "recommend_actions" | "auto_schedule_low_risk" | "require_approval_high_risk";
  updatedAt: string;
  zones: FarmZone[];
  robots: FarmRobot[];
  activeActions: FarmAction[];
  pendingApprovals: PendingApproval[];
  communicationEvents?: CommunicationEvent[];
  outcomeChecks?: OutcomeCheck[];
  journalEntries?: FarmJournalEntry[];
  latestTelemetry?: {
    sequence: number;
    generatedAt: string;
    zoneId: string;
    zoneName: string;
    soilMoisturePct: number;
    soilMoistureThresholdPct: number;
    temperatureC: number;
    humidityPct: number;
    waterTankPct: number;
    tankLevelPct: number;
    robot: FarmRobot;
    zones: FarmZone[];
  };
  simulation?: {
    tick: number;
    tickIntervalSeconds: number;
    retentionMinutes: number;
    routeId: string;
    routeName: string;
    routeProgressPct: number;
    routeStep: number;
    routeStepCount: number;
    currentWaypointId: string;
    currentWaypointLabel: string;
    currentActivity: string;
    inspectionsThisHour: number;
    zonesVisitedThisCycle: string[];
    nextTickAt: string;
  };
  assets?: {
    sensors?: Array<{
      id: string;
      zoneId: string;
      kind: string;
      status: string;
      location: { xPct: number; yPct: number };
      reading?: {
        soilMoisturePct: number;
        temperatureC: number;
        humidityPct: number;
      };
    }>;
    valves?: Array<{
      id: string;
      zoneId: string;
      status: string;
      flowLitersPerMinute: number;
      location: { xPct: number; yPct: number };
    }>;
    trees?: Array<{
      id: string;
      name: string;
      zoneId: string;
      location: { xPct: number; yPct: number };
      canopyHealthPct: number;
      lastObservedAtTick: number;
    }>;
    waterTanks?: Array<{
      id: string;
      name: string;
      kind: string;
      capacityLiters: number;
      levelPct: number;
      availableLiters: number;
      status: string;
      location: { xPct: number; yPct: number };
    }>;
    pump?: {
      id: string;
      name: string;
      kind: string;
      status: string;
      pressureBar: number;
      location: { xPct: number; yPct: number };
    };
    base?: {
      id: string;
      name: string;
      kind: string;
      location: { xPct: number; yPct: number };
    };
  };
};
