# Phase 1954 Interface-First Trace

## Trace

`LaravelControllerSourceInventory + CompletenessWitness + InvocationJudgments`
→ `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(input)`
→ `typed reasoning ADT from LaravelControllerInvocationSemanticJudgmentInventoryContract`
→ either receipt-bearing `validated` or non-empty `rejected` ADT
→ scanner boundary consumes `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`
→ AST/dataflow/manifest projection preserves the canonical judgments and integrated response.

## Findings

Phase 1953 exposed a gap: several reasoning rules were prose-valued string descriptions while `close()` hard-coded the corresponding policy. Phase 1954 models those policies as named typed rule interfaces and has the existing authority consume their values.

The rule contract now controls:

- project mismatch relation and rejection discriminant;
- witness kind and required obligation tuple;
- canonical source identity relation and maximum source occurrence;
- minimum and maximum judgment correspondence cardinality;
- missing, multiple, and orphan judgment rejection discriminants;
- outcome-preservation provenance attached to the closure receipt;
- rejected ADT discriminant and non-empty rejection ledger shape.

## Deliberate limit

A TypeScript interface is erased at runtime and cannot execute semantic reasoning by itself. The existing authority still interprets the contract. The intended boundary is not “no runtime”; it is “no duplicate semantic policy in scanner/CLI or untyped prose-only contract.” The authority remains the one execution point, and the receipt keeps the original judgment objects instead of rebuilding them.

## Relevant paths

- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts`
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts`
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

## Regression coverage

- Phase 1940–1954 audit scripts check the scanner, AST/ADT, invocation judgment, integrated-response, CLI composition, and inventory closure boundaries.
- Phase 1954 audit checks typed rule definitions, authority consumption, receipt outcome preservation, public exports, and version alignment.
