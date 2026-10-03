# Phase 633 — Scanner Capability + Execution Signature Relational Cutover

## Scope

This phase continues the semantic-authority migration toward declarative relations, explicit Presence, catalog dispatch, and rewrite/lowering boundaries.

## Changes

1. `packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts`
   - removed the semantic fallback payload type name `"any"`;
   - payload names are now derived deterministically from the resolved domain/action when the request boundary is not a FormRequest;
   - execution-signature construction receives an explicit `Presence<string>` witness.

2. `packages/core/src/types/domain/executionSignatures.ts`
   - replaced payload-mode `switch` dispatch with a declarative mode registry;
   - replaced optional/`undefined` payload-type representation with `Presence<string>`;
   - replaced mode construction branching with a catalog keyed by `RoutePayloadMode`;
   - signature creation now lowers through the same declarative mode relation.

3. Preserved unused-file paths by emptying, not deleting:
   - `packages/core/src/compiler/analysis/legacyFlow.ts`
   - `packages/cli/src/generators/legacy/RouteTypeEmitter.ts`

## Architectural direction

The affected path now follows:

```text
Laravel boundary evidence
  -> route capability relations
  -> Presence / payload witness
  -> RoutePayloadMode relation catalog
  -> execution-signature semantic ADT
  -> target lowering
```

The goal is not textual removal of control syntax from PHP evidence decoding. Parser/lexer constructs remain source evidence. The semantic authority is the relation catalog and ADT layer.

## Research basis

MLIR Dialect Conversion separates conversion targets, rewrite patterns, and optional type conversion. MLIR canonicalization repeatedly applies rewrite patterns toward a fixpoint. Declarative Rewrite Rules specify the transformation independently of imperative implementation details.

See:
- https://mlir.llvm.org/docs/DialectConversion/
- https://mlir.llvm.org/docs/Canonicalization/
- https://mlir.llvm.org/docs/DeclarativeRewrites/

Souffle's relational execution model computes mutually recursive relations through SCCs until a fixpoint, reinforcing the same direction for RouteSync semantic closure.

## Validation

- `node -v`: available (`v22.16.0`).
- Full repository `tsc --noEmit` remains blocked by missing environment type definitions:
  - `node`
  - `vitest/globals`
- No files were deleted.
- The two legacy paths above exist and are exactly 0 bytes.
- Production `capabilityResolution.ts` no longer contains the semantic payload fallback `"any"`.
