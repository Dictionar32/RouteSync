# Phase 556 — Relational Substrate Frontier

Phase 556 continues the scanner/lexer/resolver cutover by removing the remaining host-absence sentinel leakage found in the scanner source surface and by closing the generic compiler relational sequence boundary.

## Research basis

The architectural direction follows declarative pattern/constraint systems rather than imperative semantic dispatch:

- Statix / Spoofax: scope-graph relations and constraint solving for name resolution.
- MLIR PDL/PDLL/DRR: explicit match/rewrite programs and a generic rewrite driver.
- Fixed-point/equality-saturation systems: semantic facts are accumulated until closure rather than being encoded as host-language control flow.

MLIR's PDL represents pattern matching itself as IR and terminates patterns with a rewrite operation. PDLL separates match and rewrite sections. The RouteSync direction applies the same separation to source facts, candidate relations, witness selection, and semantic projection.

## Changes

### Scanner / lexer

`routeResourceDeclarationAst.ts` no longer uses explicit `undefined`-typed absence fields or a host `Map` lookup as the semantic authority. Resource middleware selection is represented as a relation-backed `Presence` result.

`routeBindingDeclarationAst.ts` now models the optional custom binding key with an optional property and presence-fold construction instead of an explicit `undefined` type/value.

### Generic relational substrate

`compiler/relational/sequence.ts` no longer exposes `firstRelation` as `T | undefined`. It now returns the existing relational `RelationStep<T>` algebra (`emit` / `stop`). This removes an absence sentinel from the generic relation layer itself.

## Audit

`audit-phase556-relational-substrate-frontier.cjs` scans:

- compiler scanner
- compiler constraints
- TypeScript lowering adapter
- semantic resolver/kernel
- compiler relational substrate

The AST audit treats PHP source-language `null` evidence separately from host semantic absence. It rejects host `if`, `for`, `while`, `switch`, ternary, collection method dispatch, nullish/equality/logical operators, `undefined`, `never`, `as unknown`, `trim`, `slice`, and the other declared host constructs.
