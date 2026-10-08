# Phase 676 — AST ADT Highest Boundary Closure

Phase 676 raises the remaining resolver-boundary and scanner evidence frontiers from helper-level normalization to explicit closed semantic interfaces.

## 1. Boundary basics becomes a semantic judgment

`packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts` now exposes:

- `RouteBoundaryBasicsSemanticInput`
- `RouteBoundaryBasicsFact`
- `RouteBoundaryBasicsJudgment`
- `resolveRouteBoundaryBasicsJudgment`
- `routeBoundaryBasicsInterface`

The semantic authority consumes `Presence<T>` evidence and returns a fixed-point, relation-rewrite judgment. The legacy `resolveRouteBoundaryBasics` is now only an authoring adapter to the closed result.

## 2. Resolver graph becomes a relation program

`resolverGraphSemanticInterface.ts` now has an explicit `ResolverGraphRelation` vocabulary and invokes the canonical semantic rewrite engine to close graph premises into mapping, domain, security, and CRUD resolution relations.

The graph remains a closed judgment with:

- mapping premise
- resolver facts
- typed edges
- least-fixed-point closure
- declarative relation/rewrite authority

## 3. Analysis dataflow becomes closed vocabulary

`astAnalysisInterface.ts` no longer models dataflow as free `subject: string` / `predicate: string` pairs.

It now defines `AstAnalysisDataflowRelation`:

- `reads`
- `writes`
- `depends_on`
- `flows_to`
- `dominates`

Analysis also consumes a typed `ResolverGraphSemanticJudgment` premise and carries semantic type as an explicit fact.

## 4. Scanner/query evidence closure

`queryEvidenceProducer.ts` had residual refinement casts and non-null assertions despite already being relation-driven. Those were replaced with `relationVariant`, `relationVariantValue`, and `relationOptionFold` witnesses.

`astClassifierEvidence.ts` similarly removed remaining non-null assertions at token/control/try-statement boundaries and replaced them with relation witnesses.

Source-language vocabulary such as PHP `===`, `null`, ternary, and coalesce remains represented as AST/domain data where it is part of the Laravel/PHP source model. It is not treated as TypeScript control flow.

## 5. Unused-file vacuum

Phase 525 inactive-file audit was rerun after Phase 676:

- candidates: `[]`
- remaining non-empty candidates: `[]`
- all candidates empty: `true`

No file was emptied because no inactive non-test production candidate was proven by the repository's current vacuum rule.

## 6. Validation

- Phase 676 AST authority audit: PASS
- Phase 525 inactive-file vacuum: PASS
- Production TypeScript transpilation: 1085 files, 0 failures
- `tsc --noEmit`: still environment-blocked only by missing `node` and `vitest/globals` type definitions.

## Architectural direction

The resulting direction is intentionally closer to interface-driven IR systems: semantic passes consume contracts, relations, rewrite rules, and proof-bearing judgments instead of implementation-level dispatch. This follows the useful separation seen in MLIR interfaces and dialect conversion, WebAssembly WIT's contract-first interface model, rewriting logic in Maude/K, and semantic preservation in verified compiler architectures.
