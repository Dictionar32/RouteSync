# Phase 700 — Semantic Model Interface Cutover

## Objective

Move the Eloquent model accessor boundary from a parallel parsed/scanned expression algebra into the canonical RouteSync upstream semantic AST, while removing legacy `ParsedAccessor`, `ParsedCast`, and `ParsedRelation` production contracts.

## Changes

- `ModelAccessorComputation.expression` now carries canonical upstream `Expression` and preserves its semantic result type and source provenance for rejected computations.
- The model accessor scanner no longer defines `ModelAccessorExpression` / `ModelAccessorMatchArm`.
- `modelAccessorExpressionMapper.ts` delegates PHP source evidence into the canonical upstream expression mapper.
- `modelAccessorCanonical.ts` now preserves the canonical expression instead of replacing accepted computations with `unsupported_expression`.
- Legacy production descriptor names were cut over to `ModelAccessorDescriptor`, `ModelCastDescriptor`, and `ModelRelationDescriptor`.
- Relation descriptor construction preserves the cardinality refinement in its return type rather than widening to a general cardinality and casting back down.
- The retired route-parameter descriptor remains an empty compatibility file; its production references remain absent.
- The inactive-file vacuum was rerun; no additional non-test TypeScript files are proven inactive under the existing reachability rule.

## Validation

`node scripts/audit-phase700-semantic-model-interface.cjs` returns `PASS` with:

- zero production references to `ParsedAccessor`, `ParsedCast`, `ParsedRelation`, `ModelAccessorExpression`, or `ModelAccessorMatchArm`;
- zero TypeScript transpile diagnostics for the changed files;
- canonical accessor mapper/resolver checks passing;
- model descriptor cutover checks passing;
- route-parameter legacy descriptor empty;
- inactive-file vacuum empty.

The full package build must still be verified in the user's dependency-complete workspace. The extracted checkpoint does not contain `node_modules`, so it cannot reproduce `tsup`/DTS locally here.

## Architecture consequence

The accessor boundary now follows the same direction as the compiler infrastructures studied for RouteSync:

- **MLIR**: generic interfaces and conversion targets decouple transformations from concrete dialect syntax; RouteSync should similarly expose semantic interfaces and explicit source-to-target conversion boundaries. See MLIR Interfaces and Dialect Conversion.
- **CodeQL**: recursive predicates are evaluated to a least fixed point; RouteSync relation closure should remain monotone and solver-driven rather than being encoded as imperative traversal state.
- **WebAssembly**: validity is specified declaratively over abstract syntax and the implementation algorithm is separate; RouteSync diagnostics and semantic gates should follow the same separation.
- **K / Maude**: semantics and transformations can be expressed as rewrite rules over algebraic terms; RouteSync's rewrite engine should operate on closed semantic ADTs, not source-token shapes.
- **egg / egglog**: equality saturation combines rewrite rules, e-classes, analysis, scheduling, and extraction; this is a useful model for semantic normalization and controlled lowering rather than hand-coded syntax branching.
- **SeaHorn / SMT**: higher-level semantic relations can be lowered into constraints/verification conditions and discharged by a solver; RouteSync diagnostics and route safety facts can use the same separation of fact generation from solving.
- **Alive2 / CompCert**: compiler correctness is strengthened by checking semantic preservation/refinement between representations; RouteSync should treat Laravel-to-Next.js lowering as a semantic preservation/refinement boundary.
- **Spoofax / scope-graph work**: syntax, static semantics, name binding, and transformations are separate declarative layers; this supports continuing to isolate lexer evidence from resolver graph semantics.
- **CIRCT / MLIR pipelines**: layered IRs and explicit lowering pipelines support domain-specific compiler construction; RouteSync should keep Laravel evidence, semantic IR, diagnostics, type lowering, and Next.js projection as distinct legal stages.
- **CRAG / circular attribute evaluation**: declarative attribute dependencies can be evaluated incrementally with circular fixed-point handling; this supports RouteSync's analysis layer as a relation/fixed-point system rather than nested host-language loops.

## Next frontier

The next high-value frontier is the scanner/resolver/AST boundary where remaining host-language control flow and weak types are still present. The migration target is a closed semantic algebra plus relation-driven refinement and fixed-point closure, followed by explicit semantic type lowering and target projection. Large active surfaces such as resource-group descriptors must be migrated in-place because they are still reachable; they should not be emptied merely to reduce textual counts.
