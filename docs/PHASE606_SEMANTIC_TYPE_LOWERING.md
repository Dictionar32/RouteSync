# Phase 606 — Semantic Type Lowering / Resolver Witness Cutover

Phase 606 continues the Route Contract compiler migration toward a relation-native semantic substrate.

## Research basis

The frontier follows the declarative pattern/rewrite model used by MLIR PDL/PDLL: matching and rewriting are represented as declarative operations rather than embedding semantic authority in host-language control flow. PDL explicitly models a matcher and a terminating rewrite, and PDL itself is an IR-level abstraction. The RouteSync analogue is semantic type/candidate facts -> solver -> witness/catamorphism -> target lowering.

## Changes

### PrimitiveResolver

The resolver already represented casts as a relation catalog. The missing `relationResolve` dependency was restored so the resolver's status derivation uses the canonical relation substrate rather than an accidental host dependency.

### Resolved semantic type catamorphism

The final `unknown` branch previously relied on a type assertion to manufacture the terminal visitor witness. The catamorphism now derives the `unknown` witness through the same relation refinement mechanism as every other semantic-type constructor. This removes a residual type-authority escape from the terminal dispatch path.

The semantic type path is therefore:

```text
resolved type fact
    -> relation refinement
    -> semantic visitor witness
    -> lowering operation relation
    -> TypeScript projection
```

No host `switch`, `if`, collection method, constructor, or host `Map`/`Set` is used in the modified frontier.

## Boundary distinction

Target-language vocabulary such as the emitted TypeScript strings `undefined` and `null` remains data describing the target projection. It is not a host-language absence sentinel. Likewise `PrimitiveKind` is semantic vocabulary in the IR, not a host primitive type authority.

## Validation

Modified semantic-type/resolver frontier: 5 files, zero audited banned constructs, zero transpilation diagnostics.

All non-test production TypeScript files under `packages/core/src`: 1,005 files, zero `transpileModule` diagnostics.

The repository-wide `tsc --noEmit --skipLibCheck` remains blocked before project checking by the environment's missing `@types/node` and `vitest/globals` type definitions.

Zero-byte production TypeScript files: 0.
