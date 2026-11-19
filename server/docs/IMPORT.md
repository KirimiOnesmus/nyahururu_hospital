# Bulk import operations

Bulk imports are available to an authenticated superadmin in **Dashboard → Bulk Imports**. The first catalogue rollout supports service departments, their individual price/SHA items, and ambulance transfer options. Superadmin is exempt from per-user import rate limits; upload-size and row-count limits still apply.

## Safe import workflow

1. Download the selected entity's CSV template.
2. Prepare a UTF-8 `.csv` file with the exact headers. `.xlsx` uploads and image uploads are not accepted.
3. Validate the file and review every error and the preview. Validation does not change catalogue records.
4. Resolve errors and validate again.
5. Sign in again if the last successful password login is older than the configured fresh-auth window (15 minutes by default). Token refresh does not reset this window.
6. Commit the validated batch, then review the public service and ambulance pages. A committed batch can be rolled back for the configured snapshot window if affected rows have not changed since commit.

Import the department rows first, then service items, then ambulance options. Service item rows reference the parent department by exact name. Each service-item row contains its own `shaCovered`, `cashPrice`, and `shaPrice`; SHA is not a separate upload. Ambulance rows contain cash/mobile pricing only. Keep the CSV files in `docs/data/` as review drafts until current prices and SHA coverage have been confirmed by the hospital.

Commit runs inside one database transaction. A failed row prevents partial changes. Each operation is audited, imports do not send messages, and a single aggregate change event follows a successful commit.

## Current catalogue shape

- **Services** are departments grouped under Outpatient, Inpatient, or Specialist Clinics. The public label for the existing `Specialist Clinics` database value is **Clinics (Specialized Clinics)**.
- **Service items** hold individual service descriptions, cash/mobile prices, and an explicit SHA-covered flag and SHA price. Public service details show items in separate covered and not-covered groups.
- **Ambulance services** hold public transport options and their prices on the ambulance booking page. They are separate from ambulance fleet vehicles and bookings.
- The existing department-level head/contact/location, price-range summary, item totals, publication, and editable ordering fields are no longer part of the service API or import template. Legacy database columns are retained for compatibility; they are not read or written by the redesigned service APIs.

The workbook has 71 service item rows without a cash/mobile price. Its draft CSVs preserve those cells as blank for review. The non-transfer emergency items are grouped under an Outpatient `Emergency and Casualty Services` department; verify that name and placement before import. Registration and Mortuary Services are omitted. Transfer and local-transport rows are separated into the ambulance catalogue.

## CSV rules

- Use the template's exact headers, in the provided order.
- Maximum upload size is 2 MiB by default; maximum batch size is 500 rows.
- Blank optional cells leave existing values unchanged. Use `[clear]` to clear a clearable optional field.
- Text must be plain text; HTML is rejected. Do not include database ids, image paths, timestamps, or computed values.
- Prices are non-negative numbers with up to two decimal places. Covered rows need an SHA price; rows marked not covered cannot have one.
- Service item imports require an `importKey` to preserve row identity when names repeat. The supplied review files use stable workbook row keys.
- Use `upsert`, `create_only`, or `update_only` mode according to the entity's available modes. Roll back dependent service-item batches before rolling back their department batch.

## Deployment configuration

| Variable | Default | Notes |
|---|---:|---|
| `IMPORT_ENABLED_ENTITIES` | `services,serviceItems,ambulanceServices` | Comma-separated entity keys. Set to empty to disable imports. Production deployments with an explicit older value such as `services` must add the desired new keys. |
| `IMPORT_MAX_FILE_BYTES` | `2097152` | Valid range 1 KiB–5 MiB. |
| `IMPORT_BATCH_TTL_HOURS` | `24` | Valid range 1–72 hours. |
| `IMPORT_SNAPSHOT_RETENTION_DAYS` | `30` | Rollback/snapshot retention, valid range 1–3650 days. |
| `IMPORT_FRESH_AUTH_MINUTES_T1` | `15` | Maximum time since password login for commit/rollback, valid range 1–60 minutes. |
| `IMPORT_RATE_VALIDATE_PER_MIN` | `5` | Applied to any future delegated import roles; superadmin is exempt. |
| `IMPORT_RATE_COMMIT_PER_MIN` | `3` | Applied to any future delegated import roles; superadmin is exempt. |
| `IMPORT_CLEANUP_CRON_ENABLED` | `true` | Runs daily to expire uncommitted payloads and purge old snapshots. |

State-changing requests require the `X-Import-Request: true` CSRF header and a current active JWT session. All import responses use `Cache-Control: no-store`.

## API

Base path: `/api/admin/imports`. Every endpoint requires a superadmin token and active session.

- `GET /entities`
- `GET /entities/:entity/template`
- `POST /:entity/validate?mode=upsert|create_only|update_only` (`file` multipart field)
- `GET /?page=&limit=&entity=&status=`
- `GET /:batchId`
- `GET /:batchId/errors.csv`
- `POST /:batchId/commit` (`{"confirm":true}`)
- `POST /:batchId/rollback`
- `DELETE /:batchId` (discard)

## Other bulk-data candidates reviewed

| Dataset | Recommendation | Reason |
|---|---|---|
| Services, service items, ambulance options | Supported in this rollout | Public catalogues, with explicit validation and transactional rollback. |
| Careers, news, events, notices, tenders | Good candidates for a later text/metadata importer | Content rows are structured; review publication dates and drafts before making public. |
| Downloadable resources | Metadata import is suitable; files need a separate, secure upload workflow | Database rows alone cannot safely move the actual file objects. |
| Gallery media | Defer bulk import until cloud/local asset storage and image checks are integrated | Importing records without valid media files can create broken public entries. |
| Doctors/specialists | Defer pending account-link and credential rules | The directory links to user accounts and must not create or alter credentials implicitly. |
| Inventory | Consider importing item definitions only | Stock quantities, lots, and adjustments are auditable operational transactions and must not be overwritten by a catalogue import. |
| Donors, patients, appointments, bookings, accounts | Excluded from generic bulk imports | These contain personal/health data or live operational state and require purpose-built workflows and access controls. |

## Adding an entity

An entity requires an explicit field allowlist, validation limits, model, natural key, relationship resolution, server-set fields, rollback snapshot, and conformance tests. Register it in the entity registry and enable it in deployment configuration only after a staging rehearsal. Tier 4 records and donor/patient records remain excluded.
