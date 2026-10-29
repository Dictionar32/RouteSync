# Phase 2764 — Object-style source-model runtime operations

## Runtime trace

CLI controller-invocation composition → CLI manifest scan operation → upstream manifest scanner → manifest builder preparation → AST pipeline → source-model catalog → semantic contract catalog projection → manifest ADT → validation/serialization/persistence.

## Object-style operation contract

The two source-model exports are now frozen objects with explicit interface types rather than callable function values:

- `modelSemanticNodeFromAst: ModelSemanticNodeFromAstOperation = Object.freeze({ kind, project(ast): ModelSemanticNode })`
- `semanticContractCatalogFromSourceCatalog: SemanticContractCatalogFromSourceCatalogOperation = Object.freeze({ kind, project(catalog): LaravelSemanticContractCatalog })`

Each interface declares a literal `kind` discriminator and a `project` method with explicit input and output types. Internal call sites now use `.project(...)`; the existing type-level contract tests assert the method's parameter and return types. This uses the requested `export const name: Interface = Object.freeze({ ... })` shape and avoids replacing domain outcomes with primitive fallback values.

## ADT/runtime invariants

- Model projection retains `model_semantic_node` and the source identity/source span.
- Source catalog projection retains the typed `LaravelSemanticContractCatalog` result.
- Upstream manifest blockers retain distinct AST and source-model discriminators.
- The operation object itself is frozen; `Object.freeze` is shallow, so nested domain values retain their own declared immutability contracts.

## Audit

Run `npm run audit:phase2764-object-style-source-model-operations`.

The audit parses the source-model runtime file with the TypeScript Compiler API and checks the absence of exported function declarations, interface-typed object literals, `Object.freeze`, explicit method signatures, input/output types, and ADT identity tags. It is a structural AST audit, not a replacement for a full semantic typecheck, unit suite, package build, or CLI end-to-end run.

## Official references reviewed

- TypeScript Handbook — Interfaces and call/method signatures: https://www.typescriptlang.org/docs/handbook/2/objects.html
- TypeScript Handbook — Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MDN — `Object.freeze()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
