# Phase 1439 — Interface-first expression judgment

## Architectural change

The scanner no longer wires directly to the positional `resolveExpressionStructureJudgment(...)` helper. The public boundary is now `ExpressionStructureJudgmentInterface`, declared in `scannerExpressionJudgmentInterface.ts`, with a named `ExpressionStructureJudgmentRequest` contract. `expressionStructureJudgmentAuthority` is the upstream implementation of that interface and owns candidate arbitration plus closed-judgment construction.

## Evidence and judgment contract

`ExpressionStructureJudgment` represents malformed evidence with `ExpressionEvidenceLocation<Token>` (`token` evidence or `end_of_source`) instead of exposing the provider's raw numeric cursor. Candidate resolvers may still use cursor values internally to slice token sequences, but that representation is translated to source evidence when the judgment is closed. Runtime diagnostics consume the closed location and do not reconstruct the cursor.

## Required flow

`source evidence → semantic candidate algebra → closed judgment → judgment interface → provider/runtime wiring → executor → AST projection`

The PHP provider supplies candidate evidence and maps selected candidate values to neutral structure. For terminal cases it supplies only `ExpressionStructureTerminalEvidence`; it does not supply the selected rule identity, arbitration attempts, or a closed judgment. The upstream authority closes terminal evidence into the canonical judgment, attaching candidate identity and the proof trail. The provider does not own candidate ordering or manufacture standard judgment variants. The runtime handles the closed union; the projector only receives a selected structure.

## Remaining frontier

- Other scanner helpers still expose numeric cursors and sentinel values for legacy AST classification paths; they are not claimed migrated by this phase.
- The interface, algebra, and judgment implementation type-check in isolation. Full provider/runtime type-checking still reports unrelated pre-existing errors in imported scanner/query/dataflow modules; full package build and integration tests must be run in an environment with the repository's declared dependencies installed.
