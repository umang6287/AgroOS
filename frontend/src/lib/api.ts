export const DEFAULT_API_URL = "http://localhost:8000";

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
const SESSION_TOKEN_KEY = "agrios_session_token";

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (token) {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    return;
  }
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function authHeaders(headers?: HeadersInit): HeadersInit {
  const nextHeaders = new Headers(headers);
  const token = getSessionToken();
  if (token) nextHeaders.set("Authorization", `Bearer ${token}`);
  return nextHeaders;
}

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: authHeaders(init?.headers)
  });

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
