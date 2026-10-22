# Phase 2040 — Assignment Member and Static-Property Malformed Judgment, Interface First

## Trace finding

Phase 2039 closed malformed array-access evidence, but assignment-target resolution still flattened member and static-property recognizers to `resolved | unresolved` at the runtime wiring site. The canonical `ScannerAssignmentTargetInterface` already supports a shared evidence judgment ADT, so these two recognizers could bypass malformed source evidence even though the authority's final result supports `malformed`.

## Change

- Reused `AssignmentTargetEvidenceJudgment<Evidence, Token>` for member and static-property evidence; no new authority or subscanner was introduced.
- Added runtime evidence providers that preserve malformed member operator/property shapes and malformed static-property target shapes as typed data.
- Updated the canonical assignment-target resolver to propagate malformed member and static-property judgments instead of flattening them to `unresolved`.
- Changed assignment-target wiring to pass the typed judgments directly, removing the local `RelationOption` flattening for these two recognizers. The expression classifier and other legacy consumers still use `RelationOption`; this phase does not claim the whole scanner is relation-free.
- Kept Laravel invocation semantic judgment and integrated response wiring unchanged.

## Architecture

`source tokens → typed member/static-property evidence judgment → ScannerAssignmentTargetInterface → AssignmentTargetJudgment → AST source-failure boundary`

No `relation/foundation` subscanner was added.

## Verification boundary

The Phase 2040 audit checks the upstream contract, propagation, runtime wiring, and architectural constraints. It is a source-level audit, not a full TypeScript type-check or monorepo build.
