export const DEFAULT_API_URL = "http://localhost:8000";

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init
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
