# RE-VOLVE API

Base URL: the Next.js origin. All routes are `force-dynamic`. No restricted government APIs are called.

## Health

`GET /api/health` → `{ ok: true }` after a PostgreSQL ping.

## Vehicles

`GET /api/vehicles`

Query: `state`, `rto`, `category`, `fuel`, `emission`, `fitness`, `puc`, `source`, `yearFrom`, `yearTo`, `ageBand`, `q`, `flagged`, `limit`, `offset`.

`GET /api/vehicles/stats` — dashboard aggregations for the same filters.

## Assessment

`POST /api/assess`

JSON body matching vehicle fields. Optional `persist: true` stores the snapshot. Returns `{ result }` with score, factors, evidence, missing fields, recommendation, caveats.

## Import

`POST /api/import/preview` — `multipart/form-data` file. Returns headers, mapping guess, preview rows.

`POST /api/import` — `file` + `mapping` JSON. Validates size (2 MB), type, dates, duplicates. Scores accepted rows.

`GET /api/import/template` — sample CSV.

`DELETE /api/import` — removes `user_import` rows only.

## Insights & simulator

`GET /api/insights` — findings + regional summary.

`GET /api/simulator` — four default scenarios.

`POST /api/simulator` — `{ strategy, topPercent, filters }` returns scenario metrics and a selected-record preview.

Strategies: `top_priority`, `puc_failures`, `expired_fitness`, `pre_bsiv_diesel_commercial`, `incomplete_compliance`, `replacement_pre_bsiii`.

## Documents

`POST /api/documents` — JSON `{ text }` or multipart `.txt`. Local regex extraction. Image/PDF returns 415 in demo mode.

## Assistant

`POST /api/assistant` — `{ question }`. Answers only from loaded records.

## Dataset

`POST /api/seed` — `{ reset?: true }` restores the synthetic fleet.

`GET /api/export` — cleaned CSV of the filtered set.

`GET /api/architecture` — AWS adapter status.
