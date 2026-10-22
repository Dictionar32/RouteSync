# Phase 1876 — Laravel Invocation Judgment and Controller Subscanner Retirement (Interface First)

## Trace and decision

The canonical path is `laravelSourceAstPipeline` → `LaravelControllerScannerInterface.scan` → `LaravelControllerScanJudgment` → route/resource scanner consumers. The canonical controller artifact retains one `LaravelControllerInvocationSemanticJudgmentInterface`; the judgment is an outcome-correlated value whose `response` is exactly one integrated-response ADT member. The authority preserves distinct `not_connected`, `source_binding_rejected`, `complete`, and `blocked` outcomes.

A source trace found that `packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts` had no production call sites: `RouteScanner.ts` imported it but did not reference it, and the active source-AST pipeline already called the canonical `laravelControllerScanner`. The class was therefore not an authority required by downstream code; it was a dead duplicate scanner entry.

## Interface-first changes

- Evolved `LaravelControllerInvocationSemanticJudgmentContract` to v7 with an explicit integrated-response subject-closure rule. The existing four-outcome discriminated union and authority-owned identity judgments remain intact.
- Evolved `LaravelControllerInvocationSemanticBoundaryContract` to v47 and changed the retirement rule to describe the legacy controller entry as retired after canonical correlated artifacts became the production path.
- Deleted the unused `ControllerScanner.ts` legacy subscanner, removed its barrel export, and removed the orphan import from legacy `RouteScanner.ts`.
- Added a source audit that traces production imports/references and asserts the canonical scanner retains the exact judgment and response.

## Scope and validation

This phase retires only the unused `ControllerScanner` entry. It does **not** claim that the whole `subscanners/` directory or `semantic/relations/` has been retired; other subscanner entries and relation helpers remain and require their own consumer traces. No full build or TypeScript compilation was run. Validation is limited to focused source audits, syntax checks, JSON parsing, and archive integrity.

## External semantic references

- TypeScript Handbook, [Narrowing and discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing): tagged unions can represent each outcome as a distinct member and narrow its available fields.
- Laravel 13 docs, [Routing](https://laravel.com/framework/docs/13.x/routing): route declarations target controller class/action pairs, supporting keeping controller-source semantics distinct from route-to-controller binding semantics.

## Audit results

- Phase 1876 retirement/interface audit: 12/12.
- Phase 1875 closed-input audit: 11/11.
- Invocation judgment/source identity/integrated response regression audits from Phases 1874–1869: 73/73.
- Controller integrated-response preservation audit: 8/8.
- Lossless invocation/integrated-response/front-end traversal regression audits from Phases 1808–1805: 55/55.
- Updated controller scanner migration and semantic judgment trace audits: 19/19.
- Updated controller query-evidence audits (Phases 897, 967, 802): 32/32.

**Total focused checks passed: 210/210.** Also passed: Node syntax checks for changed audit scripts, `package.json` JSON parsing, and a production-source trace confirming no remaining imports, exports, or calls to the deleted legacy controller scanner. This is not a TypeScript build result.
