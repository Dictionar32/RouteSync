# Phase 2157 Trace

## Ownership defect

The previous call chain resolved validation entries and known error-response descriptors in `controllerBodyResolver.ts` before calling `controllerBodySemanticJudgmentAuthority`. The body authority then accepted `ControllerBodyResolution`, so its contract did not own the derivation it claimed to close.

## Corrected chain

`ControllerMethodAst.body (ControllerBodyAst)`
→ `controllerBodySemanticJudgmentAuthority.judge({ body: method.body, method, sourceIdentity })`
→ authority-owned validation-entry lowering with source provenance
→ authority-owned known error response mapping
→ authority-owned schema lowering
→ `ControllerBodySemanticJudgment`
→ existing action semantic publication
→ existing action runtime executor forwarding.

`ControllerBodyEvidenceProjection` retains only the statements/dataflow evidence required by the existing compiler projection. It no longer owns validation or error semantics.

## Boundaries preserved

- Invocation judgment and controller-wide integrated response remain source-correlated and separate from per-action body semantics.
- Request judgment remains owned by `laravelControllerRequestSemanticBindingAuthority`.
- Resource binding remains owned by `controllerResourceBindingAuthority`; publication migration is still an open item.
- No new authority, `relation/foundation`, or subscanner was introduced.

## Validation

See `PHASE2157_AUDIT.json`. Only source-level audit and syntax-only transpilation are used; full build/typecheck/Vitest are not claimed.

## Regression audit results

- Phase 2133 body authority: 18/18
- Phase 2136 inline validation closure: 20/20
- Phase 2137 body validation lowering: 15/15
- Phase 2138 schema provenance closure: 11/11
- Phase 2154 action judgment route wiring: 26/26
- Phase 2155 request derivation retirement: 18/18
- Phase 2156 response descriptor presence: 14/14
- Phase 2157 body authority ownership: 15/15

These are source-level audits. The four changed TypeScript files also passed syntax-only transpilation with zero diagnostics. Full build/typecheck/Vitest were not run.
