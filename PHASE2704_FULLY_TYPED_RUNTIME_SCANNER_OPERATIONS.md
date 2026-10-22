# Phase 2704 — Fully Typed Runtime Scanner Operations

## Purpose

Audit and refactor the actual upstream CLI manifest path so runtime operations are exposed as interface-typed objects rather than exported function declarations or loose exported function-valued constants. This phase also corrects a stale PHP expression-parser boundary that still attempted to lower canonical `PhpAstNode` values into the retired `FieldNode` model.

## Runtime trace: upstream CLI manifest

```text
CLI scan/sync
  -> routeSyncStandaloneCompositionLoader.load
  -> routeSyncCliUpstreamCompositionFactory.create/compose
  -> routeSyncCliManifestScanOperationFactory.create
  -> manifestScanOperation.scan(input)
  -> controllerInvocationManifestCompositionAuthority.compose(input)
  -> source-project identity canonicalization
  -> controller source discovery (closed inventory; symbolic links block)
  -> source document read + requested/canonical identity binding
  -> phpSourceInvocationSemanticPipelineOperations.analyzeBatch
  -> phpSourceFrontendAstAdapter.extract
  -> upstream source extraction validation / source inventory / name resolution
  -> invocation semantic judgment batch closure
  -> inventory authority closes source-to-judgment correspondence
  -> manifestBuilderOperationPreparation.prepare(receipt).build()
  -> request-type semantic pipeline
  -> source evidence inventory / action & response contribution operations
  -> requestTypeDerivationProofVerifier.verify
  -> coverage / decision / authority / integrity
  -> manifest projection only if upstream authorities permit it
```

A separate PHP expression parsing entrypoint now follows this canonical path:

```text
phpCodeParsingOperation.parseExpression
  -> phpExpressionParsingOperation.parse
  -> phpAstNodeMappingOperation.map
  -> phpNodeSourceSliceOperation.slice
  -> phpAstBoundaryAdapter.adaptJudgment
  -> phpGrammarMatchingOperation.match + typed callee operations
  -> canonical PhpAstNode
```

The expression path no longer uses the retired `FieldNode` lowering model.

## Source changes applied

1. `packages/cli/src/parsers/PhpCodeParser.ts`
   - Replaced the static class wrapper with `phpCodeParsingOperation: PhpCodeParsingOperationInterface`.
   - Returns canonical `PhpAstNode` rather than the retired `FieldNode` model.
2. `packages/cli/src/parsers/php/expressionParser.ts`
   - Exposes `phpExpressionParsingOperation: PhpExpressionParsingOperationInterface`.
   - Validates the assignment RHS grammar kind before passing it to the AST adapter; unsupported kinds fail as a parse-boundary error.
3. `packages/cli/src/parsers/php/nodeMapper.ts`
   - Removed legacy `foldPhpAstNode(..., FIELD_NODE_ALGEBRA)` from the runtime path.
   - Maps source grammar directly to canonical `PhpAstNode` through the upstream AST boundary adapter.
4. `packages/cli/src/parsers/php/sourceSlice.ts`, `boundaryAdapter.ts`, `ast/grammarCatamorphism.ts`, `ast/calleeCatamorphism.ts`
   - Replaced exported functions with interface-typed operation objects.
   - Internal recursion now uses typed grammar/callee dispatch operations.
5. `packages/core/src/compiler/semantic/request-type-derivation/actionContribution.ts`
   - Replaced exported `deriveRouteAction` function with `requestTypeRouteActionDerivation: RequestTypeRouteActionDerivationInterface`.
   - Explicitly typed action visitor results to preserve the full domain union.
6. `responseContribution.ts`
   - Replaced exported response derivation and resource-field functions with `requestTypeResponseContributionDerivation` and `requestTypeResourceResponseFieldProjection` interface-typed objects.
7. `requestTypeDerivationSourceEvidenceInventory.ts`
   - Removed loose exported function-valued aliases for identity keys, canonical identities, inventory, collision witnesses, and evidence keys.
   - Exposes the operations through `requestTypeDerivationSourceEvidenceInventory: RequestTypeDerivationSourceEvidenceInventoryInterface`.
8. `requestTypeDerivationProofVerifier.ts`
   - Converts incoming-source matching, AST/inventory checks, identity checks, conflict closure, conflict-group checks, and group-receipt replay to named operation objects with interface contracts.
   - Updates verifier and tests to call object methods.
   - Preserves fail-closed `verification_incomplete` results until the complete canonical-law set is independently checked.
9. `packages/core/src/compiler/scanner/subscanners/request-deriver/{actionDeriver.ts,responseDeriver.ts,index.ts}`
   - Updates public operation exports to the typed objects rather than retired function aliases.
10. `packages/sdk/tests/compiler.spec.ts` and PHP parser tests
    - Update callers to operation objects and assert the canonical `property_lookup` AST tag.
11. Added `scripts/audits/audit-phase2704-runtime-operation-objects.cjs` and package script `audit:phase2704-runtime-operation-objects`.

## Audit results

| Check | Result |
|---|---:|
| Phase 2659 identity-conflict policy alignment | 14/14 |
| Phase 2660 resource-resolution conflict witnesses | 10/10 |
| Phase 2661 CLI composition fail-closed | 6/6 |
| Phase 2703 upstream runtime interface operations | 9/9 |
| Phase 2704 runtime operation-object audit | 11/11 |
| TypeScript syntax transpilation of changed files | 24/24, no syntax diagnostics |
| Targeted core semantic type diagnostics in five changed files | 0 reported diagnostics in those five files |

These are source assertions and syntax transpilation, not full project validation. The targeted compiler run still reports dependency-graph diagnostics elsewhere. Full project `tsc` is blocked in this environment by missing workspace dependencies/type definitions and the globally installed TypeScript version not accepting the repository's `ES2025` config setting. The PHP parser dependency `php-parser` is not installed here, so parser/runtime tests were not run.

## Remaining semantic root blocker

`requestTypeDerivationProofVerifier.verify` still returns `verification_incomplete` for the supported receipt-replay and identity-conflict slices. The canonical contract declares **34 laws**; this phase does not independently verify all 34 laws. The system must remain fail-closed and must not claim a verified RequestType manifest from partial evidence.

Next work must implement an independent check for every canonical law against raw AST/input, source identity, resolution ledgers, producer receipts, judgment, decision, authority, and integrity, then run the real scan/sync integration suite with workspace dependencies installed.
