# Phase 2656 — RequestType producer interface path

## Source-root change

The root gap is not a missing TypeScript interface. The canonical contract, 34 law IDs, closed judgment ADT, source-evidence inventory, occurrence identity, request/resource resolution, and pipeline assembler already existed. The missing piece was a concrete source-bound producer/verifier path that the standalone CLI could actually enter.

This phase adds named values using the requested pattern:

- `requestTypeDerivationSemanticReasoning: RequestTypeDerivationSemanticReasoningInterface`
- `requestTypeDerivationProofVerifier: RequestTypeDerivationProofVerificationInterface`
- `requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface`

The producer now follows the existing preparation packet from AST/source input through canonical inventory and occurrence identity. When canonical identity collisions are present, it emits the existing `invalid_input` ADT with domain-specific collision witnesses. The verifier recomputes duplicate-identity witnesses from the raw inference input and only returns `rejection_confirmed` when the source-occurrence witness matches.

## CLI / manifest path

With `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` set, the CLI continues to load the host-owned composition. Without it, the loader now uses the in-repository diagnostic composition. This lets the CLI enter the actual canonical path rather than stopping before source preparation:

`CLI scan/sync → manifest authority → pipeline assembler → preparation → source inventory / canonical identity / occurrence identity → semantic reasoning → proof verification → decision → authority/integrity → manifest projection`

This is deliberately a **diagnostic composition**, not a production-complete composition. It fails with `RequestTypeDerivationSemanticProducerGapError` at the first unsupported stage. It does not convert the legacy `RequestType[]` solver output into a judgment, does not emit a fake `derived` result, and does not mark unverified laws as verified.

## Still blocked

- Production `derived`, `incomplete`, and `conflict` judgment production with complete source dispositions, action/response contributions, contribution receipts, and closure ledger.
- Independent verification of all 34 canonical laws for all judgment variants.
- Concrete decision algebra, source-bound authority adjudication, and full authority-integrity validation.
- Typecheck, package build, and end-to-end CLI execution in the complete dependency environment. The uploaded snapshot has no installed project dependencies; global TypeScript reports unrelated existing repository errors as well as missing Node/Vitest/Commander types.

## Laravel domain alignment

The upstream input should preserve Laravel's own source distinctions rather than flatten them into a local request-name heuristic. Laravel routing defines route declarations, route names, parameters, and model binding as distinct facts. Laravel Form Requests own both `authorize()` and `rules()` and are validated before controller execution. These source distinctions inform the AST and identity inventory; they do not themselves prove RouteSync's 34 semantic laws.

References:

- Laravel routing: https://laravel.com/framework/docs/13.x/routing
- Laravel Form Request validation: https://laravel.com/framework/docs/validation/latest
- TypeScript interfaces and structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
