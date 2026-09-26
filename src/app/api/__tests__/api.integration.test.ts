import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startTestDatabase } from "@/test/test-db";
import { bookingInput, createWorld, futureDate, type World } from "@/test/fixtures";
import { resetRateLimits } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/guards";

/**
 * API-level tests: the real route handlers + real services + real database.
 * Only the session lookup is stubbed, so authentication state can be chosen per
 * request; everything else (validation, authorization, error shapes, rate
 * limits) is the production code path.
 */
const session = vi.hoisted(() => ({ current: null as null | { user: Record<string, unknown> } }));
vi.mock("@/lib/auth", () => ({
  auth: async () => session.current,
  handlers: {},
  signIn: async () => undefined,
  signOut: async () => undefined,
}));

let stop: () => Promise<void>;
let db: typeof import("@/database/client").db;
let w: World;
const routes: Record<string, Record<string, (req: Request, ctx?: unknown) => Promise<Response>>> = {};

async function load(name: string, path: string) {
  routes[name] = (await import(/* @vite-ignore */ path)) as never;
}

beforeAll(async () => {
  stop = (await startTestDatabase()).stop;
  db = (await import("@/database/client")).db;
  w = await createWorld(db);
  await load("appointments", "@/app/api/appointments/route");
  await load("appointment", "@/app/api/appointments/[id]/route");
  await load("availability", "@/app/api/availability/route");
  await load("register", "@/app/api/register/route");
  await load("aiChat", "@/app/api/ai/chat/route");
  await load("notifications", "@/app/api/notifications/route");
  await load("profile", "@/app/api/medical-profile/route");
  await load("documents", "@/app/api/documents/route");
  await load("document", "@/app/api/documents/[id]/route");
  await load("payments", "@/app/api/payments/route");
  await load("pay", "@/app/api/payments/[id]/pay/route");
  await load("schedule", "@/app/api/doctors/[id]/schedule/route");
  await load("adminDoctor", "@/app/api/admin/doctors/[id]/route");
  await load("adminServices", "@/app/api/admin/services/route");
  await load("adminService", "@/app/api/admin/services/[id]/route");
  await load("reminders", "@/app/api/admin/reminders/route");
  await load("health", "@/app/api/health/route");
}, 90_000);

afterAll(async () => {
  await db.$disconnect();
  await stop();
});

beforeEach(() => {
  resetRateLimits();
  session.current = null;
});

const asUser = (u: SessionUser | null) => {
  session.current = u ? { user: { id: u.id, role: u.role, name: u.name, email: u.email, doctorId: u.doctorId, patientId: u.patientId } } : null;
};

async function call(
  handler: (req: Request, ctx?: unknown) => Promise<Response>,
  opts: { url?: string; method?: string; body?: unknown; form?: FormData; user?: SessionUser | null; params?: Record<string, string>; headers?: Record<string, string> } = {}
) {
  asUser(opts.user ?? null);
  const init: RequestInit = { method: opts.method ?? "GET", headers: { ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}), ...opts.headers } };
  if (opts.body !== undefined) init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  if (opts.form) init.body = opts.form;
  const res = await handler(new Request(`http://localhost${opts.url ?? "/api/test"}`, init), { params: Promise.resolve(opts.params ?? {}) });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return { status: res.status, headers: res.headers, json: isJson ? await res.json() : null, res };
}

const booking = (over = {}) => ({ ...bookingInput(w, { date: futureDate(4), startTime: "09:00" }), ...over });
const pdfFile = (name = "report.pdf") => new File([new TextEncoder().encode("%PDF-1.4\nhello\n%%EOF")], name, { type: "application/pdf" });

describe("health", () => {
  it("reports database connectivity", async () => {
    const res = await call(routes.health.GET);
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ status: "ok", database: "up" });
  });
});

describe("authentication & authorization", () => {
  it("rejects unauthenticated access to protected endpoints with 401", async () => {
    expect((await call(routes.appointments.GET)).status).toBe(401);
    expect((await call(routes.appointments.POST, { method: "POST", body: booking() })).status).toBe(401);
    expect((await call(routes.notifications.GET)).status).toBe(401);
    expect((await call(routes.profile.GET)).status).toBe(401);
    expect((await call(routes.payments.GET)).status).toBe(401);
    expect((await call(routes.documents.GET)).status).toBe(401);
    expect((await call(routes.appointment.GET, { params: { id: "x" } })).status).toBe(401);
  });

  it("enforces roles on the server: patient-only, admin-only and doctor-or-admin endpoints", async () => {
    // patient-only
    expect((await call(routes.appointments.POST, { method: "POST", body: booking(), user: w.doctor.user })).status).toBe(403);
    expect((await call(routes.appointments.POST, { method: "POST", body: booking(), user: w.admin })).status).toBe(403);
    expect((await call(routes.profile.GET, { user: w.doctor.user })).status).toBe(403);
    expect((await call(routes.documents.GET, { user: w.admin })).status).toBe(403);
    // admin-only
    const svc = { name: "New Service", category: "Dental", description: "Desc here", durationMinutes: 30, startingPrice: 10, specialtySlug: "dental", suitableSpecialist: "Dentist" };
    for (const user of [w.patientA.user, w.doctor.user]) {
      expect((await call(routes.adminServices.POST, { method: "POST", body: svc, user })).status).toBe(403);
      expect((await call(routes.adminDoctor.PATCH, { method: "PATCH", body: { consultationFee: 1 }, user, params: { id: w.doctor.id } })).status).toBe(403);
      expect((await call(routes.adminService.PATCH, { method: "PATCH", body: { isActive: false }, user, params: { id: w.serviceId } })).status).toBe(403);
    }
    expect((await call(routes.adminServices.POST, { method: "POST", body: svc, user: null })).status).toBe(401);
  });

  it("treats the database as authoritative: a valid token can't outlive deactivation or claim a role the user lacks", async () => {
    // A tampered/stale token claiming ADMIN for a patient is still just a patient.
    asUser({ ...w.patientA.user, role: "ADMIN" });
    const svc = { name: "Sneaky Service", category: "Dental", description: "Desc here", durationMinutes: 30, startingPrice: 10, specialtySlug: "dental", suitableSpecialist: "Dentist" };
    const forged = await routes.adminServices.POST(new Request("http://localhost/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(svc) }));
    expect(forged.status).toBe(403);

    // A deactivated account is signed out immediately, even though its token is still valid.
    await db.user.update({ where: { id: w.patientB.userId }, data: { isActive: false } });
    expect((await call(routes.appointments.GET, { user: w.patientB.user })).status).toBe(401);
    await db.user.update({ where: { id: w.patientB.userId }, data: { isActive: true } });
    expect((await call(routes.appointments.GET, { user: w.patientB.user })).status).toBe(200);

    // A token for a user that no longer exists is rejected.
    expect((await call(routes.appointments.GET, { user: { ...w.patientB.user, id: "deleted-user-id" } })).status).toBe(401);
  });

  it("only lets doctors edit their own schedule (admins may edit any)", async () => {
    const body = { supportsOnline: true };
    expect((await call(routes.schedule.PUT, { method: "PUT", body, user: w.doctor.user, params: { id: w.doctor.id } })).status).toBe(200);
    expect((await call(routes.schedule.PUT, { method: "PUT", body, user: w.doctor.user, params: { id: w.otherDoctor.id } })).status).toBe(403);
    expect((await call(routes.schedule.PUT, { method: "PUT", body, user: w.patientA.user, params: { id: w.doctor.id } })).status).toBe(403);
    expect((await call(routes.schedule.PUT, { method: "PUT", body, user: w.admin, params: { id: w.otherDoctor.id } })).status).toBe(200);
    expect((await call(routes.schedule.GET, { user: w.patientA.user, params: { id: w.doctor.id } })).status).toBe(403);
  });

  it("protects the reminders job (admin session or bearer secret only)", async () => {
    process.env.CRON_SECRET = "s3cret-token";
    expect((await call(routes.reminders.POST, { method: "POST", user: w.patientA.user })).status).toBe(403);
    expect((await call(routes.reminders.POST, { method: "POST" })).status).toBe(403);
    expect((await call(routes.reminders.POST, { method: "POST", headers: { authorization: "Bearer wrong" } })).status).toBe(403);
    expect((await call(routes.reminders.POST, { method: "POST", headers: { authorization: "Bearer s3cret-token" } })).status).toBe(200);
    const ok = await call(routes.reminders.POST, { method: "POST", user: w.admin });
    expect(ok.status).toBe(200);
    expect(ok.json).toEqual({ sent: expect.any(Number) });
    delete process.env.CRON_SECRET;
  });
});

describe("appointment booking API", () => {
  it("books an appointment (201) and returns the appointment without internal fields", async () => {
    const res = await call(routes.appointments.POST, { method: "POST", body: booking(), user: w.patientA.user });
    expect(res.status).toBe(201);
    expect(res.json.appointment).toMatchObject({ status: "CONFIRMED", date: futureDate(4), startTime: "09:00", endTime: "09:30", doctorName: "Dr. Alpha" });
    expect(JSON.stringify(res.json)).not.toMatch(/passwordHash|storageKey|guestKeyHash/);
  });

  it("answers a double booking with 409 SLOT_UNAVAILABLE", async () => {
    const res = await call(routes.appointments.POST, { method: "POST", body: booking(), user: w.patientB.user });
    expect(res.status).toBe(409);
    expect(res.json).toMatchObject({ code: "SLOT_UNAVAILABLE", error: expect.stringMatching(/no longer available/i) });
  });

  it("validates input with 400 and field-level details", async () => {
    const res = await call(routes.appointments.POST, { method: "POST", body: booking({ date: "2026-02-30", startTime: "25:99", consultationType: "TELEPATHY" }), user: w.patientA.user });
    expect(res.status).toBe(400);
    expect(res.json.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.json.details)).toEqual(expect.arrayContaining(["date", "startTime", "consultationType"]));
  });

  it("rejects malformed and empty JSON bodies cleanly", async () => {
    expect((await call(routes.appointments.POST, { method: "POST", body: "{not json", user: w.patientA.user })).status).toBe(400);
    expect((await call(routes.appointments.POST, { method: "POST", body: {}, user: w.patientA.user })).status).toBe(400);
    expect((await call(routes.appointments.POST, { method: "POST", body: [], user: w.patientA.user })).status).toBe(400);
  });

  it("ignores attempts to set protected fields (patient, status, end time, price)", async () => {
    const res = await call(routes.appointments.POST, {
      method: "POST",
      body: { ...booking({ startTime: "10:00" }), patientId: w.patientB.id, status: "COMPLETED", endTime: "23:00", price: 0 },
      user: w.patientA.user,
    });
    expect(res.status).toBe(201);
    expect(res.json.appointment).toMatchObject({ patientId: w.patientA.id, status: "CONFIRMED", endTime: "10:30" });
  });

  it("scopes GET /api/appointments to the caller", async () => {
    const mine = await call(routes.appointments.GET, { user: w.patientA.user });
    expect(mine.json.appointments.every((a: { patientId: string }) => a.patientId === w.patientA.id)).toBe(true);
    const bobs = await call(routes.appointments.GET, { user: w.patientB.user });
    expect(bobs.json.appointments).toEqual([]);
    const all = await call(routes.appointments.GET, { user: w.admin });
    expect(all.json.appointments.length).toBeGreaterThanOrEqual(2);
  });

  it("returns an unknown appointment as 404 and someone else's as 403", async () => {
    const created = (await call(routes.appointments.GET, { user: w.patientA.user })).json.appointments[0];
    expect((await call(routes.appointment.GET, { user: w.patientA.user, params: { id: "nope" } })).status).toBe(404);
    expect((await call(routes.appointment.GET, { user: w.patientB.user, params: { id: created.id } })).status).toBe(403);
    expect((await call(routes.appointment.GET, { user: w.patientA.user, params: { id: created.id } })).status).toBe(200);
  });
});

describe("appointment cancellation & rescheduling API", () => {
  let id: string;
  beforeAll(async () => {
    asUser(w.patientB.user);
    id = (await call(routes.appointments.POST, { method: "POST", body: booking({ date: futureDate(9), startTime: "14:00" }), user: w.patientB.user })).json.appointment.id;
  });

  it("rejects unknown actions and bad payloads with 400", async () => {
    for (const body of [{ action: "delete" }, {}, { action: "reschedule", date: "bad", startTime: "10:00" }, "junk"]) {
      expect((await call(routes.appointment.PATCH, { method: "PATCH", body, user: w.patientB.user, params: { id } })).status).toBe(400);
    }
  });

  it("forbids other patients and unrelated doctors", async () => {
    expect((await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "cancel" }, user: w.patientA.user, params: { id } })).status).toBe(403);
    expect((await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "cancel" }, user: w.otherDoctor.user, params: { id } })).status).toBe(403);
  });

  it("forbids a patient from performing doctor actions on their own appointment (409, unchanged)", async () => {
    const res = await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "complete", doctorNotes: "fine" }, user: w.patientB.user, params: { id } });
    expect(res.status).toBe(409);
    expect(res.json.code).toBe("ACTION_NOT_ALLOWED");
  });

  it("reschedules (200), rejects a clash (409), then cancels (200) and frees the slot", async () => {
    const moved = await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "reschedule", date: futureDate(9), startTime: "15:00" }, user: w.patientB.user, params: { id } });
    expect(moved.status).toBe(200);
    expect(moved.json.appointment).toMatchObject({ startTime: "15:00", status: "RESCHEDULED" });

    const clash = await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "reschedule", date: futureDate(4), startTime: "09:00" }, user: w.patientB.user, params: { id } });
    expect(clash.status).toBe(409);

    const cancelled = await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "cancel" }, user: w.patientB.user, params: { id } });
    expect(cancelled.status).toBe(200);
    expect(cancelled.json.appointment.status).toBe("CANCELLED");
    expect((await call(routes.appointment.PATCH, { method: "PATCH", body: { action: "cancel" }, user: w.patientB.user, params: { id } })).status).toBe(409);
  });
});

describe("availability API (public)", () => {
  it("validates its query", async () => {
    expect((await call(routes.availability.GET, { url: "/api/availability" })).status).toBe(400);
    expect((await call(routes.availability.GET, { url: `/api/availability?doctorId=${w.doctor.id}&date=31-12-2026` })).status).toBe(400);
    expect((await call(routes.availability.GET, { url: "/api/availability?doctorId=nope" })).status).toBe(404);
  });

  it("returns a day's slots with taken slots marked, and a calendar without a date", async () => {
    const day = await call(routes.availability.GET, { url: `/api/availability?doctorId=${w.doctor.id}&date=${futureDate(4)}` });
    expect(day.status).toBe(200);
    expect(day.json.slots.find((s: { startTime: string }) => s.startTime === "09:00").isBooked).toBe(true);
    expect(day.json.unavailable).toBeUndefined();

    const cal = await call(routes.availability.GET, { url: `/api/availability?doctorId=${w.doctor.id}` });
    expect(cal.json.dates).toHaveLength(21);
    expect(cal.json.nextAvailable).toBeTruthy();
  });

  it("explains an unavailable day and offers alternatives", async () => {
    const closed = futureDate(6);
    await call(routes.schedule.PUT, { method: "PUT", body: { blockedDates: [{ date: closed, kind: "LEAVE", reason: "Conference" }] }, user: w.doctor.user, params: { id: w.doctor.id } });
    const res = await call(routes.availability.GET, { url: `/api/availability?doctorId=${w.doctor.id}&date=${closed}` });
    expect(res.json.slots).toEqual([]);
    expect(res.json.unavailable.message).toMatch(/^Dr\. Alpha is unavailable on /);
    expect(res.json.alternatives.length).toBeGreaterThan(0);
  });

  it("validates schedule updates (break outside hours → 400 with details)", async () => {
    const res = await call(routes.schedule.PUT, {
      method: "PUT",
      user: w.doctor.user,
      params: { id: w.doctor.id },
      body: { availability: [{ dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "17:00", breakStart: "07:00", breakEnd: "08:00" }] },
    });
    expect(res.status).toBe(400);
  });
});

describe("registration API", () => {
  it("creates a patient (201), never a privileged role, and refuses duplicates (409)", async () => {
    const body = { name: "API Person", email: "api.person@test.example", password: "Sup3rSecret", role: "ADMIN" };
    const res = await call(routes.register.POST, { method: "POST", body });
    expect(res.status).toBe(201);
    expect((await db.user.findUniqueOrThrow({ where: { email: "api.person@test.example" } })).role).toBe("PATIENT");
    expect((await call(routes.register.POST, { method: "POST", body })).status).toBe(409);
  });

  it("validates input (400)", async () => {
    expect((await call(routes.register.POST, { method: "POST", body: { name: "A", email: "bad", password: "x" } })).status).toBe(400);
    expect((await call(routes.register.POST, { method: "POST", body: { name: "Valid Name", email: "v@test.example", password: "allletters" } })).status).toBe(400);
  });
});

describe("AI assistant API", () => {
  it("validates messages", async () => {
    expect((await call(routes.aiChat.POST, { method: "POST", body: { message: "" } })).status).toBe(400);
    expect((await call(routes.aiChat.POST, { method: "POST", body: { message: "x".repeat(1001) } })).status).toBe(400);
    expect((await call(routes.aiChat.POST, { method: "POST", body: {} })).status).toBe(400);
  });

  it("answers a symptom with guidance, a recommendation and a guest key — no API secrets in the response", async () => {
    const res = await call(routes.aiChat.POST, { method: "POST", body: { message: "I have tooth pain for three days" }, headers: { "x-forwarded-for": "198.51.100.20" } });
    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ urgency: "LOW", conversationId: expect.any(String), guestKey: expect.any(String), summary: expect.stringMatching(/not a confirmed diagnosis/) });
    expect(JSON.stringify(res.json)).not.toMatch(/api[_-]?key|secret|sk-/i);
  });

  it("returns an emergency notice instead of a booking offer", async () => {
    const res = await call(routes.aiChat.POST, { method: "POST", body: { message: "I have severe chest pain" } });
    expect(res.json).toMatchObject({ urgency: "EMERGENCY", showBookingCTA: false });
    expect(res.json.reply).toMatch(/emergency/i);
  });

  it("rate-limits the endpoint with 429 and a Retry-After header", async () => {
    const statuses: number[] = [];
    let last!: Awaited<ReturnType<typeof call>>;
    for (let i = 0; i < 22; i++) {
      last = await call(routes.aiChat.POST, { method: "POST", body: { message: "hello there" }, headers: { "x-forwarded-for": "198.51.100.99" } });
      statuses.push(last.status);
    }
    expect(statuses.filter((s) => s === 200)).toHaveLength(20);
    expect(statuses.slice(20)).toEqual([429, 429]);
    expect(Number(last.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(last.json.code).toBe("RATE_LIMITED");
  });
});

describe("notifications, medical profile & payments API", () => {
  it("returns only the caller's notifications and unread count", async () => {
    const mine = await call(routes.notifications.GET, { user: w.patientA.user });
    expect(mine.status).toBe(200);
    expect(mine.json.notifications.length).toBeGreaterThan(0);
    expect(mine.json.unread).toBeGreaterThan(0);
    const theirId = mine.json.notifications[0].id;
    expect((await call(routes.notifications.PATCH, { method: "PATCH", body: { id: theirId }, user: w.patientB.user })).status).toBe(403);
    expect((await call(routes.notifications.PATCH, { method: "PATCH", body: { all: true }, user: w.patientA.user })).status).toBe(200);
    expect((await call(routes.notifications.GET, { user: w.patientA.user })).json.unread).toBe(0);
  });

  it("validates and saves the medical profile", async () => {
    const bad = await call(routes.profile.PUT, { method: "PUT", user: w.patientA.user, body: { allergies: [""], currentMedications: [], medicalHistory: "", emergencyContactName: "", emergencyContactPhone: "abc" } });
    expect(bad.status).toBe(400);
    const good = { allergies: ["Latex"], currentMedications: ["Vitamin D"], medicalHistory: "Asthma", emergencyContactName: "Sam", emergencyContactPhone: "555-0100" };
    expect((await call(routes.profile.PUT, { method: "PUT", user: w.patientA.user, body: good })).status).toBe(200);
    expect((await call(routes.profile.GET, { user: w.patientA.user })).json.profile).toMatchObject(good);
    expect((await call(routes.profile.GET, { user: w.patientB.user })).json.profile.allergies).toEqual([]);
  });

  it("lists own payments and settles one without any card data in the request", async () => {
    const list = await call(routes.payments.GET, { user: w.patientA.user });
    expect(list.json.payments.every((p: { patientId: string }) => p.patientId === w.patientA.id)).toBe(true);
    const due = list.json.payments.find((p: { status: string }) => p.status === "PENDING");

    expect((await call(routes.pay.POST, { method: "POST", user: w.patientB.user, params: { id: due.id } })).status).toBe(404);
    expect((await call(routes.pay.POST, { method: "POST", user: w.doctor.user, params: { id: due.id } })).status).toBe(403);
    const paid = await call(routes.pay.POST, { method: "POST", user: w.patientA.user, params: { id: due.id } });
    expect(paid.status).toBe(200);
    expect(paid.json.payment).toMatchObject({ status: "PAID", invoiceNumber: expect.stringMatching(/^INV-/) });
    expect((await call(routes.pay.POST, { method: "POST", user: w.patientA.user, params: { id: due.id } })).status).toBe(409);
  });
});

describe("documents API", () => {
  let docId: string;

  it("uploads a PDF (201), rejects disguised executables, missing files and bad categories (400)", async () => {
    const ok = new FormData();
    ok.append("file", pdfFile());
    ok.append("category", "report");
    const res = await call(routes.documents.POST, { method: "POST", form: ok, user: w.patientA.user });
    expect(res.status).toBe(201);
    docId = res.json.document.id;

    const exe = new FormData();
    exe.append("file", new File([new Uint8Array([0x4d, 0x5a, 0, 0])], "totally-a-report.pdf", { type: "application/pdf" }));
    exe.append("category", "report");
    expect((await call(routes.documents.POST, { method: "POST", form: exe, user: w.patientA.user })).status).toBe(400);

    const none = new FormData();
    none.append("category", "report");
    expect((await call(routes.documents.POST, { method: "POST", form: none, user: w.patientA.user })).status).toBe(400);

    const badCat = new FormData();
    badCat.append("file", pdfFile());
    badCat.append("category", "secrets");
    expect((await call(routes.documents.POST, { method: "POST", form: badCat, user: w.patientA.user })).status).toBe(400);

    const asDoctor = new FormData();
    asDoctor.append("file", pdfFile());
    asDoctor.append("category", "report");
    expect((await call(routes.documents.POST, { method: "POST", form: asDoctor, user: w.doctor.user })).status).toBe(403);
  });

  it("serves the file only to authorised viewers, with hardened headers", async () => {
    const ok = await call(routes.document.GET, { user: w.patientA.user, params: { id: docId } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("application/pdf");
    expect(ok.headers.get("x-content-type-options")).toBe("nosniff");
    expect(ok.headers.get("content-security-policy")).toContain("sandbox");
    expect(ok.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await ok.res.arrayBuffer()).toString()).toContain("%PDF-1.4");

    expect((await call(routes.document.GET, { params: { id: docId } })).status).toBe(401);
    expect((await call(routes.document.GET, { user: w.patientB.user, params: { id: docId } })).status).toBe(404);
    expect((await call(routes.document.GET, { user: w.doctor.user, params: { id: docId } })).status).toBe(200); // treating doctor
    expect((await call(routes.document.DELETE, { method: "DELETE", user: w.patientB.user, params: { id: docId } })).status).toBe(404);
    expect((await call(routes.document.DELETE, { method: "DELETE", user: w.patientA.user, params: { id: docId } })).status).toBe(200);
  });
});

describe("admin management API", () => {
  it("lets an admin create, update and deactivate services, with validation", async () => {
    const svc = { name: "Night Guard Fitting", category: "Dental", description: "Custom night guard", durationMinutes: 45, startingPrice: 120, specialtySlug: "dental", suitableSpecialist: "Dentist" };
    expect((await call(routes.adminServices.POST, { method: "POST", user: w.admin, body: { ...svc, startingPrice: -5 } })).status).toBe(400);
    expect((await call(routes.adminServices.POST, { method: "POST", user: w.admin, body: { ...svc, specialtySlug: "nonexistent" } })).status).toBe(404);

    const created = await call(routes.adminServices.POST, { method: "POST", user: w.admin, body: svc });
    expect(created.status).toBe(201);
    expect(created.json.service).toMatchObject({ slug: "night-guard-fitting", isActive: true, startingPrice: 120 });

    const updated = await call(routes.adminService.PATCH, { method: "PATCH", user: w.admin, params: { id: created.json.service.id }, body: { startingPrice: 99, isActive: false } });
    expect(updated.json.service).toMatchObject({ startingPrice: 99, isActive: false });
    expect(await db.auditLog.count({ where: { action: "SERVICE_UPDATED", userId: w.admin.id } })).toBe(1);
  });

  it("lets an admin update a doctor's fee and status, and keeps deactivated doctors unbookable", async () => {
    const res = await call(routes.adminDoctor.PATCH, { method: "PATCH", user: w.admin, params: { id: w.otherDoctor.id }, body: { consultationFee: 85, isActive: false } });
    expect(res.status).toBe(200);
    expect(res.json.doctor).toMatchObject({ consultationFee: 85, isActive: false });
    expect((await call(routes.adminDoctor.PATCH, { method: "PATCH", user: w.admin, params: { id: w.otherDoctor.id }, body: { consultationFee: -1 } })).status).toBe(400);
    expect((await call(routes.adminDoctor.PATCH, { method: "PATCH", user: w.admin, params: { id: "nope" }, body: { consultationFee: 10 } })).status).toBe(404);

    const attempt = await call(routes.appointments.POST, { method: "POST", user: w.patientA.user, body: booking({ doctorId: w.otherDoctor.id, date: futureDate(12), startTime: "09:00" }) });
    expect(attempt.status).toBe(404);
    expect((await call(routes.availability.GET, { url: `/api/availability?doctorId=${w.otherDoctor.id}` })).status).toBe(404);
  });
});
