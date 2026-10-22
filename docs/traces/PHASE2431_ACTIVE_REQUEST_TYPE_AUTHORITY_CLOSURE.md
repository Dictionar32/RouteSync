# Phase2431 — Active RequestType Authority Closure Trace

## Scope

Audit the actual `scan` and `sync` CLI path from completed upstream manifest to downstream `RouteManifest`, identify the current semantic authority, and distinguish declared contracts from production implementations.

## Trace from CLI to RequestType lowering

Both CLI commands call `projectRouteSyncManifestForRouteManifest(completeManifest)`:

- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/commands/sync.ts`

The call reaches:

`projectRouteSyncManifestForRouteManifest` → `routeManifestProjection.project` → `routeManifestTypeLowering.project` → `requestTypeDerivationProjectionPipeline.derive` → `createDerivationContext` → `aggregateRequestTypeGroups`.

The final two operations are in the legacy implementation:

- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts`
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts`

That path returns `RequestType[]` directly. It does not construct the closed judgment, source dispositions, group contribution receipts, law coverage, or verified authority assessment required by the upstream proof contract.

## Existing upstream capabilities — do not duplicate

The repository already contains:

- `RequestTypeDerivationSemanticReasoningInterface`
- `RequestTypeDerivationProofVerificationInterface`
- `RequestTypeDerivationSemanticDecisionInterface`
- `RequestTypeDerivationSemanticAuthorityInterface`
- `RequestTypeDerivationSemanticPipelineInterface`
- the closed `RequestTypeDerivationJudgment`, proof and verification ADTs
- 32 required law identifiers and the policy/closure model
- `createRequestTypeDerivationSemanticPipelineAssembler`
- `createRequestTypeDerivationAuthorityCoverage`
- `createRequestTypeDerivationRuntimeExecutor`
- `createAuthorityBackedRouteManifestProjection`
- `createIntegratedRouteManifestAuthority`

The authority-backed path is already composed to consume an injected pipeline and preserve blocked derivation outcomes. It is not the path selected by the default `routeManifestProjection` used by the CLI.

## Root cause

The primary gap is not a missing declaration of the semantic contract. It is the absence of concrete production reasoning and independent proof verification implementations that satisfy the existing closed ADT, plus the absence of their composition in the active CLI route.

The assembler is composition infrastructure; the authority adapter is not the reasoning kernel; and the runtime executor only consumes an already-closed assessment. None of these can truthfully turn the legacy solver's raw array into a proof.

## Contract decision

No duplicate contract or replacement ADT was added in this phase. The current upstream contract already expresses the needed source evidence, 32 laws, closure, conflict/incompleteness states, proof receipts, and authority assessment. Changing its shape without a demonstrated contract defect would not close the production gap.

## Required implementation order

1. Implement source-bound reasoning against the existing `RequestTypeDerivationSemanticReasoningInterface`, preserving the full input and producing the existing judgment/proof ADT.
2. Implement an independent verifier against all 32 laws. It must validate source dispositions, source occurrence coordinates, request/resource resolution, contribution receipts, closure, and the final output; it must not repair the reasoning result.
3. Implement/use the existing decision and authority capabilities, bind all capabilities to the same canonical contract value, and assemble through `createRequestTypeDerivationSemanticPipelineAssembler`.
4. Add semantic tests for each law and adversarial/duplicate/unresolved/conflict cases before wiring the pipeline to `createIntegratedRouteManifestAuthority`.
5. Change the default CLI projection to use the authority-backed integrated-manifest path. Preserve blocked outcomes as explicit CLI failures; never fall back to the legacy solver.
6. Run focused semantic tests, CLI scan/sync integration tests, package typecheck/build, and regression tests. Record actual commands and results.

## Technical reference

The TypeScript Handbook describes discriminated unions and `never`-based exhaustiveness checking. These help ensure every declared outcome variant is handled, but they do not prove the truth of the semantic laws: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Validation

`node scripts/audits/audit-phase2431-active-request-type-authority-closure.cjs`

Result: 10/10 source-structure assertions passed. These assertions confirm the current path and the missing producer; they are not semantic proof tests, a package build, or an end-to-end CLI run.

## Completion status

**Audit and trace complete; semantic producer and CLI cutover remain blocked.** No production implementation is claimed in this phase. The next code change must implement the producer/verifier pair before replacing the active CLI path; wiring an absent pipeline or wrapping a legacy `RequestType[]` as proof would be dishonest and unsafe.
