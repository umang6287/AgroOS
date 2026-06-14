"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { FarmCommandCenter } from "@/components/command-center/FarmCommandCenter";
import { AgriOSMark } from "@/components/shared/AgriOSMark";
import { API_URL, apiFetchJson } from "@/lib/api";
import type { AdminUser, AuthStatus } from "@/types/auth";

type HealthState =
  | { status: "loading"; message: string }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export default function Home() {
  const [health, setHealth] = useState<HealthState>({
    status: "loading",
    message: "Checking backend health..."
  });

  useEffect(() => {
    fetch(`${API_URL}/health`)
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
  }, []);

  return <AuthGate apiBaseUrl={API_URL} healthStatus={health.status} healthMessage={health.message} />;
}

type AuthGateProps = {
  apiBaseUrl: string;
  healthStatus: HealthState["status"];
  healthMessage: string;
};

type AuthMode = "loading" | "setup" | "login" | "authenticated";

function AuthGate({ apiBaseUrl, healthStatus, healthMessage }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState("Checking Farm Admin session...");

  useEffect(() => {
    apiFetchJson<AuthStatus>(`${apiBaseUrl}/auth/status`)
      .then((status) => {
        setUser(status.user);
        setMode(status.authenticated && status.user ? "authenticated" : status.setupComplete ? "login" : "setup");
        setMessage("");
      })
      .catch((error: Error) => {
        setMode("setup");
        setMessage(error.message);
      });
  }, [apiBaseUrl]);

  if (mode === "loading") {
    return <AuthShell title="Farm Admin" subtitle={message} />;
  }

  if (mode === "setup") {
    return (
      <AuthForm
        apiBaseUrl={apiBaseUrl}
        mode="setup"
        message={message}
        onSwitchMode={(nextMode) => {
          setMessage("");
          setMode(nextMode);
        }}
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          setMode("authenticated");
        }}
      />
    );
  }

  if (mode === "login") {
    return (
      <AuthForm
        apiBaseUrl={apiBaseUrl}
        mode="login"
        message={message}
        onSwitchMode={(nextMode) => {
          setMessage("");
          setMode(nextMode);
        }}
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          setMode("authenticated");
        }}
      />
    );
  }

  if (!user) return null;

  return (
    <FarmCommandCenter
      apiBaseUrl={apiBaseUrl}
      healthStatus={healthStatus}
      healthMessage={healthMessage}
      adminUser={user}
      onAdminUserChange={setUser}
      onLogout={() => {
        setUser(null);
        setMode("login");
      }}
    />
  );
}

function AuthForm({
  apiBaseUrl,
  mode,
  message,
  onSwitchMode,
  onAuthenticated
}: {
  apiBaseUrl: string;
  mode: "setup" | "login";
  message: string;
  onSwitchMode: (mode: "setup" | "login") => void;
  onAuthenticated: (user: AdminUser) => void;
}) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [telegramAccount, setTelegramAccount] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState(message);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSetup = mode === "setup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(isSetup ? "Creating Farm Admin..." : "Signing in...");
    try {
      const endpoint = isSetup ? "/auth/setup" : "/auth/login";
      const payload = isSetup
        ? { userId, password, firstName, lastName, whatsappNumber, mobileNumber, telegramAccount, apiKey }
        : { userId, password };
      const result = await apiFetchJson<{ user: AdminUser }>(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setApiKey("");
      setPassword("");
      onAuthenticated(result.user);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Farm Admin authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={isSetup ? "Farm Admin Access" : "Farm Admin Login"}
      subtitle={status || (isSetup ? "Create the first admin or sign in if one already exists." : "Sign in to open the command center.")}
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#07131a]/80 p-1">
        <button
          type="button"
          onClick={() => onSwitchMode("login")}
          className={`rounded-md px-3 py-2 text-sm font-bold transition ${
            !isSetup ? "bg-emerald-400/18 text-emerald-50 ring-1 ring-emerald-300/25" : "text-slate-300 hover:bg-white/[0.055]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode("setup")}
          className={`rounded-md px-3 py-2 text-sm font-bold transition ${
            isSetup ? "bg-emerald-400/18 text-emerald-50 ring-1 ring-emerald-300/25" : "text-slate-300 hover:bg-white/[0.055]"
          }`}
        >
          Create admin
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-3">
        <AuthInput label="Email ID / User ID" value={userId} onChange={setUserId} required />
        <AuthInput label="Password" value={password} onChange={setPassword} type="password" required />
        {isSetup ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthInput label="First name" value={firstName} onChange={setFirstName} required />
              <AuthInput label="Last name" value={lastName} onChange={setLastName} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthInput label="WhatsApp number" value={whatsappNumber} onChange={setWhatsappNumber} />
              <AuthInput label="Mobile number" value={mobileNumber} onChange={setMobileNumber} />
            </div>
            <AuthInput label="Telegram account details" value={telegramAccount} onChange={setTelegramAccount} />
            <AuthInput label="OpenAI API key" value={apiKey} onChange={setApiKey} type="password" />
          </>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg border border-emerald-300/35 bg-emerald-400/18 px-4 py-3 text-sm font-bold text-emerald-50 transition hover:bg-emerald-400/28 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Please wait" : isSetup ? "Create Farm Admin" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#06100f] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">
        <section className="w-full rounded-lg border border-white/10 bg-[#0a1720]/90 p-5 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#06261f] ring-1 ring-emerald-300/20">
              <AgriOSMark className="h-12 w-12" title="AgriOS" />
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-black tracking-normal text-[#f6ffe3]">AgriOS</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-emerald-200">Autonomous Farm Operating System</p>
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </section>
      </div>
    </main>
  );
}

function AuthInput({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm text-slate-200">
      <span className="font-semibold">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete="off"
        className="rounded-lg border border-white/10 bg-[#07131a] px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/50"
      />
    </label>
  );
}
