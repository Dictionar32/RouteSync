# Phase 2716 — Fully Typed AST ADT Runtime Scanner Operations

## Scope

This phase moves one coherent syntax-to-domain-expression operation slice out of `compiler/scanner/operations` into `compiler/semantic`. It reuses existing upstream contracts and AST ADTs. No relation foundation, generic relation helper, or parallel identity model was introduced.

## Source changes

Moved implementations:

- `packages/core/src/compiler/scanner/operations/expressionAstCanonical.ts` → `packages/core/src/compiler/semantic/expressionAstCanonical.ts`
- `packages/core/src/compiler/scanner/operations/expressionProducer.ts` → `packages/core/src/compiler/semantic/expressionProducer.ts`
- `packages/core/src/compiler/scanner/operations/propertyProducer.ts` → `packages/core/src/compiler/semantic/propertyProducer.ts`

Updated all known source consumers:

- `compiler/semantic/sourceAstSemanticProducer.ts`
- `compiler/scanner/modelRelationFactsProducer.ts`
- `compiler/scanner/operations/requestProducer.ts`
- `compiler/scanner/operations/resourceProducer.ts`
- `compiler/scanner/operations/resourceFieldProducer.ts`
- `compiler/scanner/subscanners/requestProducer.ts`

The three moved operations are typed against existing upstream interfaces and use immutable object exports:

```ts
export const expressionFromPhpAst:
  ExpressionFromPhpAstOperationInterface<PhpAstValue> = Object.freeze({
    project: input => phpAstExpressionSemanticAuthority.derive({
      kind: 'php_ast_expression_evidence',
      evidence: input.syntax,
      sourceFile: input.sourceFile,
      classContext: { kind: 'none' },
    }),
  });
```

`expressionProducer`, `expressionAstFromPhpAst`, and `propertyProducer` follow the same `export const name: ExistingInterface = Object.freeze({...})` pattern. Their behavior and upstream result ADTs were retained. No exported function was introduced in the moved operations.

## CLI → upstream manifest runtime trace

The current runtime path was traced from source:

```text
packages/cli/src/commands/scan.ts / commands/sync.ts
  → CLI composition supplied to the command
  → RouteSyncCliUpstreamCompositionFactory.compose(...)
  → requestTypeDerivationProductionPipelineAssembler.assemble(...)
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → manifestScanOperation.scan(input)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → source project identity canonicalization
  → controller source discovery
  → source document acquisition and identity binding
  → PHP source invocation / syntax evidence
  → invocation semantic judgment and inventory authority
  → manifestBuilderOperationPreparation.prepare(input).build()
  → complete manifest judgment or manifest_builder_blocked
  → CLI projects only a complete manifest through the downstream semantic pipeline
```

Relevant source files:

- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/commands/sync.ts`
- `packages/cli/src/upstreamCompositionFactory.ts`
- `packages/cli/src/manifestScanOperationInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`
- `packages/core/src/compiler/frontend/php/sourceAstSyntaxParser.ts`
- `packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts`

Fail-closed behavior must remain intact: project identity blocked, source identity rejected, source discovery blocked, inventory rejected, manifest builder blocked, or semantic projection blocked must not be projected as success. AST construction is syntax evidence, not a substitute for semantic judgment or manifest authority.

## Static audit

Run:

```bash
npm run audit:phase2716-semantic-operation-ownership
```

The audit passed:

- all three implementations exist under `compiler/semantic`;
- old scanner implementation paths no longer exist;
- all nine changed/import-audited TypeScript files have no unresolved relative imports;
- all six CLI trace files exist;
- the moved files use frozen interface-typed objects and contain no `export function`;
- no relation foundation was introduced.

## External references reviewed

- TypeScript object/interface contracts: https://www.typescriptlang.org/docs/handbook/2/objects
- PHP AST parser upstream: https://github.com/glayzzle/php-parser

These support the interface-first contract and the single-owner PHP AST direction. They do not prove RouteSync's runtime correctness by themselves.

## Explicitly incomplete

This phase does **not** claim that `compiler/scanner` is wiring-only. The scanner still contains binders, descriptors, operations, resolvers, semantic code, subscanners, symbols, and upstream adapters. It also still contains exported function/arrow declarations beyond the migrated slice. Those need ownership-by-ownership migration with consumer tracing, not blind syntax replacement.

Typecheck was attempted with the globally available `tsc`, but failed before meaningful project checking because dependencies/type definitions are absent (`node_modules` missing) and the globally available compiler rejects configured target/lib values. Vitest, build, and CLI scan/sync end-to-end were not run. The PASS result is a structural/import audit only.
