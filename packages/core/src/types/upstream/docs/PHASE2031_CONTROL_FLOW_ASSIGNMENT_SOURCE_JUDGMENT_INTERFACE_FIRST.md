# Phase 2031 — Control-flow and assignment source-judgment preservation

## Trace finding

The previous phase preserved callable-list and statement-sequence judgments, but conditional, loop, switch, assignment-parts, and assignment-target paths still reconstructed malformed outcomes as generic `Error` messages. That erased the original source judgment at the legacy parser boundary.

## Interface-first change

`scannerAstSourceFailureInterface.ts` now extends the existing source-failure ADT with variants carrying the original upstream judgment for:

- malformed conditional statements;
- malformed collection, pretest, and counted iteration statements (including the loop control kind);
- malformed switch statements;
- malformed assignment decomposition and assignment-target judgments;
- assignment decomposition and target contract violations.

The AST runtime now forwards these judgments through `AstSourceJudgmentFailureError` instead of recreating message-only errors. Existing semantic authorities remain the source of truth; no duplicate classifier or relation/foundation subscanner was introduced.

## Preserved boundaries

The canonical Laravel invocation semantic judgment and integrated response wiring remain unchanged. `laravelControllerScanner.ts` continues forwarding `invocationJudgment` and `responseJudgment` to `astProjection.judge`.

## Verification scope

- Phase 2031 structural audit: 12/12 checks passed.
- Phase 2030 structural audit: 11/11 checks passed.
- `package.json` JSON parsing passed.
- TypeScript transpile syntax checks passed for the changed TypeScript files.
- Full TypeScript type-check, package build, and integration tests were not run.
