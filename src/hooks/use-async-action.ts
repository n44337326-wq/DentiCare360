"use client";

import { useCallback, useState } from "react";
import { errorMessage } from "@/lib/api-client";

/**
 * Tracks pending / error / success for a user-triggered async action (a save,
 * a cancel, a payment…) so every button shows the same loading, error and
 * success behaviour.
 */
export function useAsyncAction<Args extends unknown[], R>(action: (...args: Args) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [error_, setRawError] = useState<unknown>(null);
  const [succeeded, setSucceeded] = useState(false);

  const run = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      setPending(true);
      setError(null);
      setRawError(null);
      setSucceeded(false);
      try {
        const result = await action(...args);
        setSucceeded(true);
        return result;
      } catch (err) {
        setError(errorMessage(err));
        setRawError(err);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setError(null);
    setRawError(null);
    setSucceeded(false);
  }, []);

  return { run, pending, error, rawError: error_, succeeded, reset };
}
