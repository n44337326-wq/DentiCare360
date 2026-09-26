import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, enforceRateLimit, resetRateLimits } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { sanitizeFileName, sniffMimeType } from "@/services/storage";

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit and then blocks with a retry hint", () => {
    const opts = { scope: "ai-chat", key: "user-1", limit: 3, windowMs: 60_000 };
    const t0 = 1_000_000;
    expect(checkRateLimit(opts, t0).ok).toBe(true);
    expect(checkRateLimit(opts, t0 + 1).ok).toBe(true);
    expect(checkRateLimit(opts, t0 + 2).ok).toBe(true);
    const blocked = checkRateLimit(opts, t0 + 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("resets after the window", () => {
    const opts = { scope: "s", key: "k", limit: 1, windowMs: 1000 };
    expect(checkRateLimit(opts, 0).ok).toBe(true);
    expect(checkRateLimit(opts, 500).ok).toBe(false);
    expect(checkRateLimit(opts, 1001).ok).toBe(true);
  });

  it("keeps users and scopes independent", () => {
    const a = { scope: "ai", key: "alice", limit: 1, windowMs: 60_000 };
    expect(checkRateLimit(a, 0).ok).toBe(true);
    expect(checkRateLimit(a, 1).ok).toBe(false);
    expect(checkRateLimit({ ...a, key: "bob" }, 2).ok).toBe(true);
    expect(checkRateLimit({ ...a, scope: "login" }, 3).ok).toBe(true);
  });

  it("throws a 429 RateLimitError from enforceRateLimit", () => {
    const opts = { scope: "x", key: "y", limit: 1, windowMs: 60_000 };
    enforceRateLimit(opts);
    expect(() => enforceRateLimit(opts)).toThrow(RateLimitError);
    try {
      enforceRateLimit(opts);
    } catch (e) {
      expect((e as RateLimitError).status).toBe(429);
    }
  });
});

describe("secure file handling", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  it("identifies allowed types from their magic bytes", () => {
    expect(sniffMimeType(new TextEncoder().encode("%PDF-1.7 ..."))).toBe("application/pdf");
    expect(sniffMimeType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffMimeType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    const webp = new Uint8Array(16);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(sniffMimeType(webp)).toBe("image/webp");
  });

  it("rejects executables, scripts and anything else — regardless of the file name", () => {
    expect(sniffMimeType(bytes(0x4d, 0x5a))).toBeNull(); // Windows .exe
    expect(sniffMimeType(bytes(0x7f, 0x45, 0x4c, 0x46))).toBeNull(); // ELF
    expect(sniffMimeType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffMimeType(new TextEncoder().encode("<html><body>"))).toBeNull();
    expect(sniffMimeType(new Uint8Array(0))).toBeNull();
  });

  it("strips path components and control characters from file names", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Users\\me\\report.pdf")).toBe("report.pdf");
    expect(sanitizeFileName("bad\u0000name<>.pdf")).toBe("badname.pdf");
    expect(sanitizeFileName("")).toBe("document");
    expect(sanitizeFileName("a".repeat(300)).length).toBe(120);
  });
});
