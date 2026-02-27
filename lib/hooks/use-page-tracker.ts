"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

const SESSION_KEY = "flacko_analytics_session_id";
const UTM_KEY = "flacko_analytics_utm";

type UtmData = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function getOrCreateSessionId() {
  const storage = getSessionStorage();
  if (!storage) return null;
  const existing = storage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  storage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function readUtm(): UtmData {
  const storage = getSessionStorage();
  if (!storage) return { source: null, medium: null, campaign: null };
  const raw = storage.getItem(UTM_KEY);
  if (!raw) return { source: null, medium: null, campaign: null };
  try {
    const parsed = JSON.parse(raw);
    return {
      source: typeof parsed?.source === "string" ? parsed.source : null,
      medium: typeof parsed?.medium === "string" ? parsed.medium : null,
      campaign: typeof parsed?.campaign === "string" ? parsed.campaign : null,
    };
  } catch {
    return { source: null, medium: null, campaign: null };
  }
}

function writeUtm(utm: UtmData) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.setItem(UTM_KEY, JSON.stringify(utm));
}

function extractUtm(searchParams: ReadonlyURLSearchParams) {
  const source = searchParams.get("utm_source");
  const medium = searchParams.get("utm_medium");
  const campaign = searchParams.get("utm_campaign");
  const hasAny = Boolean(source || medium || campaign);
  return { source, medium, campaign, hasAny };
}

async function postPageView(payload: {
  path: string;
  referrer: string | null;
  sessionId: string;
  utm: UtmData;
}) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: payload.path,
        referrer: payload.referrer,
        sessionId: payload.sessionId,
        utm_source: payload.utm.source,
        utm_medium: payload.utm.medium,
        utm_campaign: payload.utm.campaign,
      }),
    });
  } catch {
    // Non-blocking tracking
  }
}

async function patchDuration(payload: {
  path: string;
  sessionId: string;
  durationMs: number;
  keepalive?: boolean;
}) {
  if (payload.durationMs <= 0) return;
  try {
    await fetch("/api/analytics/track", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: payload.path,
        sessionId: payload.sessionId,
        duration_ms: Math.round(payload.durationMs),
      }),
      keepalive: payload.keepalive,
    });
  } catch {
    // Non-blocking tracking
  }
}

export function usePageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionIdRef = useRef<string | null>(null);
  const currentPathRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const sessionId = sessionIdRef.current || getOrCreateSessionId();
    if (!sessionId) return;
    sessionIdRef.current = sessionId;

    const storedUtm = readUtm();
    const incomingUtm = extractUtm(searchParams);
    const mergedUtm = incomingUtm.hasAny
      ? {
          source: incomingUtm.source || storedUtm.source,
          medium: incomingUtm.medium || storedUtm.medium,
          campaign: incomingUtm.campaign || storedUtm.campaign,
        }
      : storedUtm;

    if (incomingUtm.hasAny) {
      writeUtm(mergedUtm);
    }

    const nextPath = pathname || "/";
    const isNewPath = !currentPathRef.current || currentPathRef.current !== nextPath;

    if (isNewPath && currentPathRef.current && startTimeRef.current) {
      const durationMs = Date.now() - startTimeRef.current;
      void patchDuration({
        path: currentPathRef.current,
        sessionId,
        durationMs,
      });
    }

    if (isNewPath) {
      currentPathRef.current = nextPath;
      startTimeRef.current = Date.now();
      void postPageView({
        path: nextPath,
        referrer: document.referrer || null,
        sessionId,
        utm: mergedUtm,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleExit = () => {
      const sessionId = sessionIdRef.current || getOrCreateSessionId();
      if (!sessionId || !currentPathRef.current || !startTimeRef.current) return;
      const durationMs = Date.now() - startTimeRef.current;
      void patchDuration({
        path: currentPathRef.current,
        sessionId,
        durationMs,
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);

    return () => {
      window.removeEventListener("pagehide", handleExit);
      window.removeEventListener("beforeunload", handleExit);
    };
  }, []);
}
