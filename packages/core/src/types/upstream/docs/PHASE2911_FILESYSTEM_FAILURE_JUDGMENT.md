# Phase 2911 — Filesystem failure judgment

## Trace

`discoverControllerPhpFiles` catches filesystem failures → `filesystemFailure` asks `filesystemFailureCodeJudgmentFactory.from(error)` to classify the platform error into a closed judgment → `continueWith` translates that judgment into the existing `LaravelControllerSourceDiscoveryBlocker` → `laravelControllerSourceDiscoveryJudgmentFactory.blocked` creates the existing upstream discovery result.

## Contract decision

The change removes the combined string-keyed `${errorCode}_${String(directory === root)}` blocker table. The platform code is classified at one boundary into `filesystem_failure_code_missing`, `filesystem_failure_code_not_directory`, or `filesystem_failure_code_other`. Each judgment owns a `continueWith` operation. Existing upstream blocker variants and the existing discovery judgment factory are reused; no competing core ADT is introduced.

## Remaining limitation

The operating-system boundary still reads Node's error `code` and uses a fallback for unrecognized codes. Root-versus-nested path distinction is represented by a separate location judgment, although its platform-boundary factory still derives the variant from path equality. Therefore this phase does not claim zero primitive reasoning; it narrows and names the error classification boundary. A follow-up should move the error-code judgment into an approved upstream contract only after auditing the existing upstream interfaces for an appropriate owner.

`packages/core/src/types/upstream/collections.ts` remains empty.
