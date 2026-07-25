# MongoDB → MySQL Migration Plan

## Status: **schema migration complete** — 28 Sequelize models cover every remaining Mongoose model (the two career models were removed; careers is now handled by the county website). Boot wiring done — MySQL is the primary datastore, Mongoose is legacy/optional. Per-controller cutover not yet started; see `BACKEND_HANDOVER.md`.

## Where things live

- `sequelize/config/config.js` — environment-driven Sequelize config
  (development/test/staging/production). Validates required env vars at
  load time and fails fast if any are missing.
- `sequelize/config/loadEnv.js` — loads `.env.<NODE_ENV>[.local]` over
  `.env`, so each environment can override without touching the others.
- `sequelize/models/` — Sequelize model definitions + `index.js` loader.
- `sequelize/migrations/` — sequelize-cli migrations (idempotent-by-design:
  `createTable`/`addIndex`, safe to run repeatedly via `db:migrate`, and
  each ships a matching `down()` for rollback).
- `.sequelizerc` — points sequelize-cli at the folders above.
- `.env.example` — documents every required var, MySQL included, as
  placeholders only.

This lives alongside the existing Mongoose `models/`, `config/db.js`, etc.
**Nothing in `app.js`/`server.js` has been switched over yet** — the app
still runs on MongoDB today. That cutover is a separate, deliberate step
(see "Cutover" below), not something to do model-by-model.

## Key design decisions

- **Primary keys**: `BIGINT UNSIGNED AUTO_INCREMENT` on every table, named
  `id`. Mongo's `ObjectId` strings are gone as PKs; existing app-level
  business identifiers (`employeeId`, `researchId`, `donorId`,
  `tenderNumber`, `certificateNumber`, ...) are kept as separate unique
  `VARCHAR` columns exactly as before — nothing that referenced those
  strings in emails, PDFs, or QR codes needs to change.
- **Naming**: JS models stay camelCase; the actual MySQL columns are
  snake_case (`underscored: true` in the base config), which is the
  MySQL-idiomatic convention. Sequelize maps between the two
  transparently.
- **Foreign keys**: real MySQL `FOREIGN KEY` constraints with explicit
  `onDelete`/`onUpdate`, replacing Mongoose's unenforced `ref` pointers.
- **Small nested objects/arrays** (e.g. `socialLinks`, `notifications`,
  `specialisations`) become native MySQL `JSON` columns rather than join
  tables, since nothing in the codebase queries into them relationally.
  Fields that genuinely need relational integrity or joins (anything
  that's really a foreign key, like `researcher`/`research`/`reviewer`
  references) become real FK columns, not JSON.
- **Text search**: Mongo's weighted `text` indexes become MySQL
  `FULLTEXT` indexes (see the `researchers` migration for the pattern).
  Relevance weighting isn't identical, but full-text search over the same
  columns is preserved.
- **Enums**: Mongoose `enum` validators become native MySQL `ENUM` columns
  — same constraint, enforced by the database instead of only the app
  layer.
- **Passwords/tokens**: hashing (bcrypt) and token generation logic is
  ported unchanged (same `authConfig.BCRYPT_SALT_ROUNDS`, same
  hash-before-store pattern for reset/verification tokens).
- **Fixed a latent bug in passing**: `User.failedLoginAttempts` /
  `lockUntil` are referenced by `authController.js` today but were never
  declared on the Mongoose schema, so writes to them were silently
  dropped under Mongoose's default strict mode. They're real columns now.

## Content-cluster notes worth flagging

- **News/Notice/Event/Career content columns** use `TEXT`, not
  `STRING(255)`. Anything article-length would silently truncate on
  cutover if left as VARCHAR.
- **Notice status derivation** (visibility + start/end date windows) is
  ported to a `beforeSave` hook and unit-tested for all four branches
  (hidden / scheduled / expired / active). Same rules the controllers and
  UI already assume.
- **Gallery.category** is deliberately kept as a free-form `STRING`, not
  a FK to `gallery_categories`. That matches the current Mongoose
  contract — the two collections are managed independently in
  controllers today. Tightening to a real FK is a domain decision, not a
  migration decision, and can be done later.
- **Notice.attachments** and **Doctor.availability** are stored as
  `JSON`. Neither is queried relationally; both are only ever fetched
  wholesale for a given parent row. Doctor.availability has an
  application-level validator (day + HH:MM shape) to catch bad payloads
  before they land, since MySQL only enforces JSON validity.
- **FULLTEXT indexes** are added to `notices(title, content)` and
  `gallery(title, description)` to replace the Mongo `text` indexes.
  Gallery's `tags` (JSON) is not covered by FULLTEXT — MySQL can't
  full-text-index inside JSON — but tag filtering via `JSON_CONTAINS`
  still works at query time.
- **Doctor** is a strict 1:1 with `users(id)` via a unique FK, matching
  the Mongoose model's `unique: true` on `userId`. `onDelete: CASCADE`
  so deleting a user removes their doctor profile.

## Medical-cluster notes worth flagging

- **AnonymousAppointment** deliberately keeps snake_case attribute names
  (`case_code`, `case_type`, `contact_method`, `safe_to_contact`, …). The
  existing controller and API contract use those names verbatim, so a
  camelCase rename would break clients on cutover. Also has
  `timestamps: false` and a manually managed `created_at`, mirroring the
  Mongoose schema which never had `updatedAt`.
- **BloodDonor consent fields** (`consentDonate`, `consentTest`,
  `consentTerms`) get real `mustBeTrue` validators, not just `required`.
  The Mongoose `required: true, default: false` combo was technically
  satisfiable by an unchecked box; explicit validators reject that.
- **BloodDonor.donorId** generation is ported to a `beforeValidate` hook
  producing the same `DON-NCRH-{6digits}-{year}` format. Also added
  `BloodDonor.createWithUniqueId(data)` — retry-on-`UniqueConstraintError`
  wrapper that fixes the TOCTOU race in the original pre-save
  check-then-write pattern (DB uniqueness is now the source of truth).
- **BloodDonor.bloodGroup** ENUM includes the empty string as a
  "not-yet-set" sentinel, exactly as the Mongoose schema did.
- **UrgentBloodRequest.bloodGroups** is a JSON array (fixed 8-value
  domain, always fetched wholesale). App-layer validator enforces
  non-empty + each value in the allowed set; MySQL enforces only that
  the value is valid JSON.
- **Vehicle.plate** has a setter that uppercases and trims — replacing
  Mongoose's `uppercase: true`. Unique constraint stays at the DB.
- **AmbulanceBooking.vehicleId** uses `onDelete: RESTRICT` (a vehicle
  can't be deleted while dispatches point at it — historical records
  matter). `userId` uses `SET NULL` since bookings can outlive user
  accounts. Both are nullable at insert time.
- **Appointment.appointmentDate + time and BloodDonor.donationTime** are
  kept as strings, matching the current Mongoose schemas. Tightening
  them to real `DATE`/`TIME` columns is a controller-layer change (input
  parsing, validation, timezone handling), not a schema-swap decision —
  flagged for a later pass.

## Procurement-cluster notes worth flagging

- **Money columns are DECIMAL, not FLOAT/DOUBLE.** `bids.bid_amount`
  DECIMAL(16,2), `tenders.budget_min/max` DECIMAL(14,2),
  `inventories.price` DECIMAL(12,2), `bids.tax_rate` DECIMAL(5,2). The
  Mongoose schema used `Number` throughout, which is IEEE-754 double —
  fine for display but silently wrong for arithmetic like `price *
  quantity + tax`. Switching to DECIMAL at the schema level fixes this
  cleanly, once, for every downstream reader.
- **Bid.score.* flattened to real columns.** The Mongoose model had a
  nested `score: { technical, financial, compliance, experience, overall }`
  object; a compound index `{ 'score.overall': -1 }` was defined for
  ranking bids per tender. That index only actually indexes anything
  useful if the field is a top-level column, so on cutover the five
  scores become `score_technical/financial/compliance/experience/overall`.
- **Everything else embedded stays as JSON.** Controllers only ever
  update the arrays via a full `bid.save()` (append/replace pattern,
  never a sub-document update or cross-bid aggregate); the JSON columns
  match that access pattern with no join overhead. Helper methods
  (`addComment`, `addActivityLog`) reassign the array rather than
  mutating in place, so Sequelize's change-tracker actually detects the
  edit — smoke-tested.
- **Tender number generation** ported to the atomic `Counter` model
  (per-year key `tender-${year}`), fixing the TOCTOU race in the
  Mongoose `countDocuments()` approach that would hand out duplicate
  tender numbers under concurrent creates.
- **Cross-model side effect preserved.** `bids` afterSave/afterDestroy
  recomputes `tenders.bids_received` for the parent tender, excluding
  `draft` and `withdrawn` — same set as the Mongoose post-save/remove
  hooks. The recompute passes `hooks: false, silent: true` on the
  Tender.update to avoid recursion loops and updated_at bumps.
- **Circular FK broken into two migrations.**
  `tenders.awarded_bid_id → bids(id)` and `bids.tender_id → tenders(id)`
  are a cycle; the second constraint is added in a separate migration
  (20260722141100) after both tables exist. `awarded_bid_id` uses
  `ON DELETE SET NULL` (deleting the winning bid un-awards the tender
  rather than deleting it — audit trails matter). `tender_id` uses
  `RESTRICT` for the same reason: a tender can't be deleted while bid
  submissions reference it.
- **Denormalized name fields preserved.** `tenders.created_by_name`,
  `bids.vendor_name/tender_number`, `fraud_reports.reviewed_by_name`,
  etc. all mirror the Mongoose model. Reason unchanged: they survive
  eventual account anonymisation/deactivation, so historical audit
  records still identify who did what.
- **Inventory `sku` uses MySQL's default unique-with-multiple-NULLs
  behaviour** to reproduce Mongoose's `sparse: true` semantics —
  multiple products can have no SKU, only assigned SKUs must be unique.
  FULLTEXT index on `name, supplier` replaces the Mongo text index
  (removed `category` since it's an ENUM, not free-text).

## Content-leftovers-cluster notes worth flagging

- **Feedback.status kept as STRING(30), not ENUM.** The Mongoose schema
  had no enum constraint on this field — controllers today use
  `"pending"` and `"responded"`, but nothing rejects other values.
  Tightening to ENUM would be a behaviour change (rows that pass today
  would fail tomorrow). Left as STRING to preserve the current contract;
  a follow-up migration can promote it to ENUM once the value set is
  confirmed fixed.
- **Feedback has no `updated_at`.** The Mongoose schema opted out of
  `timestamps` entirely and only tracked a manual `createdAt`.
  Preserved (`timestamps: false` + manual column) — same pattern used by
  `AnonymousAppointment`. If you ever add response-editing that needs
  audit metadata, add `updated_at` in a follow-up migration.
- **Feedback accepts anonymous submissions.** Both `name` and `email`
  are nullable; only `message` is required. The email validator only
  fires when the field is non-null (rejects malformed emails without
  demanding one), which matches the current controller expectations for
  the public feedback form.
- **Report validates the Custom-period invariant at the model level.**
  When `period === "Custom"`, both `customStartDate` and `customEndDate`
  are required and start must be ≤ end. The Mongoose schema had no such
  check; controllers relied on ad-hoc validation which is easy to skip
  or drift out of sync between endpoints. Model-level `validate` block
  guarantees no report row can violate it, regardless of ingest path.
- **Report.comments follows the same JSON-mutation pattern as Bid.**
  `report.addComment()` reassigns the `comments` array rather than
  mutating in place, so Sequelize's change tracker actually detects the
  edit and includes `comments` in the UPDATE. Mutating in place would
  silently drop the change on `save()` — smoke-tested.
- **Report.fileSize is BIGINT.UNSIGNED, not INT.** Image bundles and
  ZIP archives can plausibly exceed the ~2GB INT limit; BIGINT gives up
  to ~9.2 EB of headroom for zero downside.
- **Report.uploadedBy uses ON DELETE RESTRICT.** Reports are
  institutional artifacts — losing them when a staff account is
  deactivated would break audit chains. Deletion has to be handled
  deliberately.

## Research-domain-cluster notes worth flagging

- **Money is DECIMAL, hidden columns are excluded by default.**
  `payments.amount/refund_amount` and `researches.download_price` all
  DECIMAL(10-12,2). `payments.download_token` and
  `download_token_expire` are hidden by default scope (`select: false`
  in Mongo) — the `withSecrets` scope re-includes them for the download
  flow only.
- **Research ID / Certificate number generation ported to atomic
  Counter.** Both used `countDocuments()`-then-inc in Mongoose, which
  TOCTOU-raced under concurrency. Now both go through the same atomic
  `Counter.incrementAndGet` used by tender numbers. Per-year keyspaces
  (`research-2026`, `NCRH-CLR-2026`, `NCRH-CPL-2026`) so seq never
  wraps or collides across cert types.
- **Research embedded review snapshots kept as JSON.** The three
  per-stage denormalized decision objects (`proposalReview`,
  `progressReview`, `finalPaperReview`) mirror the Mongoose
  subdocument shape and are always fetched wholesale. Canonical,
  queryable review history lives in the separate `reviews` table.
- **Research soft-delete is enforced by defaultScope, not app code.**
  `Research.findAll(...)` transparently filters `is_deleted = false`.
  Admin flows use `Research.unscoped()` or `Research.scope("withDeleted")`.
  This ports the Mongoose `pre(/^find/)` middleware while making the
  filter observable in every query rather than hidden in middleware.
- **`references` column name is a MySQL reserved word.** Kept as-is
  (matches the Mongoose field name and any controller code that reads
  `research.references`). Sequelize's DDL builder backtick-quotes it
  automatically, so schema creation works; queries generated by
  Sequelize also quote it. Only raw SQL referring to the column needs
  to remember the backticks.
- **Review committee-vote uniqueness via a stored generated column.**
  Mongo used a partial unique index
  (`{research, stage, round, reviewer} UNIQUE WHERE reviewerRole = "committee"`).
  MySQL has no partial indexes, so instead there's a STORED
  generated column `committee_vote_key` that concatenates the four
  fields for committee-role rows and stays NULL for reviewer-role rows.
  A UNIQUE index over it enforces committee uniqueness (multiple NULLs
  are legal in MySQL unique indexes → reviewer-role rows never
  collide). Requires MySQL 5.7.6+ / MariaDB 10.2+ — XAMPP satisfies
  this; the migration is a reliable place to catch older-server
  environments at deploy time.
- **Review.beforeCreate correctly branches on reviewer_role.** For
  reviewer-role rows it un-sets `is_latest` on prior reviews for the
  same research+stage (matching Mongoose's pre-save hook). For
  committee-role rows it does nothing, because multiple committee
  members' votes legitimately coexist. Both paths smoke-tested — the
  hook was the most-likely source of subtle regressions.
- **Certificate.signToken is HMAC-SHA256 truncated to 24 hex chars.**
  The truncation keeps QR-code payloads short while retaining ~96 bits
  of entropy — way more than enough for verification when the signing
  secret isn't public and cert numbers can't be enumerated.
  `verifyToken` uses `crypto.timingSafeEqual` so probing the endpoint
  can't reveal token bytes via response-time analysis. `signToken`
  throws if `CERTIFICATE_SIGNING_SECRET` is missing — a programming
  error rather than a silent security downgrade.
- **Certificate.qr_code_data_url is MEDIUMTEXT, not TEXT.** Base64 PNGs
  can exceed the 64 KiB TEXT cap as complexity grows; MEDIUMTEXT gives
  16 MiB of headroom, which is more than enough.
- **Circular FKs on researches broken into a follow-up migration.**
  `researches.submission_payment_id → payments`,
  `researches.clearance_certificate_id → certificates`, and
  `researches.completion_certificate_id → certificates` are all added
  in 20260722150400 after all four tables exist. All three use
  `ON DELETE SET NULL` — deleting a payment or certificate leaves the
  research row intact (institutional record).
- **Certificate.supersedes_id is a self-referential FK** for chaining
  amended certificates (a corrected version supersedes the original).
  `ON DELETE SET NULL` — the chain terminates cleanly if an earlier
  entry is removed.
- **FULLTEXT is NOT weighted like Mongo's text index.** The Mongoose
  Research text index applied per-column weights
  (`title: 10, abstract: 5, keywords: 4, discipline: 3, finalAbstract: 5`)
  and `MATCH ... AGAINST` doesn't. Ranking will be slightly different
  after cutover for the same query. `keywords` also can't be
  FULLTEXT-indexed here since it's stored as JSON; tag search stays
  available via `JSON_CONTAINS` at query time. If per-column relevance
  matters at a call site, split into multiple MATCH clauses with your
  own weighting.
- **findSimilarTitles ported.** Uses MySQL FULLTEXT to grab the top-5
  candidates, then the same Levenshtein-ratio filter (threshold 0.85
  default) as before. Levenshtein is O(n·m) so keeping the candidate
  pool small matters; the FULLTEXT prefilter does that.

## Done

| Domain | Mongoose model | Sequelize model | Migration |
|---|---|---|---|
| Auth | `userModel.js` | `sequelize/models/user.js` | ✅ |
| Auth | `ProfileModel.js` | `sequelize/models/profile.js` | ✅ |
| Auth | `tokenBlacklistModel.js` | `sequelize/models/tokenBlacklist.js` | ✅ |
| Research | `ResearcherModel.js` | `sequelize/models/researcher.js` | ✅ |
| Research | `CounterModel.js` | `sequelize/models/counter.js` | ✅ |
| Content | `newsModel.js` | `sequelize/models/news.js` | ✅ |
| Content | `noticeModel.js` | `sequelize/models/notice.js` | ✅ |
| Content | `galleryCategoryModel.js` | `sequelize/models/galleryCategory.js` | ✅ |
| Content | `galleryModel.js` | `sequelize/models/gallery.js` | ✅ |
| Content | `eventsModel.js` | `sequelize/models/event.js` | ✅ |
| Content | `servicesModel.js` | `sequelize/models/service.js` | ✅ |
| Content | `doctorModel.js` | `sequelize/models/doctor.js` | ✅ |
| Content | `careersModel.js` | `sequelize/models/career.js` | ✅ |
| Medical | `appointmentModel.js` | `sequelize/models/appointment.js` | ✅ |
| Medical | `anonymousModel.js` | `sequelize/models/anonymousAppointment.js` | ✅ |
| Medical | `BloodDonor.js` | `sequelize/models/bloodDonor.js` | ✅ |
| Medical | `UrgentBloodRequest.js` | `sequelize/models/urgentBloodRequest.js` | ✅ |
| Medical | `ambulanceBookingModel.js` | `sequelize/models/ambulanceBooking.js` | ✅ |
| Operations | `vehicleModel.js` | `sequelize/models/vehicle.js` | ✅ |
| Operations | `inventoryModel.js` | `sequelize/models/inventory.js` | ✅ |
| Operations | `fraudModel.js` | `sequelize/models/fraudReport.js` | ✅ |
| Careers | `careersApplicationModel.js` | `sequelize/models/careerApplication.js` | ✅ |
| Procurement | `tenderModel.js` | `sequelize/models/tender.js` | ✅ |
| Procurement | `bidModel.js` | `sequelize/models/bid.js` | ✅ |
| Content | `feedbackModel.js` | `sequelize/models/feedback.js` | ✅ |
| Content | `reportModel.js` | `sequelize/models/report.js` | ✅ |
| Research | `researchModel.js` | `sequelize/models/research.js` | ✅ |
| Research | `ReviewModel.js` | `sequelize/models/review.js` | ✅ |
| Research | `PaymentModel.js` | `sequelize/models/payment.js` | ✅ |
| Research | `CertificateModel.js` | `sequelize/models/certificate.js` | ✅ |

## Remaining models

All Mongoose models have been mapped to Sequelize models + MySQL
migrations. There is nothing left to schema-migrate. What follows is the
cutover work — swapping the app itself from Mongoose queries to
Sequelize queries — which has NOT started.

## Cutover (not started)

Switching `app.js`/`server.js`/controllers from Mongoose to these
Sequelize models is a separate, all-or-nothing-per-domain step: every
controller and service touching a migrated model needs its queries
rewritten (`find`/`findOne`/`populate` → `findAll`/`findOne`/`include`,
`$or`/`$in` → `Op.or`/`Op.in`, etc). Recommended order once all models
above exist:
1. Stand up MySQL schema fully via `npm run db:migrate` against a XAMPP
   instance and verify it matches expectations.
2. Write a one-time data-migration script (Mongo → MySQL) per domain,
   idempotent, transactional, with a validation report and no destructive
   action without explicit confirmation (per the project's migration
   policy) — not written yet.
3. Cut over controllers domain-by-domain (auth first), running both
   backends in parallel behind a feature flag if a zero-downtime cutover
   is required.
4. Remove the corresponding Mongoose model/controller code once a domain
   is fully verified on MySQL.

## How to try this now

```bash
# against your local XAMPP MySQL instance
npm run db:migrate          # creates users, profiles, token_blacklist, counters, researchers
npm run db:migrate:status   # confirm state
npm run db:migrate:undo:all # rollback everything, if needed
```

Note: this sandbox had no live MySQL server to test against, so the
migrations/models were verified by loading them (model definitions parse
and associate correctly) and syntax-checking every file, but **not** run
against a real MySQL instance yet. Please run `npm run db:migrate`
against your XAMPP MySQL before relying on this.
