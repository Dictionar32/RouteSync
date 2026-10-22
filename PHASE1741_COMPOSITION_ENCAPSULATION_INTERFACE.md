# Phase 1741 — Composition Encapsulation Interface

## Trace finding

Phase 1740 added `InvocationSemanticIntegratedResponseCompositionInterface`, but exposed `pipeline`, `inventory`, and `publicationAuthority` as public properties. That made the composition object a dependency bag: a consumer could bypass `integrate` and invoke component authorities independently, contrary to the scanner's intended composition-only boundary.

## Interface-first correction

- Evolved `InvocationSemanticIntegratedResponseCompositionContract` from v1 to v2.
- The public composition interface now exposes only `kind`, `contract`, and `integrate(input)`.
- The single input remains `SemanticKnowledgeDataFlow`, so callers cannot supply an analysis and inventory from independently selected knowledge graphs.
- Pipeline, inventory, and publication authority remain implementation dependencies, not public consumer capabilities.
- Publication authority remains the only owner of correspondence validation; no second integrated-response authority was introduced.
- Evolved `InvocationSemanticPipelineContract` v49 to v50 and Laravel scanner boundary v28 to v29.
- Updated the scanner contract to require the composition operation and forbid bypass through public component-authority properties.

## Deliberately not changed

No runtime implementation, scanner wiring, or `controllerDataflowAnalyzer.ts` change was made. Composition remains interface-only; the contract explicitly does not claim that production composition or Laravel wiring is implemented. No dependency on `core/src/semantic/foundation` was introduced.

## Verification

- `scripts/audits/audit-phase1741-composition-encapsulation-interface.cjs`
- `scripts/audits/audit-phase1741-interface-regression.cjs`
- Targeted TypeScript check is reported separately; project-wide build is not run.

## Design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Interfaces: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript Narrowing / discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

Targeted command:

```sh
tsc --noEmit --strict --target ES2022 --moduleResolution bundler --module ESNext --skipLibCheck packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts packages/core/src/types/upstream/laravelControllerScannerInterface.ts
```

Result: exit code 2 with 88 diagnostic lines in other existing domain files; none of the diagnostics mention either changed interface file. This is not a passing project typecheck. Package build was not run.
