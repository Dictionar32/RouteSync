# Phase 1482 — Contextual PHP Type Wiring

## Trace finding

Phase 1481 introduced `PhpTypeClassContext`, but the scanner did not consistently supply it. `resolveParameterType()` converted typed parameter AST into evidence without context, and recursive expression/statement mapping could drop context before closure parameter and return types reached `phpParameterTypeAlgebra`.

## Change

- `resourceProducer` derives class-context evidence from the scanner's resource class name and the selected base class, then passes it into method-body projection.
- `resolveParameterType` accepts optional `PhpTypeClassContext` and attaches it to primitive, named, and nullable evidence.
- `mapResourcePhpAstToUpstream` and `mapResourcePhpStatementsToSourceStatements` preserve context through recursive expressions, nested statements, closure parameters/return types, and anonymous method declarations.
- Anonymous classes form a context boundary: their members use the anonymous class's own context, including a known `extends` class as `parentClass`, rather than incorrectly inheriting the enclosing named class as `self`.
- `static` remains fail-closed until the target IR has a faithful late-static-binding representation.

## Verification

- `tools/audit-contextual-php-type-wiring-phase1482.mjs`: 8/8 static architecture checks passed.
- A strict TypeScript invocation over the relevant scanner entry points still fails with numerous diagnostics already present in scanner/runtime and domain files. The affected files contain unrelated pre-existing diagnostics as well, so this invocation is not a clean isolated compile proof.
- Vitest and package build were not run because the extracted workspace does not contain local dependencies (`node_modules`, `vitest`, `tsdown`).

## Boundaries / next work

The context currently uses the class/base-class names already supplied to `ResourceProducer`; this phase does not add PHP namespace/import resolution. Other scanner paths that lack declaration evidence intentionally remain context-free and must continue to fail closed for `self`/`parent`. Next, trace a shared class declaration evidence contract carrying canonical class identity, namespace/import environment, and declared parent relationship, then wire model/controller/request/service paths to it instead of synthesizing context independently.
