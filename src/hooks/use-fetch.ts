"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api-client";

interface Settled<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * GET a JSON endpoint and track loading / error / data. Loading is DERIVED from
 * "the latest settled result belongs to a different request key", so the
 * effect never calls setState synchronously and stale responses from a
 * previous URL are ignored.
 */
export function useFetch<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = url ? `${url}#${attempt}` : "";

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    apiFetch<T>(url)
      .then((data) => !cancelled && setSettled({ key, data }))
      .catch((err) => !cancelled && setSettled({ key, error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const current = settled?.key === key ? settled : null;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data: current?.data,
    error: current?.error ?? null,
    loading: !!url && !current,
    retry,
    /** Overwrite the cached data (e.g. after an optimistic update). */
    mutate: (next: T) => setSettled({ key, data: next }),
  };
}
