# Phase 2041 — Controller Selection Uses Canonical Source Identity

## Trace finding

`laravelControllerScanner.ts` correlated the output of the existing controller declaration semantic authority back to parsed controller declarations by comparing `selection.sourceFile.value.value` and `invocationJudgment.sourceFile.value.value` directly. This duplicated the source-file identity rule at a runtime wiring site and bypassed the already-existing `LaravelSourceIdentitySemanticsInterface`.

## Change

The scanner now delegates that comparison to `laravelSourceIdentitySemantics.relateSourceFiles(...)` and consumes the existing `same_source_file_identity` judgment. The controller declaration authority, invocation judgment, controller producer, response semantic pipeline, and AST projection authority remain the existing owners. No new authority or relation/foundation subscanner was introduced.

The upstream scanner contract now explicitly records that source correlation must use the canonical source-identity interface rather than compare wrapped path payloads locally.

## Preserved path

`invocation inventory → declaration semantic judgment → controller producer → response semantic pipeline → integrated invocation/response AST projection → artifact`

The exact invocation judgment continues to flow to `controllerProducer.produce`, `responseJudgmentFor`, and `astProjection.judge`. The response judgment is retained in the final artifact.

## Scope and limitation

This phase fixes one concrete duplicate identity decision in controller scanner wiring. It does not claim the entire Laravel scanner is free of legacy relation combinators or direct subscanner dependencies. Those require separate consumer-by-consumer tracing before retirement; this phase adds no replacement layer.

## Verification

Run `npm run audit:phase2041-controller-selection-canonical-source-identity-interface-first`. This is a structural contract audit. Full TypeScript type-check and build are not claimed.
