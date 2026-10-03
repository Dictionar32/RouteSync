# Phase 600 — Semantic Transformation / Declarative IR Frontier

RouteSync is treated as a compiler-style semantic transformation for routing:

`Laravel source ecosystem → lexical/syntax evidence → semantic relations → fixed-point/rewrite closure → canonical routing IR → Next.js target ecosystem`.

## Research basis

The cutover follows the architectural direction documented by:

- Soufflé: relations and Datalog rules express facts and derived facts declaratively.
- MLIR PDLL/DRR: pattern matching and rewriting are represented as declarative match/rewrite rules rather than hand-written host control flow.
- WebAssembly: validation is specified as declarative typing constraints over abstract syntax.
- Statix: name/scope resolution is represented with scope graphs and constraints.
- CompCert: transformations are organized around formal semantics and preservation between intermediate representations.
- egglog: equality saturation and Datalog can share one relational/rewrite engine.
- CIRCT: a canonical MLIR-based IR acts as the hub through progressive lowering.

## Changes

### Semantic IR lowering

`compiler/ir/ContractIRTypeBuilder.ts` was converted from a class/handler-dispatch implementation into an immutable builder witness backed by lowering relations and structural projections. Primitive/reference/optional/nullable/collection/object/union/unknown lowering is selected from the declarative lowering relation.

### Lowering relation kernel

`compiler/ir/semanticIRLoweringRelations.ts` no longer uses array `.map`, `.find`, or `??` for semantic dispatch. Rule families are projected through relation operations and lowering results are consumed as `RelationOption` witnesses.

### Mapper dependency extraction

`ir/domain/ResourceMapperBuilder.ts` was converted to relation traversal and relation-backed dependency accumulation. Host `Set`, `for`, `.filter`, `.map`, and explicit `undefined` construction were removed from this frontier. Type dependency facts are now generated as relation tuples and solved by rewrite rules.

### Field projection

`ir/domain/field-type/fieldTransform.ts` now expresses nullable-to-optional projection through relation presence instead of an `if` branch.

### Consumer migration

`ir/ContractIRBuilder.ts` now obtains the mapper builder through `createResourceMapperBuilder()` instead of constructing the old mapper class.

### Dead-file vacuum

The following production files were verified to have no active source imports and were removed:

- `packages/core/src/types/__archive__/legacyFieldAdapter.ts`
- `packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts`
- `packages/core/src/compiler/domain/common/ManifestArtifactLowerer.ts`
- `packages/core/src/semantic/plugins/MethodReturnResolver.ts`

Historical documentation may still mention these names; those mentions are archival references, not active imports.

## Audit

`PHASE600_SEMANTIC_TRANSFORMATION_AUDIT.json` records the AST-aware counts.

The newly cut semantic-lowering frontier files have zero occurrences of the banned host constructs audited by the project: `if`, `while`, `for`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `null`, `??`, `===`, `!==`, `as unknown`, `Set`, `Map`, `any`, `new`, and ternary expressions.

The repository as a whole is **not yet zero**. The remaining concentration is still in broader IR orchestration, scanner/lexer descendants, resolver plugins, AST/upstream adapters, and older generator/contract surfaces. Those remain explicit next cutover targets rather than being hidden by the audit.

## Validation

All modified production files transpile through the TypeScript parser with zero diagnostics. The repository-wide typecheck remains environment-limited by missing Node/Vitest type definitions; no modified-file parse error is being conflated with that environment failure.
