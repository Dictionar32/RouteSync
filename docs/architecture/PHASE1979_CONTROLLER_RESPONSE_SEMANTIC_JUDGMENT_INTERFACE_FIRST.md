# Phase 1979 — Controller response semantic judgment, interface first

## Trace finding

The Phase 1978 responsibility map incorrectly treated `LaravelSourceAstPipelineInterface` as the semantic owner of response attribute, response shape, and DTO evidence. The pipeline is a source-AST acquisition/projection boundary; it is not a response-kind judgment authority. Likewise, a legacy `ResponseDescriptor` is evidence, not a closed semantic response product.

## Interface change

Added `laravelControllerResponseSemanticJudgmentInterface.ts` as a type-only upstream contract:

- `LaravelControllerResponseSemanticEvidence` preserves declared attribute, observed return, and DTO declaration evidence.
- `LaravelControllerResponseSemanticProduct` represents object, model, resource, and void responses as a closed ADT.
- `LaravelControllerResponseSemanticJudgment` preserves `not_connected`, `source_binding_rejected`, `invocation blocked`, `response complete`, and `response blocked` as distinct outcomes.
- Every response judgment retains the exact `LaravelControllerInvocationSemanticJudgmentInterface`; it does not reconstruct or widen that judgment.
- `LaravelControllerResponseSemanticJudgmentContract` states the source-binding, composition, AST projection, and runtime executor constraints without introducing callable runtime behavior.

The response entries in `LaravelControllerSubscannerResponsibilityTypeMap` now point to the response judgment/product and identify the source AST pipeline only as a projection boundary, not the response semantic owner.

## Intended flow

```text
Laravel source response evidence
  -> closed controller response semantic judgment
  -> existing invocation integrated-response composition boundary
  -> LaravelSourceAstProjectionJudgment
  -> canonical AST/ADT projection
  -> runtime executor executes the already-closed contract
```

This phase defines the upstream contract only. It does not wire the new judgment into runtime or claim that the legacy response scanners have already been retired. The source-identity authority must validate that each evidence source belongs to the invocation judgment's canonical source before a complete response product is published.

## Scope and verification

- Type/interface declarations and type-only public exports only.
- No `semantic/relations` or `semantic/foundation` replacement layer.
- No runtime executor, authority implementation, scanner wiring, AST projection implementation, or legacy subscanner modification.
- Structural audit: `scripts/audits/audit-phase1979-controller-response-semantic-judgment.cjs`.
- TypeScript build/typecheck has not been run; structural audit does not establish compile compatibility.

## Controller subscanner trace snapshot

The 12 non-empty controller source modules were inspected directly. Import-occurrence counts for `semantic/relations` / `semantic/foundation` in the scoped files:

| Module | relation/foundation import occurrences |
|---|---:|
| `actionScanner.ts` | 3 |
| `actionValidationExtractor.ts` | 3 |
| `controllerAstCanonical.ts` | 2 |
| `controllerBodyResolver.ts` | 3 |
| `controllerDataflowContract.ts` | 3 |
| `controllerProducer.ts` | 2 |
| `resourceDataflowAggregator.ts` | 4 |
| `resourceInvocationDetector.ts` | 2 |
| `responseAttributeScanner.ts` | 2 |
| `responseDetector.ts` | 2 |
| `responseDtoReader.ts` | 1 |
| `index.ts` | 0 |
| **Total** | **27** |

All 27 are `semantic/relations` imports; no `semantic/foundation` imports were found in these 12 files. The response-specific correction addresses a contract gap only; the old imports and 12 production import call-sites remain and are not represented as retired.
