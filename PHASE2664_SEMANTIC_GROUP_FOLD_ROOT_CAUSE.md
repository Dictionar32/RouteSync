# Phase 2664 — Semantic group-fold source repair

## Root cause

The upstream contract already described action contribution, response contribution, group transitions, and receipt correlation, but `requestTypeDerivationSemanticReasoning.ts` stopped as soon as any route was contribution-eligible. The group receipt list was hard-coded empty and the proof had no route-to-group relations. Thus the declared policy and active producer were disconnected. The CLI's missing-composition branch was a separate configuration boundary; it could not fix this semantic producer gap.

## Source changes

1. Added `RequestTypeGroupFoldInput` and `RequestTypeGroupContributionAlgebraInterface` to `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. The upstream type contract now names the canonical fold input and operation.
2. Added `requestTypeDerivationGroupContributionAlgebra.ts` as `export const requestTypeDerivationGroupContributionAlgebra: RequestTypeGroupContributionAlgebraInterface`. It implements append/replace/retain action policy, accept/retain response policy, and emits a replayable receipt with `before`, `incoming`, `after`, and transition.
3. Connected the reasoning producer to the original route input, request resolution ledger, `deriveRouteAction`, and the canonical fold. Group receipts now flow into the proof and route/group relations are emitted.
4. Implemented closed closure for the supported path when no unresolved evidence or conflict remains.
5. Added a regression suite for initial, replacement, and retention fold transitions, plus `audit:phase2664-semantic-group-fold-source-wiring`.

## Deliberate boundary, not a success mask

The current contribution integration only admits routes whose existing response descriptor is explicitly `void`. Non-void response contribution still raises a typed `RequestTypeDerivationSemanticProducerGapError` until the response ADT / response-contract projection can be converted into `RequestResponse` without losing DTO fields or method-scoped source identity. It does not fabricate `response: none` for non-void routes.

The 34-law verifier, decision, authority, and integrity implementations remain incomplete. The new fold receipts are not themselves proof that all laws have been verified.

## Audit path

`CLI composition root -> manifest composition -> request/resource input preparation -> source inventory and identity collision inventory -> request/resource resolution ledgers -> semantic reasoning -> group fold -> proof group receipts / route-group relations -> verifier -> decision -> authority -> integrity -> manifest projection`.

The first part through semantic reasoning and group-fold now has an implemented void-response slice. The later verification/decision/authority/integrity stages are still explicit blockers and must not be represented as production-complete.

## External framework source boundary

Laravel's `Router` and `ResourceRegistrar` own route registration, resource actions, route names, wildcard parameters, and binding-field setup. Laravel `FormRequest` owns request validation and authorization behavior. These are separate source evidence domains: route resource identity must not be inferred from FormRequest identity without an explicit, source-grounded resolution relation.

- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Foundation/Http/FormRequest.php
- https://github.com/laravel/docs/blob/13.x/routing.md

## Verification status

- Structural Phase 2664 audit: 10/10.
- Existing Phase 2660 audit: 10/10.
- Existing Phase 2659 audit: 14/14.
- Existing Phase 2661 audit: 5/5.
- Existing Phase 1347 wiring trace: 12/12.
- Existing Phase 1407 source-AST boundary: 10/10.
- Existing Phase 1410 semantic origin: 23/23 with residuals.
- Existing Phase 1415 AST classifier algebra: 8/8.
- Existing Phase 1416 scanner runtime interface audit: passed with residuals.
- Existing Phase 1417 scanner runtime interface audit: 9/9 with typecheck pending.
- TypeScript syntax transpilation of changed TS files: passed.
- Full `tsc --noEmit` is blocked by absent workspace dependencies/types and compiler/config mismatch in this environment (`@types/node`, `vitest/globals`, and target/lib settings). Vitest and CLI end-to-end were not run.

Structural audits are not behavioral tests and do not establish all 34 proof laws.
