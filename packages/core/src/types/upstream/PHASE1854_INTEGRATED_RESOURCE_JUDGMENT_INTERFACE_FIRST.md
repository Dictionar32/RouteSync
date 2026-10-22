# Phase 1854 — Integrated Resource Judgment, Interface First

## Scope

This phase strengthens the existing upstream resource-binding semantic model and the existing `LaravelResourceScannerInterface`. It does not rebuild the CLI pipeline and does not recreate the retired `subscanners/ResourceScanner.ts`.

## Interface changes

- `ResourceModelBindingSemanticJudgmentModelInterface` advances to contract version 2.
- The model now explicitly declares outcome formation for zero, one, and multiple candidates; stable whole-batch closure; conservative handling of non-stable subjects; provenance preservation; and integrated controller-scan input requirements.
- `LaravelResourceScannerInterface` and `LaravelResourceScanJudgment` advance to contract version 11.
- `LaravelResourceIntegratedResponseContract` defines the invariants for resolved projection, rejected judgment preservation, source ordering, complete controller invocation integration, and candidate/relation provenance.
- The scanner implementation is wired to the canonical upstream judgment model and integrated response contract.
- The upstream barrel exports the existing semantic model and its type.

## Trace findings retained as explicit boundaries

- CLI invocation composition remains `buildManifestWithInvocationPipeline`.
- `laravelSourceAstPipeline` continues to invoke `laravelResourceScanner.scan`.
- `subscanners/ResourceScanner.ts` remains absent.
- `subscanners/resourceProducer.ts` is still a production dependency of `laravelResourceScanner.ts`; it must not be emptied until its projection responsibility is migrated and all consumers are re-traced.
- `resourceModelBindingAuthority.ts` still performs runtime candidate materialization, ADT outcome construction, fixed-point iteration, and cycle detection. This phase declares those semantic invariants upstream but does not claim that runtime reasoning has already been eliminated.

## Verification

Run:

```sh
node scripts/audits/audit-phase1854-integrated-resource-judgment-interface-first.cjs
node scripts/audits/test-phase1853-resource-scanner-retirement.cjs
```

These are static source audits only. No build, TypeScript typecheck, or E2E is claimed by this phase.
