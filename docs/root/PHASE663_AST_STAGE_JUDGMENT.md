# Phase 663 — Closed AST Stage Judgment

## Goal

Elevate RouteSync's Phase 662 closed stage-preservation interface into a proof-carrying stage judgment boundary. A stage port is no longer a raw `(stage, contract, facts)` tuple. It is a closed semantic judgment carrying:

- the stage contract;
- canonical stage facts;
- declarative derivation witnesses for each emitted fact;
- preservation relations inherited from the stage contract;
- the fixed-point/rewrite reasoning mode;
- a closedness marker.

This makes scanner evidence, upstream mapping, resolver graph, analysis, semantic type lowering, and target projection all cross the same AST judgment interface.

## Architectural elevation

### Before

`stage port -> facts`

### After

`stage port -> closed stage judgment -> facts + derivation witnesses + preservation contract + reasoning mode`

The port no longer exposes a raw `facts` field. Consumers read the canonical judgment instead. The stage contract therefore becomes part of the semantic object being transported, rather than metadata sitting beside it.

## Why this is a higher model

This follows the useful architectural pattern seen across modern compiler/verification systems:

- MLIR interfaces separate generic transformations/analyses from concrete operation implementations, while dialect conversion combines legality, rewrite patterns, and type conversion.
- WebAssembly WIT/worlds make interfaces and dependencies explicit contracts rather than implementation behavior.
- CompCert treats semantic preservation as a compiler-level correctness property.
- Alive2 uses refinement/translation validation rather than trusting a transformation by construction.
- Rewrite/equality-saturation and Datalog-style systems treat semantic derivation as relations and fixed points instead of host control-flow authority.

RouteSync now moves the same principle one level upward: the AST stage boundary itself carries its semantic judgment and derivation witness.

## Verification

- `audit:phase663:ast-stage-judgment` PASS.
- Phase 525 inactive-file vacuum PASS: no non-test inactive candidates remain.
- Targeted TypeScript transpilation PASS for the changed stage interface and active semantic boundaries.
- Full `tsc --noEmit` remains dependency-blocked by missing `node` and `vitest/globals` type definitions; this is not presented as a full typecheck pass.
- Legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain zero-byte.

## Remaining frontier

The next elevation is to make derivation witnesses non-axiomatic: connect each stage judgment witness to explicit source-origin premises, resolver candidates, analysis dependencies, type refinements, and target obligations, then validate cross-stage refinement/preservation through the same rewrite/fixed-point engine.

The remaining `Record` and `as Extract<...>` uses in scanner/upstream adapters are type-level dispatch/narrowing surfaces; they are separate from the prohibited host control constructs and are candidates for the next closed eliminator/catalog layer.
