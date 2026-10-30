"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveSnapshot, ServiceRequest, StorageMode, StoredOrder } from "@/lib/types";

const FULL_REFRESH_MS = 120_000;

/**
 * Polls /api/live for the kitchen and admin screens.
 * Sends the last version so unchanged polls stay tiny, and pauses while the screen is hidden.
 */
export function useLiveData(intervalMs: number) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [storage, setStorage] = useState<StorageMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const version = useRef<number | null>(null);
  const lastFull = useRef(0);

  const load = useCallback(async (force = false) => {
    try {
      const useSince = !force && version.current !== null && Date.now() - lastFull.current < FULL_REFRESH_MS;
      const response = await fetch(useSince ? `/api/live?since=${version.current}` : "/api/live", { cache: "no-store" });
      if (!response.ok) throw new Error("Server not reachable");
      const data = (await response.json()) as Partial<LiveSnapshot> & { unchanged?: boolean };
      if (data.storage) setStorage(data.storage);
      if (!data.unchanged) {
        setOrders(data.orders ?? []);
        setRequests(data.requests ?? []);
        version.current = data.version ?? null;
        lastFull.current = Date.now();
      }
      setError("");
    } catch {
      setError("Orders load नहीं हुए। Internet / server check करें।");
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) void load();
    };
    const onVisible = () => {
      if (!document.hidden) void load(true);
    };
    const initial = window.setTimeout(() => void load(true), 0);
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, intervalMs]);

  const reload = useCallback(() => load(true), [load]);

  return { orders, requests, storage, loading, error, now, reload, setOrders, setRequests };
}

export function StorageNotice({ storage }: { storage: StorageMode | null }) {
  if (storage !== "runtime-cache" && storage !== "memory") return null;
  return (
    <p className="dash-notice" role="note">
      <b>Temporary mode:</b> orders अभी Vercel cache में रखे जा रहे हैं, जो कभी भी मिट सकते हैं।
      {storage === "memory" ? " (Shared cache नहीं मिला, अलग-अलग screens पर orders अलग दिख सकते हैं।)" : ""} Permanent के लिए Vercel → Storage → Neon
      database जोड़ें।
    </p>
  );
}
