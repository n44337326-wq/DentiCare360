# DentiCare360

An all-in-one clinic platform: dental, dermatology, skin & face, and general healthcare from one
site — doctor discovery, real-time availability, multi-step booking, patient / doctor / admin
portals, secure documents, payments, notifications, and a safety-first AI Health Assistant.

> **All people, doctors, appointments, payments and documents in this repo are fictional demo data.**

## Quick start

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000
```

`npm run dev` does everything on a fresh clone: it starts an **embedded PostgreSQL-compatible
database** (PGlite over the Postgres wire protocol — nothing to install), applies the Prisma
migrations, loads the demo data on first run, then starts Next.js. Data persists in `.data/`.

### Demo accounts (password `password123`)

| Role    | Email                        | Notes                                           |
| ------- | ---------------------------- | ----------------------------------------------- |
| Patient | `patient@denticare360.com`   | Jordan Lee — appointments, documents, payments  |
| Doctor  | `doctor@denticare360.com`    | Dr. Amara Chen (dentist)                        |
| Admin   | `admin@denticare360.com`     |                                                 |

Other doctors: `priya.nair@`, `marcus.webb@`, `julian.ferreira@`, `sarah.kim@`, `michael.otieno@`,
`elena.rossi@`, `grace.thompson@denticare360.com`. New patients can register at `/register`.
Demo scenarios are seeded on purpose: Dr. Kim is on leave in a few days, Dr. Ferreira is temporarily
unavailable, Dr. Nair reviews new bookings before confirming, and one AI chat is an emergency flag.

## Scripts

| Command                | What it does                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`          | Embedded DB + first-run migrate/seed + `next dev`                            |
| `npm run dev:next`     | Plain `next dev` (use with your own `DATABASE_URL`)                          |
| `npm run build` / `start` | Production build / server                                                 |
| `npm test`             | 200+ unit, integration and API tests (see below)                             |
| `npm run typecheck`    | `next typegen` + `tsc --noEmit`                                              |
| `npm run lint`         | ESLint                                                                       |
| `npm run db:setup`     | `prisma migrate deploy` + seed (for an external Postgres)                    |
| `npm run db:seed`      | Wipe and re-create the demo dataset (refuses to run in production)           |

## Using a real PostgreSQL

Set `DATABASE_URL` in `.env.local` (see `.env.example`) to any Postgres 14+ (Neon, Supabase, RDS,
Docker …), then `npm run db:setup` and `npm run build && npm start`. The embedded database is only
used when `DATABASE_URL` points at `127.0.0.1:5433`.

## Architecture

```
src/
  app/            Next.js App Router: pages (public, patient, doctor, admin) and REST API routes
    api/          Thin route handlers: validate → authorise → call a service → uniform errors
  components/     ui/ (shadcn-style primitives), shared/ (states, slot picker, badges …),
                  and feature folders: home, doctors, booking, ai, patient, doctor, admin, layout
  services/       Server-side domain logic + all database access (Prisma)
  lib/            Pure, isomorphic logic: availability engine, appointment rules, AI engine,
                  time helpers, validation schemas, guards, rate limiter, HTTP helpers
  database/       Prisma client (pg driver adapter)
  hooks/          Client hooks (useFetch, useAsyncAction)
  types/          Shared DTO types
  proxy.ts        Route protection for /patient, /doctor, /admin
prisma/           schema.prisma, migrations, seed + fictional seed data
scripts/          dev.mjs (one-command dev), dev-db.mjs (standalone embedded DB)
```

**Data model** (PostgreSQL, 17 tables with relations and indexes): `User`, `Patient`, `Doctor`,
`Specialty`, `Service`, `DoctorAvailability`, `DoctorBlockedDate`, `AppointmentSlot`, `Appointment`,
`MedicalProfile`, `MedicalDocument`, `AiConversation`, `AiMessage`, `Notification`, `Payment`,
`Invoice`, `AuditLog`.

### Booking & availability

- One pure engine (`lib/availability.ts`) generates 30-minute slots from working days/hours,
  breaks, holidays/leave/blocked dates, temporary unavailability and already-claimed slots. The
  booking UI, doctor cards, AI assistant and the booking service all use it, so an unavailable slot
  is never offered.
- **Double booking is prevented by the database**, not just application code: booking claims a row in
  `AppointmentSlot`, which has a unique constraint on `(doctorId, date, startTime)`. A concurrent
  race test (6 patients, one slot) proves exactly one wins.
- If a doctor is unavailable on the chosen date the UI shows *"Dr. X is unavailable on <date>"* plus
  the next available appointments, and picking one selects date and time at once.
- Doctors can set working days/hours, breaks, holidays/leave/blocked dates, online/in-person support,
  temporary unavailability, and whether new bookings need their acceptance. Existing appointments are
  never silently cancelled — affected patients are notified.
- Appointment lifecycle (`lib/appointment-rules.ts`) is a single state machine used by both the API
  (to enforce) and the UI (to decide which buttons to show).

### AI Health Assistant — safety design

The assistant is **not an autonomous doctor**. It is a deterministic rule engine (`lib/ai-assistant.ts`)
whose every reply comes from fixed templates, so it cannot drift into diagnosing or prescribing.

- Detects red-flag/emergency language and immediately advises urgent in-person care (no booking offer,
  prominent emergency notice, audit-logged). Serious-but-not-emergency dental presentations get a
  "be seen today" path with escalation advice.
- Redirects any medication question to a pharmacist/clinician; never names drugs or doses and never
  advises changing prescribed medication.
- Asks clarifying questions, gives general educational guidance, recommends a specialty, shows real
  doctors and their next available slot, and can carry a **patient-reported** summary (labelled
  "not a confirmed diagnosis") to the doctor when the patient books.
- **LLM integration point**: `lib/assistant-provider.ts` defines `AssistantProvider`. Any provider
  goes through `respondSafely`: emergencies never reach the model, and any reply that fails the output
  guard (diagnosis phrasing, drug names, doses, medication changes) is replaced by the safe rule-based
  reply. Provider keys would live in server environment variables only. *No live LLM adapter is
  shipped; the default provider is the rule engine.*
- The required disclaimer is always visible in the chat UI. Guest chats are only resumable with a
  secret key (stored hashed); signed-in chats are private to the patient. Endpoint is rate-limited.

### Security

- Auth.js credentials + bcrypt (cost 12), timing-safe login, per-account and per-IP throttling,
  audit log of sign-ins. Sessions are JWTs but **the database is authoritative**: a deactivated or
  deleted user is signed out immediately and role/profile ids always come from the database.
- Server-side authorization on every API route and page (the proxy is only a convenience redirect).
  Patients see only their own records; doctors only patients they treat; every access to protected
  records (patient record, documents, AI transcripts) is audit-logged.
- Zod validation on every API input (shared with the forms); protected fields (patient, status, end
  time, price, role) cannot be set by clients.
- Uploads: 5 MB limit, file type verified from the file's bytes (not the client's claim), stored
  outside `public/` under random keys, served only through an authorised route with `nosniff` and a
  sandboxing CSP.
- Rate limits on sign-in, registration, booking, payments, uploads and the AI endpoint (in-memory —
  back it with Redis if you run more than one instance). Baseline security headers in `next.config.ts`.
- No secrets in client code; configuration via environment variables (`.env.example`).

### Payments

Booking creates a pending consultation-fee payment. `services/payments.ts` defines a `PaymentProvider`
interface; the bundled **demo provider moves no money** and the app never receives, transmits or stores
card details — a real provider (Stripe etc.) plugs in server-side with its secret key from the
environment. Paying issues an invoice (printable page); cancelling refunds or voids the payment.

## Testing

`npm test` runs 200+ tests in ~20 s. Integration tests run the real services and real route handlers
against a **real PostgreSQL-protocol database with the project's actual migrations** (only the session
lookup is stubbed), so unique constraints and transactions are genuinely exercised.

Coverage: authentication & throttling, appointment booking, **double-booking prevention (incl. a
concurrent race)**, doctor availability (hours, breaks, leave, unavailability), cancellation,
rescheduling, role permissions and record access, document security, payments, **AI safety behaviour**
(emergencies, medication, no-diagnosis corpus, provider safety envelope), and API validation.

## Known limitations

- **Video consultations**: the lobby, join window and device checks are built, but the video transport
  is a documented integration point (WebRTC/telehealth provider) and is not connected.
- **Notifications are in-app only** (no email/SMS). Reminders are sent by `POST /api/admin/reminders`
  (admin button, or a scheduler with `CRON_SECRET`).
- **Slots are 30 minutes.** Longer treatments are booked as a consultation slot.
- **Doctor photos**: none are bundled; monogram avatars are used.
- The embedded dev database (PGlite) is for local development only; use managed Postgres in production.
- No strict script CSP (needs per-request nonces); email verification and MFA are not implemented.
