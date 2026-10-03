# Phase 671 — AST Interface Highest Frontier

## Objective

Raise the scanner/request frontier from implementation-oriented dispatch to a closed semantic interface. The change is architectural: syntax evidence is exposed as a contract + judgment + proof boundary, and request validation unions are refined through the relation-variant algebra rather than discriminant casts.

## Implemented

### 1. Closed Route Syntax Semantic Interface

Added `packages/core/src/compiler/scanner/lexer/routeAst/routeSyntaxSemanticInterface.ts`.

The interface now carries:

- `RouteSyntaxSemanticContract`
- `RouteSyntaxSemanticJudgment`
- closed `RouteSyntaxSemanticFact[]`
- discharged `RouteSyntaxSemanticProof[]`
- explicit least-fixed-point / semantic-rewrite-engine reasoning metadata

The route AST index exports this interface, so it is a reachable compiler boundary rather than an orphan helper.

### 2. Request AST ADT refinement

`packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts` now uses the closed `RelationVariant` / `relationVariantValue` refinement path for validation-rule variants and nested validation variants.

Removed the `as Extract<...>` authority leak from this frontier. The dispatch table receives a typed refinement witness rather than a discriminant followed by a cast.

### 3. Source vocabulary remains evidence

Laravel's route method `any` remains in the source-language vocabulary where it denotes Laravel's actual `Route::any` semantics. It is not treated as the TypeScript `any` type. Audits therefore distinguish source-language evidence from host-language semantic authority.

### 4. Inactive-file vacuum

Phase 525 audit was rerun after the new interface was exported. Result:

- `candidates=[]`
- `remainingNonEmptyCandidates=[]`
- `allCandidatesEmpty=true`

No proven inactive non-test production file remains in the audited vacuum set.

## Validation

Phase 671 audit: PASS.

Phase 670 audit: PASS.

Phase 669 audit: PASS.

Phase 668 audit: PASS.

Phase 667 audit: PASS.

Phase 525 inactive-file vacuum: PASS.

Production TypeScript transpilation:

- 1,690 production TypeScript files scanned
- 0 transpilation failures

Full `tsc --noEmit` remains environment-blocked only by unavailable `node` and `vitest/globals` type definitions. No new TypeScript syntax/type diagnostic was observed after the Phase 671 changes.

## AST-level leak trace

A TypeScript AST scan of `packages/core/src` (excluding `.d.ts` and `.test.` files) reports the remaining semantic-authority frontier as:

- `if`: 351
- `while/do`: 3
- `for/of`: 94; classic `for`: 6
- `switch`: 36
- `undefined` identifier: 64
- `??`: 42
- strict equality operators: 391
- `as unknown`: 8
- `new Set`: 13
- `new Map`: 37
- TypeScript `any` keyword: 53
- optional/question tokens: 782
- `null` literal: 40
- `map/filter/reduce/flatMap` call-property nodes: 0

These are syntax-tree counts, not raw-text counts. They avoid the previous false positives from comments and source-language strings.

## Next highest-value frontier

The remaining work should continue by semantic layer, not by mechanical token substitution:

1. resolver graph contracts and candidate/conflict edges
2. upstream AST mapping contracts and typed provenance/refinement witnesses
3. analysis/CFG/SSA judgments with least-fixed-point closure and derivation witnesses
4. semantic type lowering with explicit legality/type-conversion contracts
5. target projection legality and preservation proofs
6. remaining parser adapters and syntax-error algebra
7. IR/projector/generator authority boundaries

The target architecture is:

`Laravel source evidence -> closed source AST -> scanner evidence interface -> upstream semantic AST -> resolver graph -> fixed-point analysis -> semantic type lowering -> proof-carrying rewrite -> target legality/interface -> Next.js/TypeScript projection`.

## Architectural references used for this phase

- Tree-sitter is treated as a concrete/incremental parsing substrate, not the semantic authority.
- MLIR contributes the interface + conversion-target + rewrite-pattern + type-converter model.
- Soufflé contributes typed relation declarations and relational execution semantics.
- SeaHorn contributes explicit syntax/operational/verification separation and Horn-clause verification boundaries.
- Alive2 contributes refinement/translation-validation thinking.
- CompCert contributes explicit semantic-preservation contracts between compiler stages.
- K/Maude/Spoofax contribute executable rewriting and typed transformation-rule ideas.
- Circular Reference Attribute Grammars contribute declarative remote dependencies and circular fixed-point evaluation.
- WebAssembly WIT contributes the principle that an interface is a typed contract boundary rather than an implementation of behavior.
- Flix/Nemo/Ascent/Datafrog/Differential Dataflow/other Datalog systems reinforce relation-first fixed-point computation.
- Graal/CIRCT reinforce graph IR and dialect/interface layering for multi-stage transformations.

The implementation goal is therefore not to imitate any single system, but to combine their strongest boundary concepts into RouteSync's domain-specific semantic algebra.
