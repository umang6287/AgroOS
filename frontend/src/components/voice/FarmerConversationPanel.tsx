"use client";

import { useEffect, useRef, useState } from "react";

import { AgriOSMark } from "@/components/shared/AgriOSMark";
import { authHeaders } from "@/lib/api";
import type { AppCopy, Tone } from "@/lib/i18n";
import type { AgentEnvelope } from "@/types/agents";

export type ConversationMessage = {
  id: string;
  role: "farmer" | "assistant" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "sending" | "error";
  kind?: "status" | "voice" | "vision" | "approval" | "communication" | "error";
  envelope?: AgentEnvelope;
  audioUrl?: string | null;
};

export type ConversationQuickAction = {
  id: string;
  label: string;
  kind: "prompt" | "vision" | "approval";
  tone: Tone | string;
  prompt?: string;
  disabled?: boolean;
};

export type FarmerContextCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: Tone | string;
};

type FarmerConversationPanelProps = {
  isOpen: boolean;
  apiBaseUrl: string;
  language: string;
  copy: AppCopy;
  selectedLanguageLabel: string;
  selectedLanguageShortLabel: string;
  statusLabel: string;
  aiStatusLabel: string;
  urgentCount: number;
  isRunning: boolean;
  messages: ConversationMessage[];
  quickActions: ConversationQuickAction[];
  contextCards: FarmerContextCard[];
  callSign: string;
  onOpen: () => void;
  onClose: () => void;
  onSendPrompt: (prompt: string, audioFile?: File | null, callSign?: string) => Promise<void>;
  onAnalyzeLeaf: () => Promise<void>;
  onReviewApproval: () => void;
};

export function FarmerConversationPanel({
  isOpen,
  apiBaseUrl,
  language,
  copy,
  selectedLanguageLabel,
  selectedLanguageShortLabel,
  statusLabel,
  aiStatusLabel,
  urgentCount,
  isRunning,
  messages,
  quickActions,
  contextCards,
  callSign,
  onOpen,
  onClose,
  onSendPrompt,
  onAnalyzeLeaf,
  onReviewApproval
}: FarmerConversationPanelProps) {
  const [draft, setDraft] = useState("");
  const [callState, setCallState] = useState<"idle" | "connecting" | "realtime" | "recording">("idle");
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0);
  const [callCaption, setCallCaption] = useState("");
  const [audioError, setAudioError] = useState("");
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const realtimePeerRef = useRef<RTCPeerConnection | null>(null);
  const realtimeDataChannelRef = useRef<RTCDataChannel | null>(null);
  const realtimeLocalStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const isCallBusy = callState !== "idle";
  const isLiveCallActive = callState === "realtime" || callState === "recording";

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (!isOpen) return;
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [isOpen, messages, isRunning]);

  useEffect(() => {
    return () => {
      cleanupRealtimeCall();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!callStartedAt) return;

    setCallElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    const interval = window.setInterval(() => {
      setCallElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [callStartedAt]);

  const canSend = draft.trim().length > 0 && !isCallBusy;

  async function submitPrompt(prompt = draft) {
    if (!prompt.trim() || isRunning || isCallBusy) return;
    setDraft("");
    await onSendPrompt(prompt);
  }

  async function runQuickAction(action: ConversationQuickAction) {
    if (action.disabled || isRunning || isCallBusy) return;
    if (action.kind === "vision") {
      await onAnalyzeLeaf();
      return;
    }
    if (action.kind === "approval") {
      onReviewApproval();
      return;
    }
    if (action.prompt) await onSendPrompt(action.prompt);
  }

  async function startLiveCall() {
    setAudioError("");
    setCallCaption("");
    if (isRunning) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioError(copy.conversationPanel.micUnavailable);
      return;
    }

    try {
      if (typeof RTCPeerConnection === "undefined") {
        await startFallbackRecording(copy.conversationPanel.liveCallUnavailable);
        return;
      }

      setCallState("connecting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      realtimeLocalStreamRef.current = stream;

      const peer = new RTCPeerConnection();
      realtimePeerRef.current = peer;

      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream || !remoteAudioRef.current) return;
        remoteAudioRef.current.srcObject = remoteStream;
        void remoteAudioRef.current.play().catch(() => undefined);
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          setAudioError(copy.conversationPanel.liveCallUnavailable);
          cleanupRealtimeCall();
          setCallState("idle");
          setCallStartedAt(null);
          setCallElapsedSeconds(0);
          setCallCaption("");
        }
      };

      stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));

      const dataChannel = peer.createDataChannel("oai-events");
      realtimeDataChannelRef.current = dataChannel;
      dataChannel.onmessage = (event) => handleRealtimeEvent(event.data);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const response = await fetch(`${apiBaseUrl}/voice/realtime/session?language=${encodeURIComponent(language)}&callSign=${encodeURIComponent(callSign)}`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders({ "Content-Type": "application/sdp" }),
        body: offer.sdp ?? "",
      });

      if (!response.ok) {
        throw new Error(await realtimeErrorMessage(response));
      }

      const answerSdp = await response.text();
      await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setCallStartedAt(Date.now());
      setCallElapsedSeconds(0);
      setCallState("realtime");
      setAudioError("");
    } catch (error) {
      cleanupRealtimeCall();
      await startFallbackRecording(error instanceof Error ? error.message : copy.conversationPanel.liveCallUnavailable);
    }
  }

  async function startFallbackRecording(reason: string) {
    if (typeof MediaRecorder === "undefined") {
      setCallState("idle");
      setAudioError(reason || copy.conversationPanel.micUnavailable);
      return;
    }

    setAudioError(reason ? `${reason} ${copy.conversationPanel.fallbackRecording}` : copy.conversationPanel.fallbackRecording);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const file = blob.size > 0 ? new File([blob], callAudioFilename(callSign), { type: mimeType }) : null;

        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setCallState("idle");
        setCallStartedAt(null);
        setCallElapsedSeconds(0);
        void onSendPrompt("", file, callSign);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setCallStartedAt(Date.now());
      setCallElapsedSeconds(0);
      setCallState("recording");
    } catch {
      setAudioError(copy.conversationPanel.micUnavailable);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      setCallState("idle");
      setCallStartedAt(null);
      setCallElapsedSeconds(0);
    }
  }

  function endLiveCall() {
    if (callState === "realtime" || callState === "connecting") {
      cleanupRealtimeCall();
      setCallState("idle");
      setCallStartedAt(null);
      setCallElapsedSeconds(0);
      setCallCaption("");
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
    setCallState("idle");
    setCallStartedAt(null);
    setCallElapsedSeconds(0);
  }

  function cleanupRealtimeCall() {
    realtimeDataChannelRef.current?.close();
    realtimePeerRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    realtimePeerRef.current?.close();
    realtimeLocalStreamRef.current?.getTracks().forEach((track) => track.stop());
    realtimeDataChannelRef.current = null;
    realtimePeerRef.current = null;
    realtimeLocalStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }

  function handleRealtimeEvent(payload: string) {
    try {
      const event = JSON.parse(payload) as { type?: string; delta?: string; transcript?: string; error?: { message?: string } };
      if (event.type === "response.audio_transcript.delta" && event.delta) {
        setCallCaption((caption) => `${caption}${event.delta}`);
      }
      if (event.type === "response.audio_transcript.done" && event.transcript) {
        setCallCaption(event.transcript);
      }
      if (event.type === "error") {
        setAudioError(event.error?.message ?? copy.conversationPanel.liveCallUnavailable);
      }
    } catch {
      // Ignore non-JSON transport diagnostics.
    }
  }

  function closePanel() {
    if (isCallBusy) {
      endLiveCall();
    }
    onClose();
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-emerald-200/30 bg-[#08221d]/95 px-4 py-3 text-left text-sm text-white shadow-2xl shadow-black/40 ring-1 ring-emerald-300/20 backdrop-blur transition hover:border-emerald-200/55 hover:bg-[#0a2a23] focus:outline-none focus:ring-2 focus:ring-emerald-200/70"
        aria-label={copy.conversationPanel.launcherLabel}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200/35 bg-[#08221d] shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-300/15">
          <AgriOSMark className="h-9 w-9" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{copy.conversationPanel.launcherLabel}</span>
          <span className="mt-0.5 block truncate text-xs text-emerald-100/80">{statusLabel} - {callSign}</span>
        </span>
        {urgentCount > 0 ? (
          <span className="ml-1 rounded-full bg-amber-300 px-2 py-0.5 text-xs font-black text-amber-950">{urgentCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40">
          <button type="button" aria-label={copy.conversationPanel.closeLabel} onClick={closePanel} className="absolute inset-0 bg-black/45 backdrop-blur-sm lg:bg-black/25" />
          <section className="absolute inset-x-2 bottom-2 top-10 flex overflow-hidden rounded-lg border border-white/10 bg-[#07131a] text-slate-100 shadow-2xl shadow-black/50 ring-1 ring-emerald-300/15 sm:inset-x-5 sm:bottom-5 lg:inset-x-auto lg:right-5 lg:top-5 lg:w-[min(440px,calc(100vw-2.5rem))]">
            <div className="flex min-h-0 w-full flex-col">
              <header className="border-b border-white/10 bg-white/[0.045] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200/35 bg-[#08221d] shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-300/15">
                      <AgriOSMark className="h-9 w-9" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-white">{copy.conversationPanel.title}</h2>
                      <p className="mt-1 text-xs text-slate-400">{copy.conversationPanel.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-300/55"
                  >
                    {copy.conversationPanel.closeLabel}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 font-semibold text-emerald-100">{statusLabel}</span>
                  <span className="rounded-md border border-sky-300/25 bg-sky-400/10 px-2.5 py-1 font-semibold text-sky-100">{aiStatusLabel}</span>
                  <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 font-semibold text-slate-100">
                    {selectedLanguageLabel} {selectedLanguageShortLabel}
                  </span>
                  <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 font-semibold text-amber-100">
                    {copy.conversationPanel.callSignLabel}: {callSign}
                  </span>
                </div>
              </header>

              <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <div className="grid grid-cols-2 gap-2">
                  {contextCards.map((card) => (
                    <article key={card.id} className={`rounded-lg border p-2.5 ${toneClasses(card.tone)}`}>
                      <p className="text-[11px] font-semibold text-slate-300">{card.label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{card.value}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-300">{card.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {messages.map((message) => (
                    <ConversationBubble key={message.id} message={message} copy={copy} />
                  ))}
                  {isRunning ? (
                    <div className="flex justify-start">
                      <div className="max-w-[86%] rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-50">
                        <span className="font-semibold">{copy.conversationPanel.assistantName}</span>
                        <p className="mt-1 text-slate-200">{copy.conversationPanel.typing}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <footer className="border-t border-white/10 bg-[#06100f]/92 p-3">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={action.disabled || isRunning || isCallBusy}
                      onClick={() => void runQuickAction(action)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses(action.tone)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitPrompt();
                      }
                    }}
                    rows={2}
                    placeholder={copy.conversationPanel.inputPlaceholder}
                    disabled={isRunning || isCallBusy}
                    className="max-h-28 min-h-12 resize-none rounded-md border border-white/10 bg-[#0b1b22] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/55"
                  />
                  <div className={`rounded-lg border p-2.5 ${isLiveCallActive ? "border-red-300/35 bg-red-500/10" : callState === "connecting" ? "border-amber-300/30 bg-amber-400/10" : "border-sky-300/25 bg-sky-400/10"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${isLiveCallActive ? "border-red-200/45 bg-red-400/15 text-red-100" : callState === "connecting" ? "border-amber-200/40 bg-amber-400/12 text-amber-100" : "border-sky-200/35 bg-sky-400/12 text-sky-100"}`}>
                          <PhoneIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{copy.conversationPanel.liveCall}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{callSign}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isLiveCallActive ? "bg-red-300/15 text-red-100 ring-1 ring-red-200/25" : callState === "connecting" ? "bg-amber-300/15 text-amber-100 ring-1 ring-amber-200/25" : "bg-sky-300/15 text-sky-100 ring-1 ring-sky-200/25"}`}>
                          {callStatusLabel(callState, copy)}
                        </span>
                        <span className="min-w-[44px] text-right font-mono text-xs font-semibold text-slate-200">{formatCallDuration(callElapsedSeconds)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={isCallBusy ? endLiveCall : () => void startLiveCall()}
                        disabled={isRunning}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isCallBusy
                            ? "border-red-300/40 bg-red-400/15 text-red-100 hover:bg-red-400/22"
                            : "border-emerald-300/30 bg-emerald-400/18 text-emerald-50 hover:bg-emerald-400/28"
                        }`}
                      >
                        <PhoneIcon className="h-4 w-4" />
                        {isCallBusy ? copy.conversationPanel.endCall : copy.conversationPanel.startCall}
                      </button>
                      <button
                        type="button"
                        disabled={!canSend || isRunning}
                        onClick={() => void submitPrompt()}
                        className="rounded-lg border border-emerald-300/30 bg-emerald-400/18 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/28 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {copy.conversationPanel.sendLabel}
                      </button>
                    </div>
                    {callCaption ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-200">{callCaption}</p> : null}
                  </div>
                  <audio ref={remoteAudioRef} autoPlay className="sr-only" />
                  {audioError ? <p className="text-xs text-amber-100">{audioError}</p> : null}
                </div>
              </footer>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ConversationBubble({ message, copy }: { message: ConversationMessage; copy: AppCopy }) {
  const isFarmer = message.role === "farmer";
  const isSystem = message.role === "system";
  const label = isFarmer ? copy.conversationPanel.farmerLabel : isSystem ? copy.conversationPanel.systemLabel : copy.conversationPanel.assistantName;
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.timestamp));

  return (
    <div className={`flex ${isFarmer ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[88%] rounded-lg border px-3 py-2 text-sm shadow-lg ${
          isFarmer
            ? "border-sky-300/25 bg-sky-400/14 text-sky-50"
            : isSystem
              ? "border-white/10 bg-white/[0.045] text-slate-200"
              : message.status === "error"
                ? "border-amber-300/25 bg-amber-400/10 text-amber-50"
                : "border-emerald-300/22 bg-emerald-400/10 text-emerald-50"
        }`}
      >
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
          <span>{label}</span>
          <span>{time}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap leading-5 text-slate-100">{message.text}</p>
        {message.audioUrl ? <audio className="mt-2 w-full" controls src={message.audioUrl} /> : null}
      </article>
    </div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7.3 4.8 9.2 4c.7-.3 1.5 0 1.8.7l1.1 2.6c.2.6.1 1.2-.4 1.6l-1.1.9c.8 1.6 2 2.8 3.6 3.6l.9-1.1c.4-.5 1.1-.6 1.6-.4l2.6 1.1c.7.3 1 1.1.7 1.8l-.8 1.9c-.3.8-1.1 1.2-1.9 1.1C11.8 17.8 6.2 12.2 5.8 6.7c-.1-.8.4-1.6 1.5-1.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5.5c1.7.5 3 1.8 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatCallDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function callAudioFilename(callSign: string) {
  return `${callSign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-call.webm`;
}

async function realtimeErrorMessage(response: Response) {
  try {
    const body = await response.json();
    if (response.status === 401 && typeof body.detail === "string") {
      return `${body.detail} Please sign in again to use live AI calling.`;
    }
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // Fall through to the generic HTTP message.
  }
  return `Realtime call failed with ${response.status}.`;
}

function callStatusLabel(callState: "idle" | "connecting" | "realtime" | "recording", copy: AppCopy) {
  if (callState === "connecting") return copy.conversationPanel.connectingCall;
  if (callState === "realtime") return copy.conversationPanel.callActive;
  if (callState === "recording") return copy.conversationPanel.fallbackCall;
  return copy.conversationPanel.callReady;
}

function toneClasses(tone: Tone | string) {
  if (tone === "danger") return "border-red-400/30 bg-red-500/10 text-red-100";
  if (tone === "warning") return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  if (tone === "info") return "border-sky-300/30 bg-sky-400/10 text-sky-100";
  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
}
