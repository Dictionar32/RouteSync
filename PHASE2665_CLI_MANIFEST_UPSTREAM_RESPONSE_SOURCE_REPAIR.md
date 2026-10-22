# Phase 2665 — CLI → Manifest → Upstream source path and response contribution repair

## Source-level findings

### CLI / manifest / upstream chain

The active executable path is:

`runRouteSyncStandaloneCli` → `loadRouteSyncStandaloneComposition` → `createProgramFromSemanticComposition` → `composeRouteSyncCliUpstream` → `assembleRequestTypeDerivationProductionPipeline`.

The CLI composition root binds the concrete `controllerInvocationManifestCompositionAuthority` alongside the assembled `RequestTypeDerivationSemanticPipelineInterface`. Both `scan` and `sync` call `manifestComposition.compose(...)`, preserve its terminal ADTs, and pass the injected semantic pipeline to `createRouteManifestProjectionComposition(...).project(...)`. The upstream barrel exports the request-type derivation contract. The new Phase 2665 audit checks these source edges; it is structural, not an end-to-end run.

### Semantic response producer gap

Phase 2664 wired action/group-fold receipts but only allowed explicitly empty responses. That incorrectly blocked a source slice already supported by the canonical response contributor: a controller-method response whose integrated result is a resource.

Phase 2665 now reuses `deriveActionResponseData(route, resourceIndex)` for that branch. The resource index is built from the input's actual `ResourceAst` inventory; a `data` response is emitted only when the canonical contributor returns a correlated response contract. A missing resource contract remains a typed `RequestTypeDerivationSemanticProducerGapError`. Explicit `empty_response`, `no_content`, and empty-body controller results still map to `response: none`; other projections remain explicit gaps instead of being guessed as empty.

## Laravel core cross-check

Official Laravel source confirms resource-route construction belongs to `Illuminate\Routing\ResourceRegistrar`, called by `Router::resource` / `Router::apiResource`. Resource route names, parameter placeholders, method sets, shallow naming, and binding fields are therefore framework-produced route facts, not facts that should be inferred from a FormRequest class name. Laravel's route-model-binding documentation separately describes implicit parameter-name matching and explicit `Route::model` bindings. Keep these identities distinct until RouteSync has source-bound evidence for their relation.

References:
- Laravel `ResourceRegistrar`: https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- Laravel `Router`: https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- Laravel routing / route model binding docs: https://github.com/laravel/docs/blob/13.x/routing.md

## Verification

- `audit:phase2664-semantic-group-fold-source-wiring`: 11/11 structural assertions passed.
- `audit:phase2665-cli-manifest-upstream-source-path`: 9/9 structural assertions passed.
- `audit:phase2661-cli-composition-fail-closed`: 5/5 structural assertions passed.
- `audit:phase2663-cli-composition-required`: 10/10 structural assertions passed.
- `package.json` parses.
- TypeScript syntax transpilation is separate from typechecking; full `tsc --noEmit`, Vitest, CLI/Laravel fixture execution, and all 34 proof-law verification remain unverified because workspace dependencies/types are not installed in this snapshot.

## Explicit residuals

1. Inline/declared/file/redirect/JSON and other non-resource response projections still need a canonical response-contract producer before they can contribute; they are not fabricated as empty.
2. Mixed conflict/incomplete judgments do not yet carry a complete partial group-contribution ledger for every unaffected contributed route.
3. The 34-law verifier and the full decision/authority/integrity path are not proven closed by these structural audits.
