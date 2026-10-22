# Phase 2347 — Policy Blocker Execution Order

## Finding

Phase 2346 correctly added a typed `laravel_route_scan_policy_blocked` arm and propagated it to `LaravelSourceAstProjectionJudgment`. However, `executeLaravelSourceAstPipeline` invoked the route scanner only after running the resource scanner and response, service, middleware, and provider acquisition. A known blocked route policy therefore stopped final AST/manifest publication, but did not stop unrelated downstream scanner work from executing first.

The defect was execution ordering around an already-existing contract, not a missing semantic authority.

## Change

- Moved the existing `routeScanner.scan` call to immediately after the complete controller scan is available.
- Kept the existing `LaravelRouteScannerInterface`, `LaravelRouteScanOutcome`, and `LaravelSourceAstProjectionJudgment`; no duplicate interface or authority was added.
- Kept the exact route scan judgment and blocked policy evidence intact.
- On `laravel_route_scan_blocked` or `laravel_route_scan_policy_blocked`, the pipeline now returns before resource, response, service, middleware, provider, channel, and final `SourceAsts` projection work.
- The existing manifest builder continues to convert every non-complete projection to `manifest_builder_blocked`; CLI `scan` and `sync` already stop on that judgment before writing manifest/IR or invoking generators.

## Updated trace

`CLI scan/sync` → controller invocation composition → existing source-AST pipeline → controller scan → existing route scanner → effective policy executor / exact policy judgment → route-scan ADT → source-AST projection ADT → manifest-builder blocked judgment → CLI stop.

Route scanning is placed after controller scan because its canonical binding and policy inputs come from that complete controller judgment. It is placed before resource/response/service/middleware/provider scanning because those outputs are not inputs to the route policy judgment and must not execute after a known route-policy blocker.

## Validation

`node scripts/audits/audit-phase2347-policy-blocker-execution-order.cjs`: 14/14 checks passed. This is a static source-order and wiring audit, not a runtime test. TypeScript type-check, Vitest, CLI end-to-end, and build were not run. `npm run build` was not run.
