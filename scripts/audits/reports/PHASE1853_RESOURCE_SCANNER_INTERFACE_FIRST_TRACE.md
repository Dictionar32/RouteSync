# Phase 1853 — Resource Scanner Interface-First Trace

## Scope

Continue from Phase 1852 without rebuilding the CLI pipeline. Inspect the upstream resource-scanner contract, the Laravel source-AST pipeline, the CLI composition entry, and the legacy subscanner retirement gate before editing implementation ownership.

## Trace findings

1. CLI composition already routes `scan`, `sync`, and drift auditing through `buildManifestWithInvocationPipeline`; this phase does not replace or rebuild that path.
2. `laravelSourceAstPipeline.ts` directly consumes `laravelResourceScanner.scan(...)` and publishes `resourceScan`, `resources`, and `resourceDefinitions`. The resource scanner is therefore still a live pipeline boundary.
3. `packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts` is already absent. Do not recreate it.
4. `packages/core/src/compiler/scanner/subscanners/resourceProducer.ts` is not unused: `wiring/laravelResourceScanner.ts` imports it and calls `produceResult` to project a resolved semantic binding into `ResourceAst` and `ResourceDefinition`.
5. `LaravelResourceScannerInterface` already accepts the complete `LaravelControllerScanJudgment`, and the scanner passes that same judgment to the batch binding authority. This preserves source-correlated integrated invocation responses rather than detaching controller evidence.
6. `resourceModelBindingSemanticInterface.ts` defines the precedence and judgment model, but `resourceModelBindingAuthority.ts` still performs candidate derivation, outcome classification, and fixed-point iteration at runtime. The authority is not yet a thin executor of a fully closed upstream judgment contract.
7. `laravelSubscannerRetirementInterface.ts` correctly makes deletion conditional on zero production consumers and a passing audit. Emptying `resourceProducer` now would break the active resource projection path.

## Decision

- Keep the already-changed CLI pipeline unchanged.
- Keep `ResourceScanner.ts` absent; it must not be recreated.
- Do not empty `resourceProducer.ts` yet because a production consumer is proven by direct import and invocation.
- The next implementation change must be interface-first: close candidate/outcome/fixed-point semantics in the upstream resource-binding semantic contract and make `resourceModelBindingAuthority.ts` execute that contract without reclassifying judgments locally.
- Only after projection responsibility has an upstream owner and all production imports are migrated can `resourceProducer.ts` be emptied under the repository's legacy-file policy.

## Audit

Run:

```sh
node scripts/audits/test-phase1853-resource-scanner-retirement.cjs
```

Expected result: 8/8 static checks. This audit verifies file/consumer boundaries; it does not prove TypeScript compilation or E2E correctness.

## Verification limits

No build, typecheck, or E2E run was performed. The next phase still needs a semantic-model implementation, not another CLI wiring change.
