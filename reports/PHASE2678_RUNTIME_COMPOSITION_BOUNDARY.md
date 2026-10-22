# Phase 2678 — Runtime Composition Boundary Audit

## Scope

Trace and tighten the actual CLI host-composition runtime boundary for the route-manifest semantic pipeline.

## Runtime trace

`routesync CLI → loadRouteSyncStandaloneComposition → host module export requestTypeDerivationSemanticComposition → runtime capability shape guard → canonical pipeline assembler → scan/sync complete manifest → request-resolution preflight → authority-backed projection`.

The exported host symbol is part of the runtime loader contract, not just a documentation example:

```ts
export const requestTypeDerivationSemanticComposition:
  RequestTypeDerivationSemanticPipelineCompositionInterface = Object.freeze({
    contract: requestTypeDerivationContract,
    preparation: productionPreparation,
    reasoning: productionReasoning,
    verifier: completeProofVerifier,
    decision: productionDecision,
    authority: sourceBoundAuthority,
    integrity: completeIntegrityValidator,
  });
```

The values above are placeholders illustrating the required shape. They are not shipped production implementations in this repository. Do not use the in-repository diagnostic composition as a production substitute.

## Root cause found and fixed

Before this phase, the CLI loader accepted `authority.decisionRules` and `integrity.contractEquivalence` if they were merely objects. A malformed host bundle could therefore pass the outer runtime type guard despite missing canonical decision rules or an executable equivalence operation.

Changes:

- Exported `REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS` from `packages/core/src/upstream.ts` so the CLI guard consumes the canonical rule inventory rather than duplicating it.
- Updated `packages/cli/src/standaloneCompositionLoader.ts` to require every canonical decision rule to have the value `required`, require `contractEquivalence.equivalent` to be a function, and validate the mandatory executable `preparation.prepare` operation before reasoning. The last check closes an additional loader gap found during follow-up trace.
- Added regression tests in `packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts` for missing source preparation, incomplete rule coverage, and missing equivalence behavior.
- Extended `scripts/audits/audit-phase2677-cli-manifest-upstream-runtime-regression.cjs` with assertions for the new runtime checks and tests.

## Validation

- Phase 2676 CLI/manifest/upstream identity audit: 20/20 assertions passed.
- Extended Phase 2677 runtime-regression source audit: 14/14 assertions passed.
- Full TypeScript compile attempt with global `tsc --noEmit -p tsconfig.json` exceeded the command time limit.
- Vitest remains unavailable because project dependencies are not installed (`node_modules/.bin/vitest` missing).
- No Laravel end-to-end `scan` or `sync` claim is made.

## Remaining blocker

The diagnostic semantic composition deliberately throws typed producer-gap errors for decision, authority, and integrity. The production composition factory also documents that concrete production capabilities are not shipped here. The runtime loader gate is now stricter, but this phase does not invent semantic-law implementations or claim end-to-end success. The remaining work is to implement and independently verify the full canonical law set and then execute Vitest, TypeScript compilation, and Laravel fixture integration.

## Official references consulted

- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript everyday types and type assertions: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- Laravel routing and `route:list`: https://laravel.com/docs/13.x/routing

The TypeScript documentation explains why an interface/type annotation is not runtime validation. Laravel's route listing documentation supports deriving route manifests from registered route evidence rather than guessing from controller or request class names.
