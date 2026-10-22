# RouteSync Phase2457 — Upstream Resource Evidence Boundary

## Change

The existing `LaravelResourceScannerInterface` already defines `relationEvidence` as source-backed facts supplied to the scanner. The source-AST pipeline previously passed `relationEvidence: []`, while `laravelResourceScanner.ts` silently rediscovered relation facts and appended them internally before calling `ResourceModelBindingJudgmentAuthority`.

This violated the existing contract's ownership boundary and made the apparent upstream input incomplete.

The pipeline now collects resource source evidence before the resource scan and passes its relation facts through the existing `LaravelResourceScannerInterface`. The resource scanner now passes only `input.relationEvidence` to the binding authority; it no longer silently enriches the authority input from its local source scan. No parallel interface was introduced.

## Explicitly unresolved

- The resource scanner still parses resource source a second time to build AST projection artifacts. This phase fixes evidence ownership, not duplicate parsing.
- `laravelSourceAstPipeline.ts` still directly invokes `ChannelScanner.scanCanonicalAsts(sourceProject)`; the existing `LaravelChannelScannerInterface` cannot yet be wired truthfully because source-backed client subscription evidence and a concrete `BroadcastChannelKindJudgmentAuthority` are not provided by the current pipeline.
- The pipeline still composes several scanner implementations from `subscanners`. Those are not considered retired by this phase.
- `semantic/relations` imports remain across scanner and upstream semantic implementations. This phase does not claim transitive removal.
- No TypeScript typecheck, package build, Vitest suite, or CLI end-to-end execution was run because this snapshot has no installed `node_modules`.

## Validation

Run `node scripts/audits/audit-phase2457-upstream-resource-evidence.cjs` for the scoped static audit. Its checks prove only the source-level contract wiring described above; they do not prove complete scanner migration.
