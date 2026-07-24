# NCRH Backend — Handover & Deployment Readiness

**Repo:** NCRH Hospital CMS backend (Express + Sequelize)
**As of:** 2026-07-22
**Status:** Schema migration complete (Mongoose → MySQL). Application cutover, cPanel deployment, and frontend wiring have **not** been performed yet — see §6-9 below.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [What's in the repo now](#2-whats-in-the-repo-now)
3. [The Mongo → MySQL migration — what was done](#3-the-mongo--mysql-migration--what-was-done)
4. [Cleanup performed this session](#4-cleanup-performed-this-session)
5. [Environment configuration](#5-environment-configuration)
6. [Next step: application cutover to Sequelize](#6-next-step-application-cutover-to-sequelize)
7. [Next step: preparing for cPanel deployment](#7-next-step-preparing-for-cpanel-deployment)
8. [Next step: connecting the frontend (client)](#8-next-step-connecting-the-frontend-client)
9. [Next step: data migration from local MongoDB](#9-next-step-data-migration-from-local-mongodb)
10. [Verification checklist](#10-verification-checklist)
11. [Rollback plan](#11-rollback-plan)
12. [Open questions and follow-ups](#12-open-questions-and-follow-ups)

---

## 1. Executive summary

Two months of work condensed:

- **Every Mongoose model has been mapped to a Sequelize model** (28 models across auth, medical, content, operations, procurement, and research domains) and to a matching SQL migration file. Each design decision — DECIMAL for money, JSON for embedded arrays, FK cascade choices, atomic ID generation via a `Counter` table, the partial-unique-index workaround for committee votes, etc. — is documented in `sequelize/MIGRATION_PLAN.md`.
- **The app now boots against MySQL.** `server.js` authenticates the Sequelize connection at startup (hard-fail on error), then optionally connects to MongoDB if `MONGO_URI` is set (non-fatal). See §6.2. Every controller still uses Mongoose models under the hood, so requests that hit un-cutover endpoints will 500 at request time — the failure is contained per-endpoint rather than taking the whole service down.
- **Africa's Talking, MediHire, and the internal careers backend have been removed.** The careers page is served by the county website; the API no longer exposes `/api/applications` or `/api/jobs`. SMS notifications via Africa's Talking are gone; the appointment controller has a `smsServices = null` shim so a future SMS provider plugs in without hunting through controllers.
- **The server is not yet cPanel-ready.** Local XAMPP MySQL works with the config already in place; production cPanel needs SSL enforcement on the DB connection, a passenger/PM2 entrypoint, and a documented deploy sequence (§7).
- **The frontend integration has not been done.** CORS is configured but there are no confirmed origin values; auth, session cookies, and file-upload endpoints need a per-environment contract (§8).

## 2. What's in the repo now

Top-level layout, in order of "what to read first":

```
server/
├── app.js                    # Express app: middleware, routes, error handlers
├── server.js                 # HTTP bootstrap + DB connect + graceful shutdown
├── config/
│   └── db.js                 # Mongoose connection (current DB — still active)
├── controllers/              # ~30 controllers, one per resource
├── models/                   # Mongoose models — still the models the app uses
├── routes/                   # Express routers, mounted from app.js
├── middleware/               # auth, error, rate-limit, upload
├── utils/                    # mailer, jwt helpers, file cleanup
├── constants/                # shared enum values (roles, statuses, fees)
│
├── sequelize/                # ⬅ MySQL migration work lives here
│   ├── config/               # env-driven Sequelize config + loader
│   ├── models/               # 28 Sequelize models (not yet wired into app)
│   ├── migrations/           # 20 migration files, in dependency order
│   ├── seeders/              # empty
│   └── MIGRATION_PLAN.md     # design decisions + per-cluster notes
│
├── .env                      # local secrets (git-ignored)
├── .env.example              # every var documented, placeholders only
├── .sequelizerc              # points sequelize-cli at sequelize/
└── package.json              # sequelize-cli scripts already wired
```

### What each domain covers, briefly

| Domain | Models |
|---|---|
| Auth & identity | `User`, `Profile`, `TokenBlacklist`, `Researcher`, `Counter` |
| Medical services | `Appointment`, `AnonymousAppointment`, `AmbulanceBooking`, `Doctor`, `Service`, `BloodDonor`, `UrgentBloodRequest` |
| Content | `News`, `Notice`, `Gallery`, `GalleryCategory`, `Event`, `Feedback`, `Report` |
| Operations | `Vehicle`, `Inventory`, `FraudReport` |
| Procurement | `Tender`, `Bid` |
| Research | `Research`, `Review`, `Payment`, `Certificate` |

Careers/job listings are now the county website's responsibility and are not represented in this backend.

## 3. The Mongo → MySQL migration — what was done

### Approach

Each Mongoose model was ported in five clusters, each shipped as its own delta zip. For every model we produced:

1. A **Sequelize model** in `sequelize/models/`, matching field names and public methods so controllers don't need to change on cutover.
2. A **migration file** in `sequelize/migrations/`, with a matching `down()` for rollback and every non-trivial table wrapped in a transaction.
3. **Behavioural smoke tests** (82 in total across all clusters) exercised in the sandbox to verify hooks, validators, virtuals, setters, ID generators, cross-model side effects, and every branch of every enum-driven decision.

### Design decisions worth carrying into cutover

The full list is in `sequelize/MIGRATION_PLAN.md`. The three most important:

- **Money is DECIMAL, never FLOAT/DOUBLE.** `bids.bid_amount` DECIMAL(16,2), `tenders.budget_min/max` DECIMAL(14,2), `inventories.price` DECIMAL(12,2), `payments.amount` DECIMAL(12,2), `bids.tax_rate` DECIMAL(5,2). The Mongoose schemas used JS `Number` (IEEE-754), which silently drifts on `amount * quantity + tax` arithmetic. Every downstream reader gets exact cents for free after cutover.
- **Atomic ID generation via a `Counter` table.** Research IDs, Certificate numbers, and Tender numbers all used `countDocuments()`-then-inc in Mongoose, which is a TOCTOU race under concurrency. All three now go through `Counter.incrementAndGet(key)` — a single atomic `INSERT ... ON DUPLICATE KEY UPDATE` — so concurrent creates never hand out duplicate identifiers.
- **JSON columns for embedded arrays; separate tables only when the domain queries into sub-documents.** Bid comments/activityLog/documents, Research review snapshots, Notice attachments, Doctor availability, etc. all live as JSON. On inspection, controllers only ever push-and-save the whole parent row — no cross-row aggregate queries. JSON matches that access pattern without a join-table split that would gain nothing at query time.

Circular foreign keys (Tender↔Bid, Research↔Payment, Research↔Certificate) are handled by splitting the constraint creation into follow-up migrations so `CREATE TABLE` never deadlocks on itself.

The **Review model's partial unique index** (Mongo: "one committee vote per member per round of a stage") is emulated with a `STORED GENERATED` column that concatenates the four key fields only for committee-role rows and stays `NULL` for reviewer-role rows; a plain `UNIQUE` index over that column enforces committee-vote uniqueness while letting reviewer-role rows repeat freely. **Requires MySQL 5.7.6+ or MariaDB 10.2+.** XAMPP satisfies this; the migration will error out if you're on an older MySQL, which is exactly what you want.

## 4. Cleanup performed this session

**Removed integrations:**

- **Africa's Talking (SMS).** Deleted `utils/africastalking.js`, `utils/smsServices.js`, and uninstalled the `africastalking` npm package. The appointment controller now has `const smsServices = null;` at the top, with SMS callsites kept commented out — so a future SMS provider can be plugged in without hunting through the code. All `AT_*` env vars removed from `.env.example`.
- **MediHire (job aggregation).** Deleted `routes/jobRoutes.js`. The route was imported in `app.js` but was never mounted with `app.use()`, so functionally it was already dead code. All `MEDIHIRE_*` env vars removed from `.env.example`.
- **Careers backend.** Removed the entire careers stack now that job listings and applications move to the county website:
  - Mongoose: `models/careersModel.js`, `models/careersApplicationModel.js`
  - Controllers: `controllers/careersController.js`, `controllers/careerApplicationController.js`
  - Routes: `routes/careerRoutes.js`, `routes/careerApplicationRoutes.js`
  - Sequelize: `sequelize/models/career.js`, `sequelize/models/careerApplication.js`
  - Migrations: `20260722130700-create-careers.js`, `20260722140800-create-career-applications.js`
  - `app.js`: dropped `/api/applications` mount and the `careerApplicationRoutes`/`jobRoutes` imports.

The Sequelize model registry after cleanup loads 28 models cleanly; `app.js` parses and boots without errors.

**Not removed** — flagged for follow-up in §12:

- The county-website careers URL is not yet configured anywhere. Wherever the frontend links out to it, that URL needs to come from an env var or config so staging/production can differ.

## 5. Environment configuration

`.env.example` is the source of truth for every variable this backend consumes. The current groups:

| Group | Vars |
|---|---|
| Environment | `NODE_ENV`, `PORT` |
| MySQL (Sequelize) | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_POOL_MAX/MIN/ACQUIRE_MS/IDLE_MS`, `DB_TIMEZONE`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `DB_LOGGING` |
| Auth / JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CERTIFICATE_SIGNING_SECRET`, `BCRYPT_SALT_ROUNDS` |
| Email | `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `FRONTEND_URL` |
| M-Pesa | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV`, `MPESA_API_URL`, `MPESA_CALLBACK_URL` |
| Amounts toggle | `USE_PRODUCTION_AMOUNTS` |

Fail-fast rules already enforced in `sequelize/config/config.js`:

- Every `DB_*` variable must be defined at startup; missing = the app refuses to boot.
- `DB_PASSWORD=""` (empty) is only accepted when `NODE_ENV=development` or `test` — matches XAMPP's default root-with-no-password, but hard-fails outside dev/test.
- `DB_SSL=true` is **required** when `NODE_ENV=production`. Refusing plaintext connections to production MySQL is a deliberate policy, not a configuration accident.

There is still a legacy `MONGO_URI` on the current app because Mongoose is still in charge — see §6.

## 6. Next step: application cutover to Sequelize

This is the big one. The app currently boots against MongoDB. The Sequelize models are there but no controller uses them yet. Recommended sequence:

### 6.1 Preparation

1. Stand up a MySQL database matching the `.env` config. Local: XAMPP. Staging/production: cPanel MySQL (§7).
2. Run migrations end-to-end and confirm the schema comes up clean:
   ```
   npm run db:migrate:status   # nothing applied yet
   npm run db:migrate          # apply all
   npm run db:migrate:status   # everything green
   npm run db:migrate:undo:all # confirm rollback works
   npm run db:migrate          # re-apply
   ```
   The Review migration is the most likely to surface environment issues because it uses a stored generated column; if it errors, MySQL is < 5.7.6 or MariaDB < 10.2 and needs an upgrade.
3. Add a `sequelize/index.js` bootstrap that the app can `require()` — see the existing `sequelize/models/index.js` (already there).

### 6.2 Wire Sequelize into the app  ✅ done

Landed. Summary of what's in the current tree:

- **`server.js`** now owns the DB lifecycle. Boot sequence: (1) load all Sequelize models via `require('./sequelize/models')` — surfaces any model-definition errors at boot rather than first request; (2) `sequelize.authenticate()` — hard-fail on error; (3) `require('./config/db')()` — attempts Mongo, non-fatal; (4) `app.listen()`. Graceful shutdown closes both connections.
- **`config/db.js`** — Mongo connect is now conditional. Skips if `MONGO_URI` is unset; logs & returns null on error rather than exiting. Delete this file once every controller is on Sequelize.
- **`app.js`** — the old `connectDB()` call at module load has been removed. `app.js` no longer touches DB connections, so it can be `require`d from tests without side effects.

To verify locally:

```bash
NODE_ENV=development node server.js
# Expected: "MySQL (Sequelize) connected", "MONGO_URI is not set — skipping",
# then "Server is running on port ..."
```

### 6.3 Cut over domain-by-domain

Ordered by risk / dependency depth. Do NOT interleave.

| Order | Domain | Reason |
|---|---|---|
| 1 | **Auth (`User`, `Profile`, `TokenBlacklist`)** | Every other flow depends on it. If auth breaks, nothing works. Cut it first so problems surface immediately. |
| 2 | **Content (`News`, `Notice`, `Event`, `Gallery`, `Feedback`, `Report`)** | Low-risk, mostly CRUD, largely stateless. Good confidence-builder. |
| 3 | **Operations (`Vehicle`, `Inventory`, `FraudReport`)** | Also low-risk CRUD. |
| 4 | **Medical services (`Appointment`, `AnonymousAppointment`, `AmbulanceBooking`, `Doctor`, `Service`, `BloodDonor`, `UrgentBloodRequest`)** | Higher volume, patient-facing. Test carefully — especially anonymous appointments which use snake_case field names by API contract. |
| 5 | **Procurement (`Tender`, `Bid`)** | Complex embedded JSON writes, atomic tender-number generation. The scoring/ranking helpers are ported but need integration testing. |
| 6 | **Research (`Research`, `Review`, `Payment`, `Certificate`)** | The largest surface, plus M-Pesa callback handling — do this last, when everything else is stable. |

For each domain:

1. Rewrite the controller's Mongoose queries as Sequelize queries. Common translations:
   - `find({ ... }).populate('foo')` → `findAll({ where: { ... }, include: [{ association: 'foo' }] })`
   - `findOne({ ... }).select('+secret')` → `.scope('withSecrets').findOne({ where: { ... } })`
   - `$or` / `$in` / `$gt` → `Op.or` / `Op.in` / `Op.gt`
   - `Model.aggregate([...])` → `Model.findAll({ attributes: [[fn(...), 'alias']], group: [...], raw: true })`
   - `pre-save` middleware → already ported into Sequelize `hooks: { beforeSave }` on each model
   - Mongoose `_id` in URLs → the Sequelize numeric `id`. Consider adding a compatibility shim if any external system knows the old ObjectIds.
2. Wire the routes through the new controller. Keep the route paths unchanged so the frontend doesn't need to change during cutover.
3. Data-migrate the domain (see §9). This is the destructive step — do it deliberately, with backups and confirmation.
4. **Regression test the endpoints against the Postman collection** before touching the next domain. Sign-off per-domain before moving on.
5. Once verified, delete the corresponding Mongoose model, its controller (or the parts you rewrote), and any dead middleware.

When every domain is over:

- Delete `config/db.js` and the `mongoose.connect` in `server.js` / `app.js`.
- Remove `mongoose`, `mongo-sanitize`, and any Mongo-specific middleware from `package.json`.
- Delete the `models/` directory.
- Set `SESSION_STORE` (if using express-session) to a MySQL-backed store; the current Mongo store won't survive the Mongo removal.

### 6.4 Data-migration script per domain

A one-off Node script that reads from Mongo and writes to MySQL. Must be:

- **Idempotent** — safe to re-run without duplicating rows (use `findOrCreate` or a natural unique key per model).
- **Transactional per row** — a failing row shouldn't leave partial writes.
- **Validation-first** — emit a report of unmigratable rows before touching MySQL, and refuse to write when the failure rate exceeds a threshold.
- **Not destructive** — the Mongo DB stays intact until the domain is signed off in production.

Skeleton lives at `sequelize/scripts/data-migrate.md` (to be created — flagged in §12).

## 7. Next step: preparing for cPanel deployment

cPanel is a shared-hosting environment; Node apps run under Phusion Passenger (usually) or as a "Node.js selector" application. The relevant differences from a plain VPS:

### 7.1 Entry point

- cPanel expects a specific `app.js` (or configured entry file) that exports `module.exports = app;` rather than calling `app.listen()`. The current `server.js` calls `.listen()`. Either:
  - Add a small `passenger-entry.js` that does `require('./app'); if (require.main === module) require('./server');`, OR
  - Refactor so `app.js` only exports the Express app, and `server.js` is only invoked in non-Passenger environments.
- Point cPanel's "Application startup file" at whichever entry ends up as the Passenger hook.

### 7.2 Node version pinning

- cPanel's Node.js selector shows a version dropdown. Pin whatever version was used in development (currently v22.x based on the sandbox). Record it in `package.json` under `engines`:
  ```json
  "engines": { "node": ">=20.0.0" }
  ```

### 7.3 MySQL on cPanel

- Create a MySQL database via cPanel's "MySQL Databases" tool.
- Create a MySQL user with a strong password (do NOT reuse XAMPP's blank root).
- Grant that user ALL PRIVILEGES on the new database (cPanel wizard walks you through this).
- Note the fully-qualified DB name — cPanel prefixes it with the account (e.g. `ncrhcpanel_ncrh_prod`).
- Note the DB host — sometimes `localhost`, sometimes a specific hostname depending on the shared plan.
- If the cPanel provider requires TLS to MySQL, they'll publish a CA. Set `DB_SSL=true` (production requires this anyway) and put the CA cert on the server, referenced by `DB_SSL_CA_PATH` (add this env var if needed — not currently in the config; extend `sequelize/config/config.js`'s `dialectOptions.ssl` block).

### 7.4 Migration on cPanel

- SSH into cPanel (most shared plans allow it).
- Set `NODE_ENV=production` in the environment.
- Run `npm ci --omit=dev` to install runtime deps only.
- Run `npm run db:migrate`. Sequelize-cli respects the same `.env` overlay chain (`.env.production.local` > `.env.production` > `.env`).
- Confirm with `npm run db:migrate:status`.

### 7.5 File uploads and persistent storage

- `uploads/` is git-ignored except for `.gitkeep`. cPanel deploys typically don't preserve uploaded files across redeploys unless you keep them outside the repo root. Either:
  - Symlink `uploads/` to a persistent directory outside the app root (e.g. `~/uploads/`), OR
  - Move to S3-compatible object storage (recommended for production — the Research and Certificate models already have `*FileKey` columns for exactly this pattern).
- Multer limits and multipart-body middleware need review under the cPanel Passenger request-size ceiling (typically 100 MB but varies).

### 7.6 Process management

- Passenger handles process supervision; you don't need PM2 under cPanel.
- Health checks: cPanel usually pings `/`. The current `/health` endpoint returns JSON — either add a plain `/` route or configure cPanel to poll `/health`.

### 7.7 Logs

- Pino logs to stdout. cPanel captures stdout to `~/logs/app.log` (varies by provider). Log rotation is the provider's problem, but confirm.
- Consider setting `LOG_LEVEL=info` in production explicitly (defaults to debug in development).

### 7.8 Sensitive endpoints and CORS

- `CORS_ORIGINS` needs the production frontend origin(s) — currently empty in the example. Set to a comma-separated allowlist (`https://ncrh.go.ke,https://admin.ncrh.go.ke`), NOT `*`.
- The Helmet CSP in `app.js` is already built from `CORS_ORIGINS` at boot time — review the CSP `directives` object against every CDN the frontend actually loads from (Google Fonts, jsDelivr, Cloudinary if used, etc.). If the CSP blocks a required asset in production, the frontend will fail silently for users.

## 8. Next step: connecting the frontend (client)

The frontend is a separate React (Vite) app, uploaded as `client.zip`. Integration checklist:

### 8.1 API base URL

- Client-side: replace any hardcoded `http://localhost:5000` with `VITE_API_BASE_URL` from the client's own `.env`. For production, this is the cPanel-hosted API's public URL.
- The client should never talk to XAMPP directly in production. Confirm no residual `localhost` or `127.0.0.1` references.

### 8.2 CORS

- Backend: set `CORS_ORIGINS=https://<frontend-domain>` (comma-separated for multiple).
- Backend: confirm `credentials: true` is set in the CORS middleware (needed for cookie-based auth — check `app.js`).
- Frontend: axios/fetch calls must include `credentials: "include"` or `withCredentials: true`.

### 8.3 Authentication

- Confirm cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax` (or `None` if frontend is on a different apex domain than the API — which then also requires `Secure`).
- JWT refresh: verify the refresh flow works when the API and frontend are on different subdomains.
- Test the "logout" flow — the `TokenBlacklist` table's cleanup job is documented but not scheduled; either add a cron (§12) or accept the row growth for now.

### 8.4 File uploads

- Confirm multer's `dest` matches whatever persistent-storage decision was made in §7.5.
- Frontend needs to know the maximum file size and forbidden mime types — surface these as an API metadata endpoint or hardcode them once agreed.

### 8.5 M-Pesa callback URL

- `MPESA_CALLBACK_URL` must be the **public** URL of the API. Under cPanel, that's `https://api.ncrh.go.ke/api/payments/mpesa/callback` (or wherever the route is mounted). Test with M-Pesa sandbox first.
- The callback endpoint must be reachable publicly with no auth — verify no middleware accidentally protects it.

### 8.6 External careers link

- The careers page on the frontend should link out to the county website's careers URL. That URL belongs in `client/.env` as e.g. `VITE_COUNTY_CAREERS_URL`, not hardcoded, so staging can point somewhere else. Backend is not involved — no more `/api/applications` calls.

### 8.7 Client-side smoke tests to run against the deployed backend

Bare minimum before signing off frontend integration:

- Auth: register → login → refresh → logout.
- Content: create a news post as admin, load it as public.
- Medical: book an appointment, list it in admin.
- Blood: register a donor, list donors as admin.
- Payments: initiate an M-Pesa STK push against sandbox, receive callback, mark payment completed.
- Research: submit a proposal, verify `researchId` is generated in the expected format.
- Certificate: issue a certificate, verify the QR code payload validates via `/api/certificates/verify`.

## 9. Next step: data migration from local MongoDB

If any real data lives in the local XAMPP/MongoDB installation that needs to survive the cutover, follow this playbook.

### 9.1 Snapshot everything first

- `mongodump` the entire Mongo DB and store the dump in a location that will survive cPanel redeployment.
- `mysqldump` the MySQL DB (which will be empty after fresh migrations, but capture the schema).
- Both dumps are inputs to rollback (§11).

### 9.2 Write a per-domain migration script

- One script per domain, executed in the same order as the cutover (§6.3).
- Each script:
  - Connects to Mongo (read-only) and to MySQL (via the Sequelize connection).
  - Streams Mongo documents (don't load full collections into memory).
  - Maps ObjectIds to a temporary lookup table (`{ mongoId: 'ObjectId string', sqlId: <BIGINT> }`) so subsequent scripts can resolve cross-collection references.
  - Wraps each row insert in a transaction; on error, logs and moves on (not fails the whole run — but records the failed row for triage).
  - Emits a summary: total, migrated, skipped, failed, with reasons.

### 9.3 Special cases already flagged

- **`BloodDonor.donorId`** and **`Research.researchId`**: preserve existing IDs verbatim from Mongo. Don't regenerate — printed cards and PDFs already reference them.
- **`Certificate.certificateNumber`**: same — preserve. Also copy `verificationToken` verbatim so existing QR codes still verify.
- **`Payment.mpesaReceiptNumber` and `checkoutRequestId`**: preserve — these are M-Pesa's unique keys and re-issuing them is impossible.
- **User passwords**: bcrypt hashes are portable across DBs — just copy the string. Do **not** re-hash.
- **JWT tokens in `TokenBlacklist`**: don't migrate. Force a re-login instead; the table will refill from live traffic.

### 9.4 Cutover window

- Prefer a low-traffic window (weekend early morning).
- Put the frontend into a maintenance mode (static "we'll be right back" page) during the cutover to prevent split-brain writes to two DBs simultaneously.
- Run migrations, run domain data-copies, run smoke tests, then flip the frontend back.

## 10. Verification checklist

Ordered by dependency. Don't skip.

### 10.1 Sequelize/migration layer

- [ ] `npm ci` succeeds without deprecation warnings for removed packages.
- [ ] `npm run db:migrate` applies all 20 migrations without errors on both XAMPP MySQL and the target cPanel MySQL.
- [ ] `npm run db:migrate:status` shows all migrations `up`.
- [ ] `npm run db:migrate:undo:all` reverses cleanly, then `npm run db:migrate` re-applies. Confirms rollback works.
- [ ] `SHOW CREATE TABLE researches\G` shows the FULLTEXT index and the four foreign-key constraints (the three circular ones landed via the follow-up migration).
- [ ] `SHOW CREATE TABLE reviews\G` shows the `committee_vote_key` column as `GENERATED ALWAYS AS (...) STORED` and the `reviews_committee_vote_unique` UNIQUE index.

### 10.2 App boot

- [ ] `NODE_ENV=production` startup **fails** if `DB_SSL` is not set to `true` (fail-fast rule).
- [ ] `NODE_ENV=production` startup **fails** if `DB_PASSWORD` is empty.
- [ ] `NODE_ENV=development` with the XAMPP defaults starts successfully.
- [ ] `/health` returns 200 with the expected JSON payload.

### 10.3 Endpoint parity

For each domain, run the equivalent endpoint against both the current Mongoose backend and the cutover Sequelize backend, diff the JSON response shape. Expected differences:

- IDs: Mongo `_id` (string) → SQL `id` (integer). All FK-referenced IDs also change.
- Timestamps: format unchanged (ISO strings).
- Everything else: identical shape.

If any other field differs, either the controller wasn't fully ported or the Sequelize model attributes drifted from the Mongoose schema. Fix before moving on.

### 10.4 Post-deployment

- [ ] M-Pesa callback endpoint is publicly reachable from Safaricom's IPs.
- [ ] File uploads write to persistent storage (survive a redeploy).
- [ ] Emails send from the cPanel host (some providers block outbound SMTP on port 25 — use 587).
- [ ] Rate limits behave under real traffic — the auth limiter in particular.

## 11. Rollback plan

Per-domain rollback is possible because cutover is domain-by-domain and Mongoose is not removed until the very last step:

1. **Before any code is deleted:** revert the controller to the Mongoose version (git revert). Mongo has been running in parallel throughout cutover, so it still has the current data.
2. **During data migration:** if a domain's data-copy fails, the Mongo copy is untouched — restore by pointing the controller back at Mongoose.
3. **After a domain is signed off and Mongoose model deleted:** rollback is the `mysqldump` from §9.1 restored to MySQL, plus reintroducing the Mongoose model from git.

Whole-project rollback (unlikely once each domain is signed off):

- `npm run db:migrate:undo:all` drops all MySQL tables.
- `git revert` back to a pre-cutover commit.
- `mongorestore` the last good Mongo dump.

Keep both `mongodump` and `mysqldump` for at least two weeks after each domain's sign-off.

## 12. Open questions and follow-ups

Tracked here because they don't belong in any one section:

1. **County-website careers URL.** Where does the frontend link out to? Needs a `VITE_COUNTY_CAREERS_URL` (or equivalent) in the client, per-environment.
2. **`TokenBlacklist` cleanup cron.** MongoDB's TTL index expired revoked JWTs automatically. MySQL doesn't have TTL indexes. Options: (a) a nightly cron via `node-cron` running `DELETE FROM token_blacklist WHERE expires_at < NOW()`; (b) opportunistic cleanup in the auth middleware. Recommend (a) — add a `scripts/cleanup-tokens.js` and schedule via cPanel cron.
3. **SMS provider replacement.** The `smsServices` stub is null; if SMS notifications need to come back, the appointment controller has the callsites already commented in.
4. **Data-migration scripts.** Skeleton needs to be written per domain — not started yet.
5. **CSP directives review.** The production Content-Security-Policy in `app.js` is built from `CORS_ORIGINS` but needs the actual list of frontend-loaded CDNs verified against a browser DevTools audit on the deployed frontend.
6. **cPanel MySQL SSL CA path.** If the cPanel provider requires TLS with a specific CA, extend `sequelize/config/config.js` to read `DB_SSL_CA_PATH` and load the certificate file. Currently only `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED` are wired.
7. **File storage strategy.** Local disk under `uploads/` is fine for XAMPP dev but fragile on cPanel. Decision needed: symlinked persistent directory, or S3-compatible object storage. Research and Certificate models are already shaped for object storage (`*FileKey` columns).
8. **Session store.** If the app uses `express-session` with a Mongo store, that needs replacement before Mongoose is removed.
9. **Postman collection.** No Postman/Insomnia collection is committed. Recommend creating one — makes the endpoint-parity testing in §10.3 dramatically easier and gives QA a starting point.
10. **Model count sanity check.** After the careers removal, the Sequelize registry loads 28 models. The Mongoose `models/` directory should now also be at 28 (originally 30 minus the two career models). Confirm before starting cutover.

---

*End of handover document. Companion: `sequelize/MIGRATION_PLAN.md` for per-model design rationale.*
