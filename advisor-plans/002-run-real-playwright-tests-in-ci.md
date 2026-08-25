# Plan 002: Run Real Playwright Tests In CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 07d5dee..HEAD -- package.json .github/workflows/validate.yml playwright.config.ts playwright-ct.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests, dx
- **Planned at**: commit `07d5dee`, 2026-06-11

## Why This Matters

The CI workflow installs Playwright browsers and uploads a Playwright report,
but its test step runs `pnpm run test`. In this repo that script is only
`exit 0`, so CI can pass without running E2E or component tests. This weakens
every other security and correctness plan because regressions are not blocked
before deployment.

## Current State

- `.github/workflows/validate.yml` is the main validation workflow.
- `package.json` has real Playwright scripts and a placeholder `test` script.
- `playwright.config.ts` runs app E2E tests and starts `pnpm run start`.
- `playwright-ct.config.ts` runs component tests in Chromium.

Current excerpts:

```json
// package.json:29-31
"test": "exit 0",
"test:ct": "playwright test -c playwright-ct.config.ts",
"test:e2e": "playwright test",
```

```yaml
# .github/workflows/validate.yml:63-67
- name: Install Browsers for E2E tests
  run: pnpm exec playwright install --with-deps

- name: Test
  run: pnpm run test
```

Repo conventions to match:

- Package scripts use `pnpm run <name>`.
- Existing CI separates format, lint, typecheck, build, browser install, test.
- Git history uses Conventional Commits, for example `fix: reposition carousel nav`.

## Commands You Will Need

| Purpose                   | Command            | Expected on success                |
| ------------------------- | ------------------ | ---------------------------------- |
| YAML/package syntax check | `pnpm types:check` | exit 0, no type errors             |
| E2E tests                 | `pnpm test:e2e`    | Playwright tests pass              |
| Component tests           | `pnpm test:ct`     | Playwright CT tests pass           |
| Full validation           | `pnpm validate`    | exit 0 after scripts are corrected |

## Scope

**In scope**:

- `package.json`
- `.github/workflows/validate.yml`

**Out of scope**:

- Rewriting Playwright tests.
- Changing app runtime behavior to make tests pass.
- Changing deployment workflow behavior beyond calling the correct tests.
- Updating snapshots unless tests explicitly require it and the operator agrees.

## Git Workflow

- Branch: `advisor/002-run-real-playwright-tests-in-ci`
- Commit message: `ci: run playwright tests in validation`
- Do not push or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Make `pnpm test` meaningful

Choose one of these two approaches and keep it consistent:

- Preferred: change `package.json` so `test` runs both Playwright suites in
  sequence, for example `run-s test:e2e test:ct`.
- Acceptable: leave `test` alone only if `.github/workflows/validate.yml`
  explicitly runs both `pnpm run test:e2e` and `pnpm run test:ct`.

The preferred approach makes `pnpm validate` meaningful because it already
contains `test test:e2e`; if you change `test`, also remove the duplicate
`test:e2e` from `validate` or accept that E2E will run twice. The cleaner shape
is:

```json
"test": "run-s test:e2e test:ct",
"validate": "run-p format:check lint:check types:check test"
```

`npm-run-all2` is already available and provides `run-s`/`run-p`.

**Verify**: `pnpm types:check` -> exit 0.

### Step 2: Update CI to run the corrected script

In `.github/workflows/validate.yml`, keep the browser installation step, then
run the corrected test script:

```yaml
- name: Test
  run: pnpm run test
```

If you chose not to change `package.json:test`, replace the Test step with
separate commands for `pnpm run test:e2e` and `pnpm run test:ct`.

Make sure artifact upload still points at `playwright-report/`; both Playwright
configs already use the HTML reporter in CI.

**Verify**: inspect the workflow and confirm no CI path still relies on
`pnpm run test` while it is `exit 0`.

### Step 3: Run the actual tests locally

Run the test commands locally. These commands may take time and may require the
local environment expected by the repo.

**Verify**:

- `pnpm test:e2e` -> all Playwright E2E tests pass.
- `pnpm test:ct` -> all component tests pass.

If either suite fails for existing environmental reasons, do not change app
code in this plan. Capture the failure in the execution notes and still ensure
CI is wired to the correct command.

### Step 4: Run validation checks

Run the repo validation command after the script changes.

**Verify**: `pnpm validate` -> exit 0, or document pre-existing test failures
without broadening this plan.

## Test Plan

- The test plan is the change: CI must execute `pnpm test:e2e` and
  `pnpm test:ct` either directly or via `pnpm test`.
- Locally run both Playwright suites if the environment supports them.
- Do not update visual snapshots in this plan unless snapshot differences are
  clearly caused by intentional test execution and a human approves them.

## Done Criteria

- [ ] `package.json:test` is no longer `exit 0`, or CI no longer calls it.
- [ ] CI validation runs both E2E and component Playwright suites.
- [ ] `pnpm validate` no longer includes a duplicate E2E run if `test` already
      runs E2E.
- [ ] Local `pnpm test:e2e` and `pnpm test:ct` were run, or failures are
      documented as environmental/pre-existing.
- [ ] `advisor-plans/README.md` status row for plan 002 is updated.

## STOP Conditions

Stop and report if:

- CI has been replaced by a different workflow not covered here.
- Playwright tests require secrets or services that are unavailable and the
  correct CI command cannot be determined from repo config.
- Making the tests pass requires modifying app behavior or snapshots.
- Any verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

Reviewers should confirm the workflow step names and artifact upload still make
sense after adding component tests. Future changes should avoid reintroducing a
placeholder `test` script unless the CI explicitly calls the real test scripts.
