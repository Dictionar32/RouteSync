# Phase 664 — AST Cross-Stage Refinement Proof Interface

## Objective

Elevate the Phase 663 closed AST stage judgment into a cross-stage refinement
interface. A stage judgment now carries explicit proof obligations for the
transition into the next semantic stage instead of treating derivation
witnesses as the terminal authority.

## Closed model

```text
source syntax
    -> scanner evidence
    -> upstream mapping
    -> resolver graph
    -> analysis
    -> semantic type lowering
    -> target projection

stage port
  -> closed judgment
     -> facts
     -> derivation witnesses
     -> preservation relations
     -> proof obligations
     -> declarative fixed-point reasoning
```

Proof obligations are closed ADT variants:

- scanner -> mapping
- mapping -> resolver
- resolver -> analysis
- analysis -> semantic type lowering
- semantic type lowering -> target projection

The target projection is terminal and therefore has no outgoing transition
obligation.

## Architectural consequence

RouteSync no longer treats a stage boundary as a typed bag of facts. The
boundary is a semantic judgment with:

1. stage contract;
2. stage facts;
3. derivation witnesses;
4. preservation relations;
5. cross-stage refinement obligations;
6. declarative relation-rewrite fixed-point reasoning;
7. closed authority marker.

This follows the useful architectural ideas found in MLIR interfaces and
pattern-based dialect conversion, K's rewrite semantics, Spoofax/Statix's
constraint solving and scope relations, Alive2's refinement checking, and
CompCert's semantic-preservation structure. These systems are not copied;
their common principle is made explicit in RouteSync's own ADT algebra.

## Scanner/resolver frontier

The remaining implementation frontier is no longer the stage contract itself.
The next refactoring targets are concrete scanner/resolver adapters that still
use host-language absence/narrowing syntax, especially optional chaining and
non-null assertions in response/resource/query detectors, and generic
candidate APIs in the rewrite solver.

Source-language spellings such as PHP `null`, `===`, `!==`, `??`, and the
semantic word `any` remain legitimate evidence vocabulary when they describe
Laravel/PHP syntax. They must not become host-language semantic authority.

## Inactive-file vacuum

Phase 525 audit remains clean after the Phase 664 changes:

```json
{"candidates":[],"remainingNonEmptyCandidates":[],"allCandidatesEmpty":true}
```

Legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain
zero-byte compatibility remnants.

## Verification

- Phase 664 audit: PASS
- Phase 525 inactive-file vacuum: PASS
- targeted TypeScript transpilation: PASS
- full `tsc --noEmit`: still environment-blocked by missing `node` and
  `vitest/globals` type definitions; this is not presented as a successful
  full typecheck.
