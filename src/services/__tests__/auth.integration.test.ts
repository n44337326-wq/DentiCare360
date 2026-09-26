import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { startTestDatabase } from "@/test/test-db";
import { createWorld, PASSWORD, type World } from "@/test/fixtures";
import { resetRateLimits } from "@/lib/rate-limit";

/** Authentication: credential checks, registration, password handling, brute-force throttling and audit logging. */
let stop: () => Promise<void>;
let db: typeof import("@/database/client").db;
let users: typeof import("@/services/users");
let w: World;

beforeAll(async () => {
  stop = (await startTestDatabase()).stop;
  db = (await import("@/database/client")).db;
  users = await import("@/services/users");
  w = await createWorld(db);
}, 90_000);

afterAll(async () => {
  await db.$disconnect();
  await stop();
});

beforeEach(() => resetRateLimits());

describe("sign-in", () => {
  it("accepts the right password and returns the role and profile ids for the session", async () => {
    expect(await users.authenticate(w.patientA.email, PASSWORD)).toMatchObject({ id: w.patientA.userId, role: "PATIENT", patientId: w.patientA.id });
    expect(await users.authenticate(w.doctor.user.email!, PASSWORD)).toMatchObject({ role: "DOCTOR", doctorId: w.doctor.id });
    expect(await users.authenticate(w.admin.email!, PASSWORD)).toMatchObject({ role: "ADMIN" });
  });

  it("rejects a wrong password and an unknown email without saying which was wrong", async () => {
    expect(await users.authenticate(w.patientA.email, "wrong-password1")).toBeNull();
    expect(await users.authenticate("nobody@test.example", PASSWORD)).toBeNull();
  });

  it("rejects a deactivated account even with the correct password", async () => {
    await db.user.update({ where: { id: w.patientB.userId }, data: { isActive: false } });
    expect(await users.authenticate(w.patientB.email, PASSWORD)).toBeNull();
    await db.user.update({ where: { id: w.patientB.userId }, data: { isActive: true } });
    expect(await users.authenticate(w.patientB.email, PASSWORD)).not.toBeNull();
  });

  it("throttles repeated guessing against one account — even the right password is refused once locked out", async () => {
    for (let i = 0; i < 8; i++) expect(await users.authenticate(w.patientA.email, `wrong-${i}`, "10.0.0.1")).toBeNull();
    expect(await users.authenticate(w.patientA.email, PASSWORD, "10.0.0.1")).toBeNull();
    expect(await db.auditLog.count({ where: { action: "LOGIN_RATE_LIMITED" } })).toBeGreaterThan(0);
    // A different account is not affected.
    expect(await users.authenticate(w.patientB.email, PASSWORD, "10.0.0.2")).not.toBeNull();
  });

  it("records successful and failed sign-ins in the audit log", async () => {
    await users.authenticate(w.doctor.user.email!, "nope-nope1", "198.51.100.7");
    await users.authenticate(w.doctor.user.email!, PASSWORD, "198.51.100.7");
    const logs = await db.auditLog.findMany({ where: { userId: w.doctor.userId, ipAddress: "198.51.100.7" }, orderBy: { createdAt: "asc" } });
    expect(logs.map((l) => l.action)).toEqual(["LOGIN_FAILED", "LOGIN_SUCCEEDED"]);
  });
});

describe("registration and password handling", () => {
  it("creates a patient with a bcrypt-hashed password, a patient profile and an empty medical profile", async () => {
    const created = await users.registerPatient({ name: "New Person", email: "new.person@test.example", password: "Sup3rSecret" });
    const row = await db.user.findUniqueOrThrow({ where: { id: created.id }, include: { patient: { include: { medicalProfile: true } } } });

    expect(row.role).toBe("PATIENT");
    expect(row.passwordHash).not.toBe("Sup3rSecret");
    expect(row.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost 12
    expect(await bcrypt.compare("Sup3rSecret", row.passwordHash)).toBe(true);
    expect(row.patient?.medicalProfile).toBeTruthy();

    expect(await users.authenticate("new.person@test.example", "Sup3rSecret")).toMatchObject({ role: "PATIENT" });
  });

  it("refuses to register an email twice (case-insensitively handled upstream)", async () => {
    await users.registerPatient({ name: "Dup One", email: "dup@test.example", password: "Sup3rSecret" });
    await expect(users.registerPatient({ name: "Dup Two", email: "dup@test.example", password: "Sup3rSecret" })).rejects.toMatchObject({ status: 409, code: "EMAIL_TAKEN" });
  });

  it("limits sign-ups per IP", async () => {
    const results = [];
    for (let i = 0; i < 12; i++) {
      results.push(await users.registerPatient({ name: "Bulk User", email: `bulk${i}@test.example`, password: "Sup3rSecret" }, "203.0.113.200").then(() => "ok", (e) => e.status));
    }
    expect(results.slice(0, 10).every((r) => r === "ok")).toBe(true);
    expect(results.slice(10)).toEqual([429, 429]);
  });

  it("never stores plaintext passwords anywhere in the users table", async () => {
    const all = JSON.stringify(await db.user.findMany());
    expect(all).not.toContain(PASSWORD);
    expect(all).not.toContain("Sup3rSecret");
  });
});
