# Bulk import operations

The first enabled import entity is hospital services and departments. Imports are available to an authenticated superadmin from **Dashboard → Bulk Imports**.

## Safe import workflow

1. Download the entity CSV template.
2. Fill in a UTF-8 `.csv` file. Do not add columns or upload images.
3. Validate the file and review the preview and reported errors (up to 200 rows).
4. Resolve the errors, then validate again. Validation never changes service records.
5. Sign in again if the last successful password login is older than the configured fresh-auth window (15 minutes by default), then commit the batch. Refreshing an access token does not reset this window.
6. Review the public services page. A batch can be rolled back for 30 days if no affected row has changed since commit.

The commit uses the normalized preview inside one database transaction. A failed row prevents the whole commit. Import does not send messages or publish notifications. A single aggregate service change event follows a successful commit.

## CSV rules

- Use the downloaded template's exact headers, in the provided order.
- Maximum upload size is 2 MiB by default; maximum batch size is 500 rows.
- Blank optional cells leave existing values unchanged. Use `[clear]` to clear an optional value.
- Text must be plain text; HTML is rejected. Do not include ids, image paths, timestamps or computed values.
- Price fields are non-negative numbers with up to two decimal places. Minimums cannot exceed maximums.
- Supply both `itemsTotal` and `itemsShaCovered` together. Covered items cannot exceed total items.
- `isPublished` must be exactly `true` or `false`. New departments default to published unless explicitly set to `false`; Registration and Mortuary Services default to unpublished for the initial review.
- `cashMin`, `cashMax`, `shaMin`, and `shaMax` are summary ranges. The optional item-level price table and direct `.xlsx` upload are not part of this release.

## Existing SHA flags

Existing service records contain only the legacy `nhifCovered` yes/no field. That value is preserved until the hospital reviews the underlying coverage data. Their new `shaCoverage` field is left `NULL` to mean “not classified”; it is not converted to `full` or `partial` by assumption. On imported records with both item counts, the model derives `shaCoverage` and the compatibility `nhifCovered` field.

## Deployment configuration

| Variable | Default | Notes |
|---|---:|---|
| `IMPORT_ENABLED_ENTITIES` | `services` | Comma-separated enabled entity keys. Set to empty to disable imports. |
| `IMPORT_MAX_FILE_BYTES` | `2097152` | Valid range 1 KiB–5 MiB. |
| `IMPORT_BATCH_TTL_HOURS` | `24` | Valid range 1–72 hours. |
| `IMPORT_SNAPSHOT_RETENTION_DAYS` | `30` | Rollback/snapshot retention, valid range 1–3650 days. |
| `IMPORT_FRESH_AUTH_MINUTES_T1` | `15` | Maximum access-token age for service commit/rollback, valid range 1–60 minutes. |
| `IMPORT_RATE_VALIDATE_PER_MIN` | `5` | Reserved if a future entity delegates import access; superadmin is exempt. |
| `IMPORT_RATE_COMMIT_PER_MIN` | `3` | Reserved if a future entity delegates import access; superadmin is exempt. |
| `IMPORT_CLEANUP_CRON_ENABLED` | `true` | Runs daily to expire uncommitted payloads and purge old snapshots. |

State-changing requests require the `X-Import-Request: true` CSRF header in addition to the normal active JWT session. The product's superadmin exemption applies to import rate limits as well; file-size and row-count limits still apply. All import responses use `Cache-Control: no-store`.

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

Service data writes use Sequelize model validation and hooks. Public service endpoints return only published rows, use an explicit field list, and sort by `sortOrder` then name. Authenticated service editors can inspect unpublished rows using `/api/services/manage`.

## Adding entities

An entity must have a definition in `services/import/entities/` with an explicit field allowlist, limits, model, natural key, server-set fields, snapshot fields, and rollback policy. Register it in the entity registry, add conformance tests, and enable it through deployment configuration only after a staging rehearsal. Tier 4 records and blood donors remain excluded.
