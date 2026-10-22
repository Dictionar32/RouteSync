# Phase 2502 — Resource Closure Unsupported Judgment

## Root cause

The Resource expression authority used runtime exceptions for `while`, `switch`, `unset`, and `include` statements because `ResourceClosureStatement` did not model those source variants. This forced unsupported syntax into an exceptional control path instead of returning a typed semantic result.

## Change

- Evolved the existing `ResourceClosureStatement` ADT with `unsupported_statement` and a closed `statementKind` union for the four unsupported PHP statement forms.
- Replaced all four throws in `resourceExpressionSemanticAuthority.ts` with explicit ADT values.
- Kept the existing upstream `ResourceAstExpressionMappingAuthorityInterface` and runtime operation interface; no parallel authority or operation interface was introduced.
- Added `scripts/audits/audit-phase2502-resource-closure-unsupported-judgment.cjs` to assert the closed contract and typed adapter boundary.

## Verification

- Phase 2502 audit: 10/10 assertions pass.
- Phase 2501 audit: 16/16 assertions pass.
- Full project typecheck, build, Vitest, and CLI end-to-end checks were not run.

## Still open

- `resourceExpressionSemanticAuthority.ts` still imports `semantic/relations`; this phase does not claim relation-free authority.
- The wider scanner still has relation imports and remaining `subscanners` consumers. A dependency-wide retirement requires tracing each decision to its existing upstream owner before removal.
- Some consumers still pass `SourceFile('<scanner>')`; end-to-end provenance propagation remains open.
