/**
 * Browser-side fetch helper. Every API route answers errors as
 * `{ error: string, code: string, details? }`; this turns them into a thrown
 * `ApiError` whose `message` is safe to show to the user.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0, "NETWORK");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      (body && typeof body.error === "string" && body.error) || "Something went wrong. Please try again.",
      res.status,
      body?.code,
      body?.details
    );
  }
  return body as T;
}

/** The message to show for any thrown value. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

/** First validation message for a field, if the server reported one. */
export function fieldError(err: unknown, field: string): string | undefined {
  return err instanceof ApiError ? err.details?.[field]?.[0] : undefined;
}
