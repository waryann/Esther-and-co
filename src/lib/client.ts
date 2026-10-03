"use client";

export function sessionId(): string {
  try {
    let id = localStorage.getItem("esthair_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("esthair_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function track(name: string, props?: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ name, sessionId: sessionId(), path: location.pathname, props });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* analytics ne doit jamais casser le parcours */
  }
}

export async function api<T = any>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* corps vide */
  }
  return { ok: res.ok, status: res.status, data };
}
