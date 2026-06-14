"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { mockAgentTrace } from "@/data/mockAgentTrace";
import { mockEvaluation } from "@/data/mockEvaluation";
import { mockFarmState } from "@/data/mockFarmState";
import { FarmerConversationPanel, type ConversationMessage, type ConversationQuickAction, type FarmerContextCard } from "@/components/voice/FarmerConversationPanel";
import { AgriOSMark } from "@/components/shared/AgriOSMark";
import { authHeaders, setSessionToken } from "@/lib/api";
import { translations, type AppCopy, type LanguageCode, type Tone } from "@/lib/i18n";
import { WS_URL } from "@/lib/websocket";
import type { AgentEnvelope, AgentTrace } from "@/types/agents";
import type { AdminUser } from "@/types/auth";
import type { AgentScorecard } from "@/types/evaluation";
import type { CommunicationEvent, FarmAction, FarmRobot, FarmState, FarmZone, OutcomeCheck, PendingApproval } from "@/types/farm";

type FarmCommandCenterProps = {
  apiBaseUrl: string;
  healthStatus: "loading" | "ok" | "error";
  healthMessage: string;
  adminUser: AdminUser;
  onAdminUserChange: (user: AdminUser) => void;
  onLogout: () => void;
};

type OrchardBlock = FarmZone & {
  treeCount: number;
  variety: string;
  position: {
    left: string;
    top: string;
    width: string;
    height: string;
    clipPath?: string;
  };
  sensorCount: number;
  activeIssue: string;
};

type WorkflowStatus = "idle" | "running" | "ready" | "error";
type AiConfigStatus = {
  configured: boolean;
  ready: boolean;
  liveEnabled: boolean;
  source?: string | null;
  model: string;
  speechToTextModel: string;
  textToSpeechModel: string;
  textToSpeechVoice: string;
};

type VoiceResponseData = {
  responseText?: string;
  language?: string;
  audioUrl?: string | null;
  audioMimeType?: string | null;
};

type WorkflowMessage =
  | { type: "initial" }
  | { type: "loaded"; workflow: AgentTrace["workflow"] }
  | { type: "fallback"; message: string }
  | { type: "runningVision" }
  | { type: "runningVoice" }
  | { type: "summary"; text: string }
  | { type: "error"; text: string };
type DataSourceStatus = "mock" | "backend";
type ClockSource = "system" | "server";

const SERVER_CLOCK_MAX_DRIFT_MS = 5 * 60 * 1000;
const DEFAULT_WS_URL = "ws://localhost:8000/ws/farm";
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 1.8;
const MAP_ZOOM_STEP = 0.2;
const FARM_CALL_SIGN = "AGRIOS-LIVE-01";

type SimulationTickEvent = {
  type: "simulation.tick";
  eventId: string;
  sequence: number;
  createdAt: string;
  data?: {
    farmState?: FarmState;
    telemetry?: FarmState["latestTelemetry"];
    sensorEnvelope?: AgentEnvelope;
    robotEnvelope?: AgentEnvelope;
    agentTrace?: AgentTrace;
  };
};

type LiveMapMarker = {
  label: string;
  detail: string;
  className: string;
  style?: CSSProperties;
};

type AdminItemKind = "approval" | "action" | "communication" | "outcome";

type AdminDetailRow = {
  label: string;
  value: string;
};

type AdminItem = {
  id: string;
  kind: AdminItemKind;
  title: string;
  summary: string;
  status: string;
  tone: Tone | string;
  badge: string;
  timestamp?: string;
  rows: AdminDetailRow[];
};

type AdminSection = "notifications" | "performance" | "settings";
type AdminItemFilter = "all" | "approval" | "action" | "sent";

type AgentPerformanceItem = {
  agent: string;
  name: string;
  status: string;
  statusTone: Tone | string;
  summary: string;
  confidence: number;
  qualityScore: number;
  latencyMs: number;
  estimatedCostUsd: number;
  requiresHumanReview: boolean;
  routingAccuracy?: number;
  deliverySuccess?: number;
  fallbackSuccess?: number;
  languageMatchScore?: number;
  groundingScore?: number;
  conversationAnswerScore?: number;
};

const orchardBlocks: OrchardBlock[] = [
  {
    ...mockFarmState.zones[0],
    treeCount: 168,
    variety: "Alphonso",
    sensorCount: 7,
    activeIssue: "Healthy canopy",
    position: {
      left: "7.4%",
      top: "12.1%",
      width: "41.2%",
      height: "34.7%"
    }
  },
  {
    ...mockFarmState.zones[1],
    treeCount: 144,
    variety: "Kesar",
    sensorCount: 8,
    activeIssue: "Water stress",
    position: {
      left: "52.1%",
      top: "12.1%",
      width: "38.8%",
      height: "34.7%"
    }
  },
  {
    ...mockFarmState.zones[2],
    treeCount: 156,
    variety: "Dasheri",
    sensorCount: 6,
    activeIssue: "Leaf spot watch",
    position: {
      left: "52.1%",
      top: "52.7%",
      width: "27.2%",
      height: "36.7%"
    }
  },
  {
    ...mockFarmState.zones[3],
    treeCount: 96,
    variety: "Young grafts",
    sensorCount: 5,
    activeIssue: "Stable",
    position: {
      left: "7.4%",
      top: "52.7%",
      width: "41.2%",
      height: "36.7%"
    }
  }
];

const mapSensors = [
  { label: "S1", style: "left-[21%] top-[26%]" },
  { label: "S2", style: "left-[43%] top-[39%]" },
  { label: "S3", style: "left-[61%] top-[27%]" },
  { label: "S4", style: "left-[86%] top-[40%]" },
  { label: "S5", style: "left-[19%] top-[72%]" },
  { label: "S6", style: "left-[70%] top-[76%]" }
];

const mapValves = [
  { label: "V1", style: "left-[31%] top-[49%]" },
  { label: "V2", style: "left-[49%] top-[49%]" },
  { label: "V3", style: "left-[49%] top-[88%]" },
  { label: "V4", style: "left-[80%] top-[51%]" }
];

const mapLegend = [
  { icon: "S", label: "Sensors", tone: "sensor" },
  { icon: "R", label: "Robot", tone: "robot" },
  { icon: "V", label: "Drip valves", tone: "valve" },
  { icon: "T", label: "Water tank", tone: "tank" },
  { icon: "M", label: "Mango blocks", tone: "mango" },
  { icon: "P", label: "Path calibrated", tone: "path" }
];

function riskLabel(riskLevel: FarmZone["riskLevel"], copy: AppCopy) {
  return copy.riskLabels[riskLevel];
}

function riskClasses(riskLevel: FarmZone["riskLevel"]) {
  if (riskLevel === "critical") {
    return {
      border: "border-red-400/90",
      fill: "bg-red-500/24",
      text: "text-red-100",
      badge: "bg-red-500/20 text-red-100 ring-red-300/50"
    };
  }

  if (riskLevel === "high") {
    return {
      border: "border-amber-300/90",
      fill: "bg-amber-400/24",
      text: "text-amber-50",
      badge: "bg-amber-400/20 text-amber-100 ring-amber-200/50"
    };
  }

  if (riskLevel === "medium") {
    return {
      border: "border-sky-300/80",
      fill: "bg-sky-400/18",
      text: "text-sky-50",
      badge: "bg-sky-400/20 text-sky-100 ring-sky-200/40"
    };
  }

  return {
    border: "border-emerald-300/80",
    fill: "bg-emerald-400/20",
    text: "text-emerald-50",
    badge: "bg-emerald-400/20 text-emerald-100 ring-emerald-200/40"
  };
}

function toneClasses(tone: Tone | string) {
  if (tone === "danger") return "border-red-400/30 bg-red-500/10 text-red-100";
  if (tone === "warning") return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  if (tone === "info") return "border-sky-300/30 bg-sky-400/10 text-sky-100";
  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
}

function healthTone(healthStatus: FarmCommandCenterProps["healthStatus"]) {
  if (healthStatus === "ok") return "bg-emerald-400/15 text-emerald-100 ring-emerald-300/30";
  if (healthStatus === "loading") return "bg-sky-400/15 text-sky-100 ring-sky-300/30";
  return "bg-amber-400/15 text-amber-100 ring-amber-300/30";
}

function formatAgentName(agent: string, copy: AppCopy) {
  return copy.agentTimeline.agents[agent] ?? `${agent.charAt(0).toUpperCase()}${agent.slice(1)} Agent`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init, headers: authHeaders(init?.headers) });

  if (!response.ok) {
    let detail = `${url} returned ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Keep the generic HTTP message when the backend returns no JSON body.
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read call audio."));
    };
    reader.onerror = () => reject(new Error("Could not read call audio."));
    reader.readAsDataURL(file);
  });
}

function actionTitle(action: FarmAction) {
  return action.type
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function actionTone(action: FarmAction) {
  if (action.status === "needs_approval" || action.priority === "critical") return "warning";
  if (action.status === "active") return "info";
  if (action.status === "failed") return "danger";
  return "success";
}

function clampMapZoom(value: number) {
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, Number(value.toFixed(2))));
}

function localizeKnownText(text: string | undefined, copy: AppCopy) {
  if (!text) return "";

  const exact = copy.knownText[text];
  if (exact) return exact;

  const sensorCriticalMatch = text.match(/^Zone B soil moisture is critically low at (\d+)%\.$/);
  if (sensorCriticalMatch) {
    return copy.patterns.sensorCritical(sensorCriticalMatch[1]);
  }

  const outcomeMoistureMatch = text.match(/^Zone B moisture increased from (\d+)% to (\d+)% after irrigation\.$/);
  if (outcomeMoistureMatch) {
    return copy.patterns.outcomeMoisture(outcomeMoistureMatch[1], outcomeMoistureMatch[2]);
  }

  return text;
}

function localizeZoneName(zoneName: string, copy: AppCopy) {
  return copy.zoneNames[zoneName] ?? zoneName;
}

function workflowLabel(workflow: string, copy: AppCopy) {
  return copy.agentTimeline.workflows[workflow] ?? workflow.replaceAll("_", " ");
}

function statusLabel(status: string, copy: AppCopy) {
  return copy.statuses[status] ?? status.replaceAll("_", " ");
}

function robotStatusLabel(status: string | undefined, copy: AppCopy) {
  if (!status) return copy.metricsPanel.noRobot;
  return copy.robotStatuses[status] ?? status.replaceAll("_", " ");
}

function actionTitleLabel(action: FarmAction, copy: AppCopy) {
  return copy.actionsPanel.actionTypes[action.type] ?? actionTitle(action);
}

function zoneNameFromId(zoneId: string | undefined, zones: FarmZone[], copy: AppCopy) {
  if (!zoneId) return copy.common.none;

  const zone = zones.find((item) => item.id === zoneId);
  return zone ? localizeZoneName(zone.name, copy) : zoneId.replaceAll("-", " ");
}

function channelLabel(channel: string | undefined, copy: AppCopy) {
  if (!channel) return copy.common.none;
  return copy.communicationPanel.channels[channel]?.label ?? channel.replaceAll("_", " ");
}

function approvalToAdminItem(approval: PendingApproval, copy: AppCopy): AdminItem {
  const timestamp = approval.requestedAt ?? approval.createdAt;
  return {
    id: `approval-${approval.id}`,
    kind: "approval",
    title: localizeKnownText(approval.title, copy),
    summary: localizeKnownText(approval.reason, copy),
    status: copy.agentTimeline.review,
    tone: "warning",
    badge: channelLabel(approval.channel, copy),
    timestamp,
    rows: [
      ...(timestamp ? [{ label: "Time", value: formatEventTime(timestamp) }] : []),
      { label: "Channel", value: channelLabel(approval.channel, copy) },
      { label: "Review", value: copy.agentTimeline.review },
      { label: "Approval ID", value: approval.id }
    ]
  };
}

function actionToAdminItem(action: FarmAction, zones: FarmZone[], copy: AppCopy): AdminItem {
  const status = statusLabel(action.status, copy);
  return {
    id: `action-${action.id}`,
    kind: "action",
    title: actionTitleLabel(action, copy),
    summary: localizeKnownText(action.summary, copy),
    status,
    tone: actionTone(action),
    badge: action.priority,
    timestamp: action.createdAt,
    rows: [
      ...(action.createdAt ? [{ label: "Time", value: formatEventTime(action.createdAt) }] : []),
      { label: "Zone", value: zoneNameFromId(action.zoneId, zones, copy) },
      { label: "Priority", value: action.priority },
      { label: "Status", value: status },
      { label: "Action ID", value: action.id }
    ]
  };
}

function communicationToAdminItem(event: CommunicationEvent, index: number, copy: AppCopy): AdminItem {
  const status = statusLabel(event.status, copy);
  const provider = event.provider ? event.provider.replaceAll("_", " ") : copy.common.none;
  const fallbackStatus =
    event.fallbackProvider && event.status !== "failed"
      ? `Twilio failed -> ${event.fallbackProvider} sent`
      : event.fallbackProvider
        ? `Twilio failed -> ${event.fallbackProvider} failed`
        : copy.common.none;
  return {
    id: `communication-${event.communicationId}-${index}`,
    kind: "communication",
    title: `${event.displayAgentName ?? "AgriOS Saathi"} ${channelLabel(event.selectedChannel, copy)} notification`,
    summary: localizeKnownText(event.message, copy),
    status,
    tone: event.status === "failed" ? "danger" : "success",
    badge: event.severity,
    timestamp: event.createdAt,
    rows: [
      { label: "Channel", value: channelLabel(event.selectedChannel, copy) },
      { label: "Provider", value: provider },
      ...(event.providerStatus ? [{ label: "Provider status", value: event.providerStatus }] : []),
      ...(event.fallbackProvider ? [{ label: "Fallback", value: fallbackStatus }] : []),
      ...(event.fallbackReason ? [{ label: "Fallback reason", value: event.fallbackReason.replaceAll("_", " ") }] : []),
      { label: "Recipient", value: event.recipientRole },
      { label: "Severity", value: event.severity },
      { label: "Delivery", value: status },
      ...(event.deliveryError ? [{ label: "Error", value: event.deliveryError }] : []),
      { label: "Time", value: event.createdAt ? formatEventTime(event.createdAt) : copy.common.syncingTime }
    ]
  };
}

function outcomeToAdminItem(outcome: OutcomeCheck, zones: FarmZone[], copy: AppCopy): AdminItem {
  return {
    id: `outcome-${outcome.outcomeId}`,
    kind: "outcome",
    title: "Outcome verification",
    summary: localizeKnownText(outcome.summary, copy),
    status: statusLabel(outcome.status, copy),
    tone: outcome.status === "failed" ? "danger" : "info",
    badge: `${outcome.deltaPct} ${copy.metricsPanel.points}`,
    timestamp: outcome.verifiedAt,
    rows: [
      ...(outcome.verifiedAt ? [{ label: "Time", value: formatEventTime(outcome.verifiedAt) }] : []),
      { label: "Zone", value: zoneNameFromId(outcome.zoneId, zones, copy) },
      { label: "Metric", value: outcome.metric },
      { label: "Before", value: `${outcome.beforeValue}` },
      { label: "After", value: `${outcome.afterValue}` },
      { label: "Target", value: `${outcome.targetValue}` },
      { label: "Related action", value: outcome.actionId }
    ]
  };
}

function agentPerformanceTone(score: AgentScorecard, status: string): Tone | string {
  if (score.requiresHumanReview) return "warning";
  if (status === "failed") return "danger";
  if (score.confidence < 0.8 || score.qualityScore < 0.85) return "warning";
  if (score.latencyMs > 900) return "info";
  return "success";
}

function agentPerformanceStatus(score: AgentScorecard, status: string, copy: AppCopy) {
  if (score.requiresHumanReview) return copy.agentTimeline.review;
  if (score.confidence < 0.8 || score.qualityScore < 0.85) return "Needs attention";
  return statusLabel(status, copy);
}

function buildAgentPerformanceItems(evaluation: AgentScorecard[], agentTrace: AgentTrace, copy: AppCopy): AgentPerformanceItem[] {
  return evaluation.map((score) => {
    const traceStep = agentTrace.trace.find((step) => step.agent === score.agent);
    const status = traceStep?.status ?? "completed";

    return {
      agent: score.agent,
      name: formatAgentName(score.agent, copy),
      status: agentPerformanceStatus(score, status, copy),
      statusTone: agentPerformanceTone(score, status),
      summary: localizeKnownText(traceStep?.summary, copy) || workflowLabel(score.workflow ?? agentTrace.workflow, copy),
      confidence: score.confidence,
      qualityScore: score.qualityScore,
      latencyMs: score.latencyMs,
      estimatedCostUsd: score.estimatedCostUsd,
      requiresHumanReview: score.requiresHumanReview,
      routingAccuracy: score.routingAccuracy,
      deliverySuccess: score.deliverySuccess,
      fallbackSuccess: score.fallbackSuccess,
      languageMatchScore: score.languageMatchScore,
      groundingScore: score.groundingScore,
      conversationAnswerScore: score.conversationAnswerScore
    };
  });
}

function mapLegendLabel(label: string, copy: AppCopy) {
  if (label === "Sensors") return copy.map.legend.sensors;
  if (label === "Robot") return copy.map.legend.robot;
  if (label === "Drip valves") return copy.map.legend.dripValves;
  if (label === "Water tank") return copy.map.legend.waterTank;
  if (label === "Mango blocks") return copy.map.legend.mangoBlocks;
  if (label === "Path calibrated") return copy.map.legend.pathCalibrated;
  return label;
}

function workflowMessageText(message: WorkflowMessage, copy: AppCopy) {
  if (message.type === "initial") return copy.workflowMessages.initial;
  if (message.type === "loaded") return copy.workflowMessages.loaded(workflowLabel(message.workflow, copy));
  if (message.type === "fallback") return copy.workflowMessages.fallback(message.message);
  if (message.type === "runningVision") return copy.workflowMessages.runningVision;
  if (message.type === "runningVoice") return copy.workflowMessages.runningVoice;
  return localizeKnownText(message.text, copy);
}

function formatClockTime(date: Date, includeSeconds = false) {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  };

  if (includeSeconds) {
    options.second = "2-digit";
  }

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function parseTimestamp(timestamp?: string) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveWebsocketUrl(apiBaseUrl: string) {
  if (WS_URL !== DEFAULT_WS_URL) return WS_URL;

  try {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/farm";
    url.search = "";
    return url.toString();
  } catch {
    return WS_URL;
  }
}

function robotMarkerStyle(robot?: FarmRobot): CSSProperties {
  const location = robot?.location ?? { xPct: 42, yPct: 45 };
  return {
    left: `${location.xPct}%`,
    top: `${location.yPct}%`,
    transform: "translate(-50%, -50%)"
  };
}

function zoneBoundsStyle(block: OrchardBlock): CSSProperties {
  const bounds = block.bounds;

  if (bounds) {
    return {
      left: `${bounds.leftPct}%`,
      top: `${bounds.topPct}%`,
      width: `${bounds.widthPct}%`,
      height: `${bounds.heightPct}%`
    };
  }

  return {
    left: block.position.left,
    top: block.position.top,
    width: block.position.width,
    height: block.position.height
  };
}

function assetMarkerStyle(location: { xPct: number; yPct: number }): CSSProperties {
  return {
    left: `${location.xPct}%`,
    top: `${location.yPct}%`,
    transform: "translate(-50%, -50%)"
  };
}

function formatEventTime(timestamp: string) {
  const date = parseTimestamp(timestamp);
  return date ? formatClockTime(date, true) : "syncing";
}

function timestampMs(timestamp?: string) {
  return parseTimestamp(timestamp)?.getTime() ?? 0;
}

function filterAdminItems(items: AdminItem[], filter: AdminItemFilter) {
  if (filter === "all") return items;
  if (filter === "sent") return items.filter((item) => item.kind === "communication");
  return items.filter((item) => item.kind === filter);
}

function conversationMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FarmCommandCenter({
  apiBaseUrl,
  healthStatus,
  healthMessage,
  adminUser,
  onAdminUserChange,
  onLogout
}: FarmCommandCenterProps) {
  const [language, setLanguage] = useState<LanguageCode>("mr");
  const [farmState, setFarmState] = useState<FarmState>(mockFarmState);
  const [agentTrace, setAgentTrace] = useState<AgentTrace>(mockAgentTrace);
  const [evaluation, setEvaluation] = useState<AgentScorecard[]>(mockEvaluation);
  const [performanceTrace, setPerformanceTrace] = useState<AgentTrace>(mockAgentTrace);
  const [performanceEvaluation, setPerformanceEvaluation] = useState<AgentScorecard[]>(mockEvaluation);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("idle");
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus>("mock");
  const [workflowMessage, setWorkflowMessage] = useState<WorkflowMessage>({ type: "initial" });
  const [visionResult, setVisionResult] = useState<AgentEnvelope | null>(null);
  const [voiceResult, setVoiceResult] = useState<AgentEnvelope<VoiceResponseData> | null>(null);
  const [aiConfig, setAiConfig] = useState<AiConfigStatus | null>(null);
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [aiConfigMessage, setAiConfigMessage] = useState("Checking AI setup");
  const [isSavingAiKey, setIsSavingAiKey] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(adminUser.firstName);
  const [profileLastName, setProfileLastName] = useState(adminUser.lastName);
  const [profileWhatsapp, setProfileWhatsapp] = useState(adminUser.whatsappNumber ?? "");
  const [profileMobile, setProfileMobile] = useState(adminUser.mobileNumber ?? "");
  const [profileTelegram, setProfileTelegram] = useState(adminUser.telegramAccount ?? "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("Profile settings are ready.");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [liveEvents, setLiveEvents] = useState<SimulationTickEvent[]>([]);
  const [clockSource, setClockSource] = useState<ClockSource>("system");
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [currentClock, setCurrentClock] = useState<Date | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>("notifications");
  const [adminItemFilter, setAdminItemFilter] = useState<AdminItemFilter>("all");
  const [selectedAdminItemId, setSelectedAdminItemId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const previousConversationLanguageRef = useRef<LanguageCode>(language);
  const touchpointsPanelRef = useRef<HTMLDivElement | null>(null);
  const copy = translations[language];
  const selectedLanguage = copy.language;
  const totalLatency = performanceTrace.trace.reduce((total, step) => total + step.latencyMs, 0);
  const totalCost = performanceTrace.trace.reduce((total, step) => total + step.estimatedCostUsd, 0);
  const averageConfidence = performanceEvaluation.reduce((total, score) => total + score.confidence, 0) / Math.max(performanceEvaluation.length, 1);
  const averageQuality = performanceEvaluation.reduce((total, score) => total + score.qualityScore, 0) / Math.max(performanceEvaluation.length, 1);
  const liveOrchardBlocks = useMemo(
    () =>
      orchardBlocks.map((block, index) => ({
        ...block,
        ...(farmState.zones[index] ?? block)
      })),
    [farmState.zones]
  );
  const highRiskBlock = liveOrchardBlocks.find((block) => block.riskLevel === "high" || block.riskLevel === "critical");
  const robot = farmState.robots[0];
  const waterTank = farmState.assets?.waterTanks?.[0];
  const tankLevelPct = waterTank?.levelPct ?? farmState.latestTelemetry?.waterTankPct ?? 65;
  const pump = farmState.assets?.pump;
  const connectedSensorCount = farmState.assets?.sensors?.length ?? 26;
  const liveMapSensors: LiveMapMarker[] =
    farmState.assets?.sensors?.map((sensor, index) => ({
      label: `S${index + 1}`,
      detail: sensor.id,
      style: assetMarkerStyle(sensor.location),
      className: "border-emerald-200/70 bg-emerald-400/22 text-emerald-50"
    })) ??
    mapSensors.map((sensor) => ({
      label: sensor.label,
      detail: copy.map.sensors,
      className: `${sensor.style} border-emerald-200/70 bg-emerald-400/22 text-emerald-50`
    }));
  const liveMapValves: LiveMapMarker[] =
    farmState.assets?.valves?.map((valve, index) => ({
      label: `V${index + 1}`,
      detail: `${valve.id} ${valve.status}`,
      style: assetMarkerStyle(valve.location),
      className:
        valve.status === "open"
          ? "border-cyan-100/90 bg-cyan-300/28 text-cyan-50"
          : "border-cyan-200/70 bg-cyan-400/20 text-cyan-50"
    })) ??
    mapValves.map((valve) => ({
      label: valve.label,
      detail: copy.map.valve,
      className: `${valve.style} border-cyan-200/70 bg-cyan-400/20 text-cyan-50`
    }));
  const currentTree = farmState.assets?.trees?.find((tree) => tree.id === robot?.lastInspection?.assetId);
  const robotDetail = robot?.currentWaypointLabel ?? copy.map.robot;
  const liveActivity = farmState.simulation?.currentActivity ?? robot?.observations?.[0] ?? copy.map.robot;
  const patrolScore = Math.min(999, (farmState.simulation?.inspectionsThisHour ?? 0) * 12 + (farmState.simulation?.zonesVisitedThisCycle.length ?? 0) * 25);
  const latestOutcome = farmState.outcomeChecks?.at(-1);
  const journalEvents =
    farmState.journalEntries && farmState.journalEntries.length > 0
      ? farmState.journalEntries.slice(-3).reverse().map((entry) => entry.summary)
      : copy.memoryPanel.events;
  const memoryOutcomeZoneName = highRiskBlock ? localizeZoneName(highRiskBlock.name, copy) : copy.memoryPanel.priorityZone;
  const adminItems = useMemo(() => {
    const communications =
      farmState.communicationEvents
        ?.slice(-3)
        .reverse()
        .map((event, index) => communicationToAdminItem(event, index, copy)) ?? [];
    const outcomes =
      farmState.outcomeChecks
        ?.slice(-2)
        .reverse()
        .map((outcome) => outcomeToAdminItem(outcome, farmState.zones, copy)) ?? [];

    return [
      ...farmState.pendingApprovals.map((approval) => approvalToAdminItem(approval, copy)),
      ...farmState.activeActions.map((action) => actionToAdminItem(action, farmState.zones, copy)),
      ...communications,
      ...outcomes
    ].sort((left, right) => timestampMs(right.timestamp) - timestampMs(left.timestamp));
  }, [copy, farmState.activeActions, farmState.communicationEvents, farmState.outcomeChecks, farmState.pendingApprovals, farmState.zones]);
  const adminFilterCounts = useMemo(
    () => ({
      all: adminItems.length,
      approval: adminItems.filter((item) => item.kind === "approval").length,
      action: adminItems.filter((item) => item.kind === "action").length,
      sent: adminItems.filter((item) => item.kind === "communication").length
    }),
    [adminItems]
  );
  const filteredAdminItems = useMemo(() => {
    return filterAdminItems(adminItems, adminItemFilter);
  }, [adminItemFilter, adminItems]);
  const adminFilterTabs: Array<{
    id: AdminItemFilter;
    label: string;
    count: number;
    activeClassName: string;
    inactiveClassName: string;
  }> = [
    {
      id: "all",
      label: "All",
      count: adminFilterCounts.all,
      activeClassName: "border-white/35 bg-white/[0.12] text-white",
      inactiveClassName: "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.055]"
    },
    {
      id: "approval",
      label: "Approvals",
      count: adminFilterCounts.approval,
      activeClassName: "border-amber-300/45 bg-amber-400/[0.14] text-amber-50",
      inactiveClassName: "border-amber-300/20 bg-amber-400/[0.08] text-amber-100/80 hover:border-amber-300/35 hover:bg-amber-400/[0.12]"
    },
    {
      id: "action",
      label: "Actions",
      count: adminFilterCounts.action,
      activeClassName: "border-sky-300/45 bg-sky-400/[0.14] text-sky-50",
      inactiveClassName: "border-sky-300/20 bg-sky-400/[0.08] text-sky-100/80 hover:border-sky-300/35 hover:bg-sky-400/[0.12]"
    },
    {
      id: "sent",
      label: "Sent",
      count: adminFilterCounts.sent,
      activeClassName: "border-emerald-300/45 bg-emerald-400/[0.14] text-emerald-50",
      inactiveClassName: "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-100/80 hover:border-emerald-300/35 hover:bg-emerald-400/[0.12]"
    }
  ];
  const selectedAdminItem = filteredAdminItems.find((item) => item.id === selectedAdminItemId) ?? filteredAdminItems[0] ?? null;
  const agentPerformanceItems = useMemo(
    () => buildAgentPerformanceItems(performanceEvaluation, performanceTrace, copy),
    [copy, performanceEvaluation, performanceTrace]
  );
  const openAdminItemCount = farmState.pendingApprovals.length + farmState.activeActions.length;
  const urgentAdminItemCount =
    farmState.pendingApprovals.length +
    farmState.activeActions.filter((action) => action.priority === "critical" || action.priority === "high" || action.status === "needs_approval").length;
  const latestCommunication = farmState.communicationEvents?.at(-1);
  const conversationStatusLabel =
    workflowStatus === "running"
      ? copy.conversationPanel.running
      : dataSourceStatus === "backend"
        ? copy.conversationPanel.ready
        : copy.conversationPanel.demoFallback;
  const conversationAiStatusLabel = aiConfig?.ready ? copy.conversationPanel.liveAi : copy.conversationPanel.demoFallback;
  const conversationContextCards: FarmerContextCard[] = [
    {
      id: "priority",
      label: copy.conversationPanel.context.priority,
      value: highRiskBlock ? localizeZoneName(highRiskBlock.name, copy) : copy.conversationPanel.context.noPriority,
      detail: highRiskBlock ? `${highRiskBlock.soilMoisturePct}% ${copy.metricsPanel.soilMoisture}` : copy.metricsPanel.noPriorityBlock,
      tone: highRiskBlock ? "warning" : "success"
    },
    {
      id: "approvals",
      label: copy.conversationPanel.context.approvals,
      value: `${farmState.pendingApprovals.length}`,
      detail: farmState.pendingApprovals.length > 0 ? copy.metricsPanel.needsApproval(farmState.pendingApprovals.length) : copy.conversationPanel.context.noApprovals,
      tone: farmState.pendingApprovals.length > 0 ? "warning" : "success"
    },
    {
      id: "robot",
      label: copy.conversationPanel.context.robot,
      value: robot?.name ?? copy.conversationPanel.context.noRobot,
      detail: robot ? `${robotStatusLabel(robot.status, copy)} - ${robot.batteryPct}%` : copy.metricsPanel.noRobot,
      tone: robot ? "info" : "warning"
    },
    {
      id: "outcome",
      label: copy.conversationPanel.context.outcome,
      value: latestOutcome ? `${latestOutcome.deltaPct} ${copy.metricsPanel.points}` : copy.conversationPanel.context.noOutcome,
      detail: latestOutcome ? localizeKnownText(latestOutcome.summary, copy) : copy.metricsPanel.cards.nextVerify.helper,
      tone: latestOutcome ? "success" : "info"
    },
    {
      id: "tank",
      label: copy.conversationPanel.context.tank,
      value: `${tankLevelPct}%`,
      detail: waterTank ? `${waterTank.availableLiters.toLocaleString()} L - ${statusLabel(waterTank.status, copy)}` : copy.metricsPanel.cards.tankLevel.helper,
      tone: "info"
    },
    {
      id: "communication",
      label: copy.conversationPanel.context.communication,
      value: latestCommunication ? channelLabel(latestCommunication.selectedChannel, copy) : copy.conversationPanel.context.noCommunication,
      detail: latestCommunication ? statusLabel(latestCommunication.status, copy) : copy.conversationPanel.context.noCommunication,
      tone: latestCommunication?.severity === "critical" ? "danger" : latestCommunication ? "success" : "info"
    }
  ];
  const conversationQuickActions: ConversationQuickAction[] = [
    {
      id: "today",
      label: copy.conversationPanel.quickActions.today,
      kind: "prompt",
      tone: "success",
      prompt: copy.conversationPanel.prompts.today
    },
    {
      id: "approvals",
      label: copy.conversationPanel.quickActions.approvals,
      kind: "prompt",
      tone: "warning",
      prompt: copy.conversationPanel.prompts.approvals
    },
    {
      id: "risk",
      label: copy.conversationPanel.quickActions.risk,
      kind: "prompt",
      tone: highRiskBlock ? "warning" : "success",
      prompt: copy.conversationPanel.prompts.risk(highRiskBlock ? localizeZoneName(highRiskBlock.name, copy) : copy.memoryPanel.priorityZone)
    },
    {
      id: "robot",
      label: copy.conversationPanel.quickActions.robot,
      kind: "prompt",
      tone: "info",
      prompt: copy.conversationPanel.prompts.robot
    },
    {
      id: "outcome",
      label: copy.conversationPanel.quickActions.outcome,
      kind: "prompt",
      tone: "info",
      prompt: copy.conversationPanel.prompts.outcome
    },
    {
      id: "communication",
      label: copy.conversationPanel.quickActions.communication,
      kind: "prompt",
      tone: "success",
      prompt: copy.conversationPanel.prompts.communication
    },
    {
      id: "analyze-leaf",
      label: copy.conversationPanel.quickActions.analyzeLeaf,
      kind: "vision",
      tone: "info"
    },
    {
      id: "review-approval",
      label: copy.conversationPanel.quickActions.reviewApproval,
      kind: "approval",
      tone: "warning",
      disabled: farmState.pendingApprovals.length === 0
    }
  ];
  const liveMetricCards = [
    {
      ...copy.metricsPanel.cards.mangoTrees,
      tone: "success"
    },
    {
      ...copy.metricsPanel.cards.priorityBlock,
      value: highRiskBlock ? localizeZoneName(highRiskBlock.name, copy) : copy.common.none,
      helper: highRiskBlock ? `${highRiskBlock.soilMoisturePct}% ${copy.metricsPanel.soilMoisture}` : copy.metricsPanel.noPriorityBlock,
      tone: "warning"
    },
    {
      ...copy.metricsPanel.cards.robot,
      value: `${robot?.batteryPct ?? 0}%`,
      helper: robot?.currentWaypointLabel ?? robotStatusLabel(robot?.status, copy),
      tone: "success"
    },
    {
      ...copy.metricsPanel.cards.tankLevel,
      value: `${tankLevelPct}%`,
      helper: waterTank ? `${waterTank.availableLiters.toLocaleString()} L - ${waterTank.status}` : copy.metricsPanel.cards.tankLevel.helper,
      tone: "info"
    },
    {
      ...copy.metricsPanel.cards.openAlerts,
      value: `${farmState.activeActions.length}`,
      helper: copy.metricsPanel.needsApproval(farmState.pendingApprovals.length),
      tone: "danger"
    },
    {
      ...copy.metricsPanel.cards.nextVerify,
      value: latestOutcome ? `${latestOutcome.deltaPct} ${copy.metricsPanel.points}` : copy.metricsPanel.cards.nextVerify.value,
      helper: latestOutcome ? statusLabel(latestOutcome.status, copy) : copy.metricsPanel.cards.nextVerify.helper,
      tone: "info"
    }
  ];

  const statusSummary = useMemo(() => {
    if (healthStatus === "loading") return copy.statusSummary.loading;
    if (dataSourceStatus === "backend") return copy.statusSummary.ok;
    return copy.statusSummary.error;
  }, [copy, dataSourceStatus, healthStatus]);
  const clockLabel = currentClock
    ? `${clockSource === "server" ? copy.common.server : copy.common.system} ${formatClockTime(currentClock)}`
    : copy.common.syncingTime;
  const updatedAt = clockSource === "server" ? parseTimestamp(farmState.updatedAt) : null;
  const displayUpdatedAt = updatedAt ?? currentClock;
  const updatedAtLabel = displayUpdatedAt ? formatClockTime(displayUpdatedAt, true) : copy.common.syncingTime;

  async function refreshDemoData() {
    const [farm, trace, scorecardResponse] = await Promise.all([
      fetchJson<FarmState>(`${apiBaseUrl}/farm/state`),
      fetchJson<AgentTrace>(`${apiBaseUrl}/agents/trace?language=${encodeURIComponent(language)}`),
      fetchJson<{ scorecards: AgentScorecard[] }>(`${apiBaseUrl}/evaluation/scorecards`)
    ]);

    setFarmState(farm);
    setAgentTrace(trace);
    setEvaluation(scorecardResponse.scorecards);
    setPerformanceTrace(trace);
    setPerformanceEvaluation(scorecardResponse.scorecards);
    const serverTimeMs = Date.parse(farm.updatedAt);
    const serverClockOffsetMs = serverTimeMs - Date.now();
    if (!Number.isNaN(serverTimeMs) && Math.abs(serverClockOffsetMs) <= SERVER_CLOCK_MAX_DRIFT_MS) {
      setClockSource("server");
      setClockOffsetMs(serverClockOffsetMs);
    } else {
      setClockSource("system");
      setClockOffsetMs(0);
    }
    setWorkflowStatus("ready");
    setDataSourceStatus("backend");
    setWorkflowMessage({ type: "loaded", workflow: trace.workflow });
  }

  async function refreshAiConfig() {
    const status = await fetchJson<AiConfigStatus>(`${apiBaseUrl}/ai/config/status`);
    setAiConfig(status);
    setAiConfigMessage(status.ready ? `OpenAI ready: ${status.model}` : "OpenAI key needed");
  }

  useEffect(() => {
    const updateClock = () => setCurrentClock(new Date(Date.now() + clockOffsetMs));
    updateClock();

    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [clockOffsetMs]);

  useEffect(() => {
    refreshDemoData().catch((error: Error) => {
      setClockSource("system");
      setClockOffsetMs(0);
      setWorkflowStatus("error");
      setDataSourceStatus("mock");
      setWorkflowMessage({ type: "fallback", message: error.message });
    });
  }, [apiBaseUrl, language]);

  useEffect(() => {
    refreshAiConfig().catch((error: Error) => {
      setAiConfig(null);
      setAiConfigMessage(error.message === "Not Found" ? "OpenAI setup is available when the AI config route is enabled" : error.message);
    });
  }, [apiBaseUrl]);

  useEffect(() => {
    if (healthStatus !== "ok") return;

    const websocket = new WebSocket(resolveWebsocketUrl(apiBaseUrl));

    websocket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as SimulationTickEvent;
        const nextFarmState = event.data?.farmState;
        if (event.type !== "simulation.tick" || !nextFarmState) return;

        setFarmState(nextFarmState);
        if (event.data?.agentTrace) {
          setAgentTrace(event.data.agentTrace);
          setEvaluation(
            event.data.agentTrace.trace.map((step) => ({
              agent: step.agent,
              confidence: step.confidence,
              latencyMs: step.latencyMs,
              estimatedCostUsd: step.estimatedCostUsd,
              qualityScore: Math.min(0.99, step.confidence + 0.02),
              requiresHumanReview: step.requiresHumanReview,
              workflow: event.data?.agentTrace?.workflow,
              runId: event.data?.agentTrace?.runId,
              createdAt: event.createdAt
            }))
          );
        }
        setLiveEvents((events) => [event, ...events.filter((item) => item.eventId !== event.eventId)].slice(0, 6));
        setDataSourceStatus("backend");
        setWorkflowStatus((status) => (status === "idle" ? "ready" : status));

        const serverTimeMs = Date.parse(nextFarmState.updatedAt);
        const serverClockOffsetMs = serverTimeMs - Date.now();
        if (!Number.isNaN(serverTimeMs) && Math.abs(serverClockOffsetMs) <= SERVER_CLOCK_MAX_DRIFT_MS) {
          setClockSource("server");
          setClockOffsetMs(serverClockOffsetMs);
        }
      } catch {
        // Ignore malformed websocket payloads; periodic HTTP refresh still keeps the demo usable.
      }
    };

    return () => websocket.close();
  }, [apiBaseUrl, healthStatus]);

  useEffect(() => {
    if (filteredAdminItems.length === 0) {
      if (selectedAdminItemId) setSelectedAdminItemId(null);
      return;
    }

    if (!selectedAdminItemId || !filteredAdminItems.some((item) => item.id === selectedAdminItemId)) {
      setSelectedAdminItemId(filteredAdminItems[0].id);
    }
  }, [filteredAdminItems, selectedAdminItemId]);

  useEffect(() => {
    setProfileFirstName(adminUser.firstName);
    setProfileLastName(adminUser.lastName);
    setProfileWhatsapp(adminUser.whatsappNumber ?? "");
    setProfileMobile(adminUser.mobileNumber ?? "");
    setProfileTelegram(adminUser.telegramAccount ?? "");
  }, [adminUser]);

  useEffect(() => {
    if (!isAdminOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAdminOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isAdminOpen]);

  useEffect(() => {
    if (previousConversationLanguageRef.current === language) return;

    previousConversationLanguageRef.current = language;
    setConversationMessages((messages) =>
      messages.length === 0
        ? messages
        : [
            ...messages,
            {
              id: conversationMessageId("language"),
              role: "system",
              text: copy.conversationPanel.system.languageChanged(selectedLanguage.label),
              timestamp: new Date().toISOString(),
              kind: "status",
              status: "sent"
            }
          ]
    );
  }, [copy, language, selectedLanguage.label]);

  function appendConversationMessage(message: Omit<ConversationMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) {
    setConversationMessages((messages) => [
      ...messages,
      {
        ...message,
        id: message.id ?? conversationMessageId(message.role),
        timestamp: message.timestamp ?? new Date().toISOString()
      }
    ]);
  }

  function openConversationPanel() {
    setIsConversationOpen(true);
    setConversationMessages((messages) =>
      messages.length > 0
        ? messages
        : [
            {
              id: conversationMessageId("assistant"),
              role: "assistant",
              text: selectedLanguage.farmerBrief,
              timestamp: new Date().toISOString(),
              kind: "status",
              status: "sent"
            }
          ]
    );
  }

  async function runConversationVision() {
    appendConversationMessage({
      role: "farmer",
      text: copy.conversationPanel.quickActions.analyzeLeaf,
      kind: "vision",
      status: "sent"
    });
    appendConversationMessage({
      role: "system",
      text: copy.conversationPanel.system.visionStarted,
      kind: "vision",
      status: "sent"
    });
    setWorkflowStatus("running");
    setWorkflowMessage({ type: "runningVision" });
    try {
      const result = await fetchJson<AgentEnvelope>(`${apiBaseUrl}/vision/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: "leaf-demo-tomato-001", cropType: "mango", zoneId: "zone-b", language })
      });
      setVisionResult(result);
      appendConversationMessage({
        role: "assistant",
        text: localizeKnownText(result.summary, copy),
        kind: "vision",
        status: "sent",
        envelope: result
      });
      await refreshDemoData();
      setWorkflowMessage({ type: "summary", text: result.summary });
    } catch (error) {
      setWorkflowStatus("error");
      setWorkflowMessage({ type: "error", text: error instanceof Error ? error.message : copy.workflowMessages.visionFailed });
      appendConversationMessage({
        role: "assistant",
        text: error instanceof Error ? error.message : copy.conversationPanel.system.visionFailed,
        kind: "error",
        status: "error"
      });
    }
  }

  async function sendConversationMessage(rawPrompt: string, audioFile?: File | null, callSign?: string) {
    const prompt = rawPrompt.trim();
    if (!prompt && !audioFile && !callSign) return;

    let audioBase64: string | null = null;
    let audioFilename: string | null = null;

    try {
      if (audioFile) {
        audioBase64 = await readFileAsDataUrl(audioFile);
        audioFilename = audioFile.name;
      }

      const displayPrompt = callSign ? copy.conversationPanel.liveCallPrompt(callSign) : prompt || copy.conversationPanel.audioPrompt;
      appendConversationMessage({
        role: "farmer",
        text: displayPrompt,
        kind: "voice",
        status: "sent"
      });
      setWorkflowStatus("running");
      setWorkflowMessage({ type: "runningVoice" });
      const result = await fetchJson<AgentEnvelope<VoiceResponseData>>(`${apiBaseUrl}/voice/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || selectedLanguage.voicePrompt,
          language,
          includeAudio: false,
          audioBase64,
          audioFilename
        })
      });
      setVoiceResult(result);
      appendConversationMessage({
        role: "assistant",
        text: localizeKnownText(result.data.responseText ?? result.summary, copy),
        kind: "voice",
        status: "sent",
        envelope: result,
        audioUrl: result.data.audioUrl
      });
      await refreshDemoData();
      setWorkflowMessage({ type: "summary", text: result.summary });
    } catch (error) {
      setWorkflowStatus("error");
      setWorkflowMessage({ type: "error", text: error instanceof Error ? error.message : copy.workflowMessages.voiceFailed });
      appendConversationMessage({
        role: "assistant",
        text: error instanceof Error ? error.message : copy.conversationPanel.system.voiceFailed,
        kind: "error",
        status: "error"
      });
    }
  }

  function openApprovalReview() {
    if (farmState.pendingApprovals.length === 0) {
      appendConversationMessage({
        role: "system",
        text: copy.conversationPanel.system.noApproval,
        kind: "approval",
        status: "sent"
      });
      return;
    }

    setAdminSection("notifications");
    setAdminItemFilter("approval");
    setSelectedAdminItemId(`approval-${farmState.pendingApprovals[0].id}`);
    setIsAdminOpen(true);
    appendConversationMessage({
      role: "system",
      text: copy.conversationPanel.system.reviewOpened,
      kind: "approval",
      status: "sent"
    });
  }

  async function saveAiKey() {
    if (!aiKeyInput.trim()) {
      setAiConfigMessage("Paste an OpenAI key first");
      return;
    }

    setIsSavingAiKey(true);
    setAiConfigMessage("Validating OpenAI key");
    try {
      const status = await fetchJson<AiConfigStatus & { validation?: { message: string } }>(`${apiBaseUrl}/ai/config/openai-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: aiKeyInput.trim(), validateKey: true })
      });
      setAiConfig(status);
      onAdminUserChange({ ...adminUser, hasOpenAiKey: true });
      setAiKeyInput("");
      setAiConfigMessage(status.validation?.message ?? `OpenAI ready: ${status.model}`);
    } catch (error) {
      setAiConfigMessage(error instanceof Error ? error.message : "OpenAI key validation failed");
    } finally {
      setIsSavingAiKey(false);
    }
  }

  async function saveAdminProfile() {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      setProfileMessage("First name and last name are required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage("Saving Farm Admin settings");
    try {
      const result = await fetchJson<{ user: AdminUser; openAiKey?: { status?: AiConfigStatus; validation?: { message: string } } | null }>(`${apiBaseUrl}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileFirstName.trim(),
          lastName: profileLastName.trim(),
          whatsappNumber: profileWhatsapp.trim() || null,
          mobileNumber: profileMobile.trim() || null,
          telegramAccount: profileTelegram.trim() || null,
          password: profilePassword.trim() || undefined,
          apiKey: aiKeyInput.trim() || undefined
        })
      });

      onAdminUserChange(result.user);
      setProfilePassword("");
      setAiKeyInput("");
      if (result.openAiKey?.status) {
        setAiConfig(result.openAiKey.status);
        setAiConfigMessage(result.openAiKey.validation?.message ?? `OpenAI ready: ${result.openAiKey.status.model}`);
      }
      setProfileMessage("Farm Admin settings saved.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save Farm Admin settings.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function logoutAdmin() {
    setIsLoggingOut(true);
    try {
      await fetchJson<{ authenticated: boolean }>(`${apiBaseUrl}/auth/logout`, { method: "POST" });
    } catch {
      // The UI should still leave the authenticated state if the cookie is stale or already gone.
    } finally {
      setSessionToken(null);
      setIsLoggingOut(false);
      onLogout();
    }
  }

  function zoomMap(direction: "in" | "out") {
    setMapZoom((zoom) => clampMapZoom(zoom + (direction === "in" ? MAP_ZOOM_STEP : -MAP_ZOOM_STEP)));
  }

  function centerMap() {
    setMapZoom(1);
  }

  function selectAdminItemFilter(filter: AdminItemFilter) {
    setAdminItemFilter(filter);
    setSelectedAdminItemId(filterAdminItems(adminItems, filter)[0]?.id ?? null);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#06100f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(36,211,106,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.13),transparent_28%),linear-gradient(180deg,#081512_0%,#071018_48%,#05090d_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6">
        <header className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-4 shadow-2xl shadow-black/30 backdrop-blur xl:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-200/35 bg-[#08221d] shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-300/15">
                <AgriOSMark className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Agri<span className="text-emerald-300">OS</span>
                  </h1>
                  <span className="hidden h-7 w-px bg-white/15 sm:block" />
                  <p className="text-sm font-medium text-slate-300">{copy.header.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-center">
              <StatusPill label={statusSummary} className={healthTone(healthStatus)} />
              <StatusPill label={copy.header.forecast} className="bg-sky-400/15 text-sky-100 ring-sky-300/30" />
              <StatusPill label={clockLabel} className="bg-white/10 text-slate-100 ring-white/10" />
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#07131a]/80 px-3 py-2 text-sm text-slate-200">
                <span className="text-slate-400">{copy.header.languageLabel}</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as LanguageCode)}
                  className="rounded-md border border-white/10 bg-[#0b1b22] px-2 py-1 text-sm font-semibold text-white outline-none"
                  aria-label={copy.header.selectLanguageAria}
                >
                  {Object.entries(translations).map(([code, option]) => (
                    <option key={code} value={code}>
                      {option.language.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setIsAdminOpen((open) => !open)}
                aria-expanded={isAdminOpen}
                aria-label={`${copy.header.farmAdmin}: ${adminUser.firstName} ${adminUser.lastName}, ${openAdminItemCount} open alerts`}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/35 bg-[#07131a]/95 text-sm font-black text-emerald-50 shadow-lg shadow-black/20 ring-1 ring-white/10 transition hover:border-emerald-300/55 hover:bg-emerald-400/12 focus:outline-none focus:ring-2 focus:ring-emerald-300/55"
              >
                {urgentAdminItemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#07131a] bg-amber-300 px-1 text-[10px] font-black text-[#201300]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-300 opacity-45" />
                    <span className="relative">{urgentAdminItemCount}</span>
                  </span>
                ) : null}
                <span>{adminUser.initials}</span>
              </button>
            </div>
          </div>
        </header>

        {isAdminOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close farm admin"
              onClick={() => setIsAdminOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <aside className="absolute inset-2 flex max-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#07131a] text-slate-100 shadow-2xl shadow-black/50 ring-1 ring-emerald-300/10 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-5 sm:w-[min(920px,calc(100vw-2.5rem))]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-200/35 bg-emerald-400/12 text-sm font-black text-emerald-50 ring-1 ring-emerald-300/15">
                    {adminUser.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{copy.header.farmAdmin}</p>
                    <h2 className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">{adminUser.firstName} {adminUser.lastName}</h2>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{adminUser.userId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-100 ring-1 ring-amber-300/20">
                    {urgentAdminItemCount} urgent
                  </span>
                  <button
                    type="button"
                    onClick={logoutAdmin}
                    disabled={isLoggingOut}
                    className="rounded-md border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-50 transition hover:bg-red-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? "Logging out" : "Logout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(false)}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-300/55"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => setAdminSection("notifications")}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    adminSection === "notifications"
                      ? "border-emerald-300/45 bg-emerald-400/12 text-white"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-[0.16em]">Notifications</span>
                  <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">{openAdminItemCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSection("performance")}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    adminSection === "performance"
                      ? "border-sky-300/45 bg-sky-400/12 text-white"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-[0.16em]">Agent performance</span>
                  <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">{agentPerformanceItems.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSection("settings")}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    adminSection === "settings"
                      ? "border-emerald-300/45 bg-emerald-400/12 text-white"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-[0.16em]">Profile settings</span>
                  <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">
                    {adminUser.hasOpenAiKey || aiConfig?.configured ? "key set" : "key empty"}
                  </span>
                </button>
              </div>

              {adminSection === "settings" ? (
                <section className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveAdminProfile();
                      }}
                      className="rounded-lg border border-white/10 bg-[#091923]/92 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Secure profile</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">Farm Admin settings</h3>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${adminUser.hasOpenAiKey || aiConfig?.configured ? "bg-emerald-400/15 text-emerald-100 ring-emerald-300/25" : "bg-amber-300/15 text-amber-100 ring-amber-300/25"}`}>
                          {adminUser.hasOpenAiKey || aiConfig?.configured ? "OpenAI key configured" : "OpenAI key not set"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">First name *</span>
                          <input
                            value={profileFirstName}
                            onChange={(event) => setProfileFirstName(event.target.value)}
                            required
                            autoComplete="given-name"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">Last name *</span>
                          <input
                            value={profileLastName}
                            onChange={(event) => setProfileLastName(event.target.value)}
                            required
                            autoComplete="family-name"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">WhatsApp number</span>
                          <input
                            value={profileWhatsapp}
                            onChange={(event) => setProfileWhatsapp(event.target.value)}
                            autoComplete="tel"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">Mobile number</span>
                          <input
                            value={profileMobile}
                            onChange={(event) => setProfileMobile(event.target.value)}
                            autoComplete="tel"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                          />
                        </label>
                      </div>

                      <label className="mt-3 grid gap-1.5 text-sm text-slate-200">
                        <span className="font-semibold">Telegram account details</span>
                        <input
                          value={profileTelegram}
                          onChange={(event) => setProfileTelegram(event.target.value)}
                          autoComplete="off"
                          className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                        />
                      </label>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">Set new password</span>
                          <input
                            type="password"
                            value={profilePassword}
                            onChange={(event) => setProfilePassword(event.target.value)}
                            autoComplete="new-password"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none focus:border-emerald-300/50"
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm text-slate-200">
                          <span className="font-semibold">Set or replace OpenAI API key</span>
                          <input
                            type="password"
                            value={aiKeyInput}
                            onChange={(event) => setAiKeyInput(event.target.value)}
                            placeholder="sk-..."
                            autoComplete="off"
                            className="min-w-0 rounded-lg border border-white/10 bg-[#0b1b22] px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-sky-300/50"
                            aria-label="OpenAI API key"
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingProfile ? "Saving" : "Save settings"}
                        </button>
                        <button
                          type="button"
                          onClick={saveAiKey}
                          disabled={isSavingAiKey || !aiKeyInput.trim()}
                          className="rounded-lg border border-sky-300/30 bg-sky-400/15 px-4 py-2.5 text-sm font-semibold text-sky-50 transition hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingAiKey ? "Validating" : "Save key only"}
                        </button>
                      </div>

                      <p className="mt-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-slate-300">{profileMessage}</p>
                    </form>

                    <aside className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Account status</p>
                      <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-[#07131a]/80 p-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-200/35 bg-emerald-400/12 text-sm font-black text-emerald-50">
                          {adminUser.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{adminUser.firstName} {adminUser.lastName}</p>
                          <p className="truncate text-xs font-semibold text-slate-400">{adminUser.userId}</p>
                        </div>
                      </div>
                      <dl className="mt-3 grid gap-2 text-xs">
                        <div className="rounded-md border border-white/10 bg-[#07131a]/70 px-3 py-2">
                          <dt className="font-black uppercase tracking-[0.14em] text-slate-500">OpenAI</dt>
                          <dd className="mt-1 font-semibold text-slate-100">{adminUser.hasOpenAiKey || aiConfig?.configured ? "Configured and hidden" : "Not configured"}</dd>
                        </div>
                        <div className="rounded-md border border-white/10 bg-[#07131a]/70 px-3 py-2">
                          <dt className="font-black uppercase tracking-[0.14em] text-slate-500">WhatsApp</dt>
                          <dd className="mt-1 break-words font-semibold text-slate-100">{adminUser.whatsappNumber || "Optional"}</dd>
                        </div>
                        <div className="rounded-md border border-white/10 bg-[#07131a]/70 px-3 py-2">
                          <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Telegram</dt>
                          <dd className="mt-1 break-words font-semibold text-slate-100">{adminUser.telegramAccount || "Optional"}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        onClick={logoutAdmin}
                        disabled={isLoggingOut}
                        className="mt-4 w-full rounded-lg border border-red-300/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-50 transition hover:bg-red-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoggingOut ? "Logging out" : "Logout"}
                      </button>
                    </aside>
                  </div>
                </section>
              ) : adminSection === "notifications" ? (
              <div className="grid min-h-0 flex-1 grid-rows-[240px_minmax(0,1fr)] gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-none">
                <section className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {adminFilterTabs.map((tab) => {
                      const isActive = adminItemFilter === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          aria-label={`Show ${tab.label.toLowerCase()} items (${tab.count})`}
                          aria-pressed={isActive}
                          onClick={() => selectAdminItemFilter(tab.id)}
                          className={`rounded-md border px-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-300/35 ${isActive ? tab.activeClassName : tab.inactiveClassName}`}
                        >
                          <span className="block text-lg font-black text-white">{tab.count}</span>
                          <span className="mt-0.5 block truncate font-semibold">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {filteredAdminItems.length > 0 ? (
                      filteredAdminItems.map((item) => {
                        const isSelected = selectedAdminItem?.id === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedAdminItemId(item.id)}
                            className={`w-full rounded-lg border p-3 text-left transition ${isSelected ? "border-emerald-300/50 bg-emerald-400/12" : "border-white/10 bg-[#07131a]/80 hover:border-white/20 hover:bg-white/[0.055]"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{item.kind}</p>
                                <h3 className="mt-1 truncate text-sm font-semibold text-white">{item.title}</h3>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClasses(item.tone)}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{item.summary}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                                {item.status}
                              </span>
                              {item.timestamp ? (
                                <span className="text-[11px] font-semibold text-slate-400">{formatEventTime(item.timestamp)}</span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">{copy.metricsPanel.noPriorityBlock}</div>
                    )}
                  </div>
                </section>

                <section className="min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-[#091923]/92 p-3 sm:p-4">
                  {selectedAdminItem ? (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Selected {selectedAdminItem.kind}</p>
                          <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">{selectedAdminItem.title}</h3>
                          {selectedAdminItem.timestamp ? (
                            <p className="mt-1 text-xs font-semibold text-slate-400">{formatEventTime(selectedAdminItem.timestamp)}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${toneClasses(selectedAdminItem.tone)}`}>
                          {selectedAdminItem.status}
                        </span>
                      </div>
                      <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-200 sm:text-sm sm:leading-6">{selectedAdminItem.summary}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2">
                        {selectedAdminItem.rows.map((row) => (
                          <div key={`${selectedAdminItem.id}-${row.label}`} className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
                            <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{row.label}</dt>
                            <dd className="mt-1 break-words text-xs font-semibold text-slate-100 sm:text-sm">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">{copy.common.none}</div>
                  )}
                </section>
              </div>
              ) : (
                  <AgentPerformancePanel
                    items={agentPerformanceItems}
                    copy={copy}
                  workflow={workflowLabel(performanceTrace.workflow, copy)}
                  averageQuality={averageQuality}
                  averageConfidence={averageConfidence}
                  totalLatency={totalLatency}
                  totalCost={totalCost}
                  reviewNote={copy.evaluationsPanel.reviewGate(highRiskBlock ? localizeZoneName(highRiskBlock.name, copy) : copy.evaluationsPanel.none)}
                />
              )}
            </aside>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
          <Panel
            eyebrow={copy.map.eyebrow}
            title={copy.map.title}
            action={<span className="text-xs text-slate-400">{copy.map.action}</span>}
          >
            <div className="rounded-lg border border-white/10 bg-[#0a1812]">
              <div className="overflow-x-auto">
                <div className="relative aspect-[16/9] min-w-[720px] overflow-hidden xl:min-w-0">
                  <div
                    className="absolute inset-0 origin-center transition-transform duration-300 ease-out will-change-transform"
                    style={{ transform: `scale(${mapZoom})` }}
                  >
                    <Image src="/images/mango-farm-top-view.png" alt={copy.map.imageAlt} fill priority sizes="(min-width: 1536px) 60vw, 100vw" className="object-cover opacity-85" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#06100f]/36 via-[#06100f]/10 to-[#071018]/54" />
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M5 49.5 H92" fill="none" stroke="rgba(246,196,118,0.24)" strokeWidth="4.2" />
                      <path d="M50 7 V91" fill="none" stroke="rgba(246,196,118,0.23)" strokeWidth="4.2" />
                      <path d="M5 49.5 H92" fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="0.55" strokeDasharray="1 2" />
                      <path d="M50 7 V91" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.55" strokeDasharray="1 2" />
                      <path d="M13 89 C25 72 36 58 49 49 C59 42 64 35 72 25" fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth="0.95" strokeDasharray="2 2" />
                      <path d="M49 49 L80 49 L84 66" fill="none" stroke="rgba(52,211,153,0.82)" strokeWidth="0.75" strokeDasharray="1.5 1.5" />
                    </svg>

              {liveOrchardBlocks.map((block) => {
                const classes = riskClasses(block.riskLevel);
                const style = zoneBoundsStyle(block);

                return (
                  <article
                    key={block.id}
                    className={`absolute rounded-lg border-2 border-dashed ${classes.border} ${classes.fill} px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.28)] backdrop-blur-[1px]`}
                    style={style}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${classes.text}`}>{localizeZoneName(block.name, copy)}</p>
                        <h3 className="mt-1 text-base font-bold text-white">{copy.map.orchard[block.id]?.variety ?? block.variety} {copy.map.mango}</h3>
                      </div>
                      <div className="max-w-[210px] rounded-md bg-black/35 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${classes.badge}`}>{riskLabel(block.riskLevel, copy)}</span>
                          <span className="text-xs font-semibold text-white">{block.soilMoisturePct}% H2O</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-200">{block.treeCount} {copy.map.trees} - {copy.map.orchard[block.id]?.activeIssue ?? block.activeIssue}</p>
                      </div>
                    </div>
                  </article>
                );
              })}

              {liveMapSensors.map((sensor) => (
                <MapIcon key={`${sensor.label}-${sensor.detail}`} icon="S" label={sensor.label} detail={sensor.detail} className={sensor.className} style={sensor.style} />
              ))}
              {liveMapValves.map((valve) => (
                <MapIcon key={`${valve.label}-${valve.detail}`} icon="V" label={valve.label} detail={valve.detail} className={valve.className} style={valve.style} />
              ))}
              <RobotMapMarker robot={robot} detail={robotDetail} style={robotMarkerStyle(robot)} />
              {currentTree ? (
                <MapMarker label={currentTree.id.replace("tree-", "T-").toUpperCase()} detail={copy.map.leafScan} className="border-amber-200/70 bg-amber-300/22 text-amber-50" style={assetMarkerStyle(currentTree.location)} />
              ) : (
                <MapMarker label="T23" detail={copy.map.leafScan} className="left-[68%] top-[29%] border-amber-200/70 bg-amber-300/22 text-amber-50" />
              )}
              <MapMarker label="WT" detail={`${tankLevelPct}% ${copy.map.tank}`} className="border-cyan-200/70 bg-cyan-300/22 text-cyan-50" style={waterTank ? assetMarkerStyle(waterTank.location) : undefined} />
              <MapMarker label="G1" detail={copy.map.gate} className="left-[10%] top-[86%] border-white/40 bg-white/14 text-white" />
              <MapIcon icon="M" label="M1" detail={copy.map.mangoBlock} className="left-[47%] top-[5%] border-lime-200/70 bg-lime-400/20 text-lime-50" />
              <MapIcon icon="P" label="P" detail={pump ? `${pump.status} ${pump.pressureBar} bar` : copy.map.calibratedPath} className="left-[55%] top-[44%] border-sky-200/70 bg-sky-400/20 text-sky-50" style={pump ? assetMarkerStyle(pump.location) : undefined} />
                  </div>

              <div className="absolute right-4 top-4 z-30 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#06100f]/86 text-sm text-white shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => zoomMap("in")}
                  disabled={mapZoom >= MAP_MAX_ZOOM}
                  className="border-b border-white/10 px-3 py-2 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label={copy.map.controls.zoomIn}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => zoomMap("out")}
                  disabled={mapZoom <= MAP_MIN_ZOOM}
                  className="border-b border-white/10 px-3 py-2 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label={copy.map.controls.zoomOut}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={centerMap}
                  className="border-b border-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                  aria-label={copy.map.controls.center}
                >
                  {copy.map.controls.centerShort}
                </button>
                <span className="px-2 py-1 text-center text-[10px] font-bold text-slate-300">{Math.round(mapZoom * 100)}%</span>
              </div>

                </div>
              </div>
              <div className="grid gap-2 border-t border-white/10 bg-[#06100f]/82 p-2 text-xs text-slate-200 shadow-xl backdrop-blur lg:grid-cols-[minmax(260px,0.85fr)_1fr]">
                <div className="rounded-lg border border-white/10 bg-[#07131a]/78 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold uppercase tracking-[0.16em] text-sky-100">Patrol score</span>
                    <span className="rounded-full bg-sky-400/15 px-2 py-0.5 font-black text-sky-50 ring-1 ring-sky-300/30">{patrolScore}</span>
                  </div>
                  <p className="mt-2 leading-5 text-slate-100">{liveActivity}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-black/35">
                    <div className="h-1.5 rounded-full bg-sky-300 transition-all duration-700" style={{ width: `${farmState.simulation?.routeProgressPct ?? robot?.routeProgressPct ?? 0}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span>Tick {farmState.simulation?.tick ?? "--"}</span>
                    <span>{farmState.simulation?.routeStep ?? 0}/{farmState.simulation?.routeStepCount ?? 0}</span>
                    <span>{farmState.simulation?.zonesVisitedThisCycle.length ?? 0}/4 zones</span>
                  </div>
                </div>
                <div className="flex flex-wrap content-start gap-2">
                  {mapLegend.map((item) => (
                    <LegendChip key={item.label} icon={item.icon} label={mapLegendLabel(item.label, copy)} tone={item.tone} />
                  ))}
                </div>
              </div>
              {liveEvents.length > 0 ? (
                <div className="grid gap-2 border-t border-white/10 bg-[#07131a]/88 p-3 text-xs text-slate-200 sm:grid-cols-3">
                  {liveEvents.slice(0, 3).map((event) => (
                    <article key={event.eventId} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-emerald-100">Tick {event.sequence}</span>
                        <span className="text-[11px] text-slate-400">{formatEventTime(event.createdAt)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 leading-5 text-slate-300">{event.data?.farmState?.simulation?.currentActivity ?? event.data?.robotEnvelope?.summary}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel
              eyebrow={workflowLabel(agentTrace.workflow, copy)}
              title={copy.agentTimeline.title}
              action={<StatusPill label={statusLabel(agentTrace.status, copy)} className="bg-emerald-400/15 text-emerald-100 ring-emerald-300/30" />}
            >
              <ol className="relative space-y-3 before:absolute before:left-5 before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-white/10">
                {agentTrace.trace.map((step, index) => (
                  <li key={`${step.agent}-${index}`} className="relative grid grid-cols-[44px_1fr_auto] gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0c1d24] text-sm font-black text-emerald-200">
                      {step.agent.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{formatAgentName(step.agent, copy)}</p>
                        {step.requiresHumanReview ? <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-100">{copy.agentTimeline.review}</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{localizeKnownText(step.summary, copy)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span>{Math.round(step.confidence * 100)}% {copy.agentTimeline.confidence}</span>
                        <span>{step.latencyMs} {copy.agentTimeline.ms}</span>
                        <span>${step.estimatedCostUsd.toFixed(4)}</span>
                      </div>
                    </div>
                    <span className="self-start rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-300/20">
                      {statusLabel(step.status, copy)}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>

            <MemoryOutcomePanel copy={copy} latestOutcome={latestOutcome} journalEvents={journalEvents} zoneName={memoryOutcomeZoneName} />

          </div>
        </section>

        <section className="grid gap-4">
          <Panel
            eyebrow={copy.metricsPanel.eyebrow}
            title={copy.metricsPanel.title}
            action={<span className="text-xs text-slate-400">{copy.metricsPanel.updated.replace("10:30:25 AM", updatedAtLabel)}</span>}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {liveMetricCards.map((metric) => (
                <article key={metric.label} className={`rounded-lg border p-4 ${toneClasses(metric.tone)}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-300">{metric.helper}</p>
                  <div className="mt-4 h-1.5 rounded-full bg-black/25">
                    <div className="h-1.5 w-3/4 rounded-full bg-current opacity-80" />
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <footer className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.footer.backend}: {localizeKnownText(healthMessage, copy)}</p>
          <p>{apiBaseUrl} - {copy.footer.connectedSensors}: {connectedSensorCount} - {copy.footer.activeRobot}: {farmState.robots.length} - {copy.footer.pendingAlerts}: {farmState.pendingApprovals.length}</p>
        </footer>

        <FarmerConversationPanel
          isOpen={isConversationOpen}
          apiBaseUrl={apiBaseUrl}
          language={language}
          copy={copy}
          selectedLanguageLabel={selectedLanguage.label}
          selectedLanguageShortLabel={selectedLanguage.shortLabel}
          statusLabel={conversationStatusLabel}
          aiStatusLabel={conversationAiStatusLabel}
          urgentCount={urgentAdminItemCount}
          isRunning={workflowStatus === "running"}
          messages={conversationMessages}
          quickActions={conversationQuickActions}
          contextCards={conversationContextCards}
          callSign={FARM_CALL_SIGN}
          onOpen={openConversationPanel}
          onClose={() => setIsConversationOpen(false)}
          onSendPrompt={sendConversationMessage}
          onAnalyzeLeaf={runConversationVision}
          onReviewApproval={openApprovalReview}
        />
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0a1720]/78 p-4 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MemoryOutcomePanel({
  copy,
  latestOutcome,
  journalEvents,
  zoneName
}: {
  copy: AppCopy;
  latestOutcome?: OutcomeCheck;
  journalEvents: string[];
  zoneName: string;
}) {
  return (
    <Panel
      eyebrow={copy.memoryPanel.eyebrow}
      title={copy.memoryPanel.title}
      action={
        latestOutcome ? (
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/25">
            {latestOutcome.deltaPct} {copy.metricsPanel.points}
          </span>
        ) : undefined
      }
    >
      <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{copy.memoryPanel.outcomeAgent}</p>
        <p className="mt-2 text-sm leading-6 text-slate-100">
          {latestOutcome ? localizeKnownText(latestOutcome.summary, copy) : copy.memoryPanel.baseline(zoneName)}
        </p>
        {latestOutcome ? (
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-white/10 bg-black/16 px-2.5 py-2">
              <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Before</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{latestOutcome.beforeValue}</dd>
            </div>
            <div className="rounded-md border border-white/10 bg-black/16 px-2.5 py-2">
              <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">After</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{latestOutcome.afterValue}</dd>
            </div>
            <div className="rounded-md border border-white/10 bg-black/16 px-2.5 py-2">
              <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Target</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{latestOutcome.targetValue}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <ul className="mt-3 grid gap-2">
        {journalEvents.map((event) => (
          <li key={event} className="rounded-lg border border-white/10 bg-[#07131a]/70 px-3 py-2 text-sm leading-5 text-slate-300">
            {localizeKnownText(event, copy)}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ring-1 ${className}`}>
      <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
}

function MapMarker({ label, detail, className, style }: { label: string; detail: string; className: string; style?: CSSProperties }) {
  return (
    <div className={`absolute z-20 rounded-lg border px-2.5 py-2 text-xs font-semibold shadow-xl backdrop-blur ${className}`} style={style}>
      <p className="text-sm font-black">{label}</p>
      <p className="whitespace-nowrap text-[11px] opacity-90">{detail}</p>
    </div>
  );
}

function RobotMapMarker({ robot, detail, style }: { robot?: FarmRobot; detail: string; style: CSSProperties }) {
  const batteryPct = robot?.batteryPct ?? 0;
  const status = robot?.status ?? "assigned";

  return (
    <div
      className="absolute z-30 transition-[left,top] duration-700 ease-out"
      style={style}
      aria-label={`${robot?.name ?? "Robot R1"} ${status} ${batteryPct}%`}
    >
      <span className="absolute -inset-3 rounded-full border border-sky-200/45 bg-sky-300/10 shadow-[0_0_30px_rgba(56,189,248,0.55)] animate-pulse" />
      <div className="relative flex items-center gap-2 rounded-full border border-sky-100/80 bg-sky-400/35 px-2 py-1.5 text-sky-50 shadow-2xl shadow-sky-950/50 backdrop-blur-md ring-4 ring-sky-300/15">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-[#062334] text-sky-50">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <rect x="5" y="7" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 7V5.2M16 7V5.2M9 17v2M15 17v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9.5" cy="12" r="1.25" fill="currentColor" />
            <circle cx="14.5" cy="12" r="1.25" fill="currentColor" />
            <path d="M10 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="grid min-w-0 leading-tight">
          <span className="text-sm font-black text-white">R1</span>
          <span className="max-w-[116px] truncate text-[11px] font-semibold text-sky-50">{detail}</span>
        </span>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-black text-white">{batteryPct}%</span>
      </div>
      <span className="absolute left-1/2 top-[calc(100%+4px)] -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-200/35 bg-[#06100f]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-100">
        moving
      </span>
    </div>
  );
}

function MapIcon({ icon, label, detail, className, style }: { icon: string; label: string; detail: string; className: string; style?: CSSProperties }) {
  return (
    <div className={`absolute z-20 flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-bold shadow-xl backdrop-blur ${className}`} style={style}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-[10px]">{icon}</span>
      <span>{label}</span>
      <span className="sr-only">{detail}</span>
    </div>
  );
}

function LegendChip({ icon, label, tone }: { icon: string; label: string; tone: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-semibold ${iconToneClasses(tone)}`}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/28 text-[10px]">{icon}</span>
      {label}
    </span>
  );
}

function iconToneClasses(tone: string) {
  if (tone === "robot") return "border-sky-300/30 bg-sky-400/16 text-sky-50";
  if (tone === "valve") return "border-cyan-300/30 bg-cyan-400/16 text-cyan-50";
  if (tone === "tank") return "border-blue-300/30 bg-blue-400/16 text-blue-50";
  if (tone === "mango") return "border-lime-300/30 bg-lime-400/16 text-lime-50";
  if (tone === "path") return "border-indigo-300/30 bg-indigo-400/16 text-indigo-50";
  return "border-emerald-300/30 bg-emerald-400/16 text-emerald-50";
}

function AgentPerformancePanel({
  items,
  copy,
  workflow,
  averageQuality,
  averageConfidence,
  totalLatency,
  totalCost,
  reviewNote
}: {
  items: AgentPerformanceItem[];
  copy: AppCopy;
  workflow: string;
  averageQuality: number;
  averageConfidence: number;
  totalLatency: number;
  totalCost: number;
  reviewNote: string;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="rounded-lg border border-white/10 bg-[#091923]/92 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">{copy.evaluationsPanel.eyebrow}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Agent Performance</h3>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-300">{workflow}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TrustMetric label={copy.evaluationsPanel.quality} value={`${Math.round(averageQuality * 100)}%`} tone="success" />
          <TrustMetric label={copy.evaluationsPanel.confidence} value={`${Math.round(averageConfidence * 100)}%`} tone="success" />
          <TrustMetric label={copy.evaluationsPanel.latency} value={`${(totalLatency / 1000).toFixed(1)}s`} tone="info" />
          <TrustMetric label={copy.evaluationsPanel.cost} value={`$${totalCost.toFixed(4)}`} tone="warning" />
        </div>

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <article key={item.agent} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0c1d24] text-xs font-black text-emerald-200">
                      {item.agent.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-semibold text-white">{item.name}</h4>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary}</p>
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${toneClasses(item.statusTone)}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <AgentPerfMetric label={copy.evaluationsPanel.quality} value={`${Math.round(item.qualityScore * 100)}%`} />
                <AgentPerfMetric label={copy.evaluationsPanel.confidence} value={`${Math.round(item.confidence * 100)}%`} />
                <AgentPerfMetric label={copy.evaluationsPanel.latency} value={`${item.latencyMs} ${copy.agentTimeline.ms}`} />
                <AgentPerfMetric label={copy.evaluationsPanel.cost} value={`$${item.estimatedCostUsd.toFixed(4)}`} />
              </div>

              {item.deliverySuccess !== undefined ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <AgentPerfMetric label="Routing" value={`${Math.round((item.routingAccuracy ?? 0) * 100)}%`} />
                  <AgentPerfMetric label="Delivery" value={`${Math.round(item.deliverySuccess * 100)}%`} />
                  <AgentPerfMetric label="Fallback" value={`${Math.round((item.fallbackSuccess ?? 0) * 100)}%`} />
                  <AgentPerfMetric label="Language" value={`${Math.round((item.languageMatchScore ?? 0) * 100)}%`} />
                  <AgentPerfMetric label="Grounding" value={`${Math.round((item.groundingScore ?? 0) * 100)}%`} />
                  <AgentPerfMetric label="Follow-up" value={`${Math.round((item.conversationAnswerScore ?? 0) * 100)}%`} />
                </div>
              ) : null}

              {item.requiresHumanReview ? (
                <p className="mt-2 rounded-md border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-50">
                  {copy.agentTimeline.review}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <p className="mt-4 rounded-md border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-50">{reviewNote}</p>
      </div>
    </section>
  );
}

function AgentPerfMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function TrustMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article className={`rounded-md border px-3 py-2 ${toneClasses(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </article>
  );
}
