# Plan 004: Replace Or Harden XLSX Export Path

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 07d5dee..HEAD -- package.json pnpm-lock.yaml server/api/export-table-xlsx.post.ts app/composables/use-chart-export.ts app/components/chart.vue app/components/map.vue app/components/word-cloud-graph.vue`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `advisor-plans/002-run-real-playwright-tests-in-ci.md` recommended
- **Category**: security, dependencies
- **Planned at**: commit `07d5dee`, 2026-06-11

## Why This Matters

The app has a direct runtime dependency on `xlsx@0.18.5`, and
`pnpm audit --prod` reports high-severity advisories for that package. The
server exposes `/api/export-table-xlsx`, reads caller-controlled table data,
builds a workbook in memory, and does not require authentication or enforce
size limits. The endpoint should either use a maintained writer or be reduced
to a safer export path with explicit bounds.

## Current State

- `package.json` declares `xlsx`.
- `server/api/export-table-xlsx.post.ts` loads `xlsx` with `createRequire`.
- `app/composables/use-chart-export.ts` calls `/api/export-table-xlsx` for XLSX
  export.

Current excerpts:

```json
// package.json:93
"xlsx": "^0.18.5",
```

```ts
// server/api/export-table-xlsx.post.ts:18-19
const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as unknown as XlsxModule;
```

```ts
// server/api/export-table-xlsx.post.ts:77-95
export default defineEventHandler(async (event) => {
	const body = await readBody<ExportRequestBody>(event);
	const headers = Array.isArray(body.headers)
		? body.headers.map((header) => normalizeCell(header))
		: [];
	...
	const worksheetData = [headers, ...rows];
	const workbook = XLSX.utils.book_new();
	const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
	XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(body.sheetName));
```

```ts
// server/api/export-table-xlsx.post.ts:114
const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
```

Audit result from recon:

- `pnpm audit --prod` reported high advisories for direct dependency `xlsx`.
- Dev-only transitive advisories also existed, but this plan targets the direct
  runtime endpoint.

Repo conventions to match:

- API handlers live under `server/api`.
- Client export integration lives in `app/composables/use-chart-export.ts`.
- Dependency changes use `pnpm` and must update `pnpm-lock.yaml`.

## Commands You Will Need

| Purpose          | Command                                    | Expected on success                             |
| ---------------- | ------------------------------------------ | ----------------------------------------------- |
| Dependency audit | `pnpm audit --prod`                        | no high/critical direct `xlsx` advisory remains |
| Typecheck        | `pnpm types:check`                         | exit 0, no type errors                          |
| Lint             | `pnpm lint:check`                          | exit 0                                          |
| Format           | `pnpm format:check`                        | exit 0                                          |
| Tests            | `pnpm test:ct` and/or focused export tests | relevant tests pass                             |

## Scope

**In scope**:

- `package.json`
- `pnpm-lock.yaml`
- `server/api/export-table-xlsx.post.ts`
- `app/composables/use-chart-export.ts` only if the endpoint contract changes
- Export-related tests if a suitable pattern exists

**Out of scope**:

- Redesigning chart export UI.
- Changing SVG/PNG/JPEG export behavior.
- Adding global rate limiting middleware.
- Rewriting unrelated chart or map components.

## Git Workflow

- Branch: `advisor/004-replace-or-harden-xlsx-export`
- Commit message: `fix: harden table export endpoint`
- Do not push or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Choose the least risky export strategy

Inspect current package options and pick one:

1. Replace `xlsx` with a maintained XLSX writer available on npm that has no
   high/critical production audit advisories.
2. If XLSX is not strictly required, remove server-side XLSX and keep CSV
   export client-side or server-side with strict bounds.

Do not keep `xlsx@0.18.5` on the runtime path. If no acceptable maintained
XLSX writer can be installed, STOP and report rather than keeping the vulnerable
package.

**Verify**: dependency decision documented in the execution notes.

### Step 2: Add request bounds before workbook generation

In `server/api/export-table-xlsx.post.ts`, enforce explicit limits before
building any workbook or CSV:

- maximum header count
- maximum row count
- maximum cell string length
- maximum total cell count or approximate body size

Use conservative constants near the top of the file. Return a 413 or 400
`createError` for oversized payloads. Normalize cells only after validating
array shapes enough to avoid excessive work.

Suggested starting limits unless product requirements say otherwise:

- `maxColumns = 100`
- `maxRows = 10000`
- `maxCellLength = 5000`

**Verify**: `pnpm types:check` -> exit 0.

### Step 3: Decide auth requirement

The current endpoint is unauthenticated, but chart export is used from the app
UI. Add `requireUser(event)` at the start of the handler unless product owners
explicitly need public anonymous exports.

If adding auth breaks published/embed anonymous export use cases, STOP and
report. Do not silently preserve anonymous workbook generation without bounds.

**Verify**: `pnpm types:check` -> exit 0.

### Step 4: Replace the writer or remove XLSX mode

Implement the strategy from Step 1:

- If replacing with another writer, update imports/types and `package.json`.
- If removing XLSX mode, update `useChartExport.exportXlsx` and any UI labels
  only as needed so users do not call a removed endpoint.

Keep response headers correct for the returned file type.

**Verify**:

- `pnpm install --lockfile-only` if needed to update `pnpm-lock.yaml` after a
  dependency change.
- `pnpm types:check` -> exit 0.

### Step 5: Add focused coverage if feasible

Add tests for:

- valid small export returns expected content type
- missing headers returns 400
- oversized rows/cells return 413 or 400
- unauthenticated request returns 401 if auth was added

If no API test harness exists, do not create a new test system. Document the
gap and rely on typecheck/lint plus manual request verification.

**Verify**: focused tests pass if added.

### Step 6: Run checks and audit

**Verify**:

- `pnpm audit --prod` -> no high/critical advisory for direct runtime `xlsx`.
- `pnpm format:check` -> exit 0.
- `pnpm lint:check` -> exit 0.
- `pnpm types:check` -> exit 0.

## Test Plan

- Prefer API-level tests for the export endpoint.
- If component tests cover export buttons, run `pnpm test:ct`.
- Manual smoke test: submit a tiny table to the endpoint as an authenticated
  user if auth is added, confirm a downloadable file response.

## Done Criteria

- [ ] `xlsx@0.18.5` is no longer a direct runtime dependency, or the endpoint
      no longer uses it.
- [ ] Export endpoint enforces row/column/cell limits before file generation.
- [ ] Endpoint auth decision is explicit and implemented.
- [ ] `pnpm audit --prod` no longer reports high/critical direct `xlsx`
      runtime exposure.
- [ ] `pnpm format:check`, `pnpm lint:check`, and `pnpm types:check` exit 0.
- [ ] `advisor-plans/README.md` status row for plan 004 is updated.

## STOP Conditions

Stop and report if:

- No maintained XLSX writer can satisfy the app's required export behavior.
- Public anonymous exports are a hard requirement and cannot be safely bounded
  in this plan.
- The fix requires redesigning chart export UI beyond removing or replacing
  XLSX.
- Any verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

Reviewers should focus on the endpoint's resource limits and whether the new
dependency has a healthier maintenance/audit profile. Future export features
should avoid parsing or generating large caller-controlled documents without
authentication and explicit limits.
