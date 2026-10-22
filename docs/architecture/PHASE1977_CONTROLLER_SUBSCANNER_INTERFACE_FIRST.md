# Phase 1977 — Controller subscanner interface-first trace

## Scope

This phase changes only the upstream type/interface contract and its type-only public export. It does not change runtime scanner code, authorities, executor implementations, AST projection implementations, or wiring. It does not create a `semantic/relations` or `semantic/foundation` replacement layer.

## Trace: source → judgment → integrated response → AST/ADT

1. **Source evidence / controller scan** — `LaravelControllerScannerInterface` is the existing public boundary. `LaravelControllerScanArtifact` retains the exact `LaravelControllerInvocationSemanticJudgmentInterface` per controller.
2. **Invocation semantic judgment** — `LaravelControllerInvocationSemanticJudgmentInterface` is already a closed outcome-indexed union. It preserves `not_connected`, `source_binding_rejected`, `complete`, and `blocked`; do not flatten these into a boolean or optional response.
3. **Integrated response** — `InvocationSemanticIntegratedResponseCompositionInterface.integrate` is the existing composition boundary. It must preserve source binding and the exact response provenance; it must not become a second invocation authority.
4. **AST/ADT projection** — `LaravelSourceAstProjectionJudgment` and `LaravelControllerAstProjectionContext` already model completed/blocked source projection and syntax-only/semantic projection. Semantic projection carries the canonical invocation judgment, not an independently supplied response.
5. **Runtime executor** — existing runtime still imports controller subscanner modules. This phase makes no claim that those imports have been migrated or that the subscanner directory is deletable.

## Responsibility trace for the 12 non-empty controller modules

| Existing module | Existing contract owner to evolve/use | Contractual product | Main remaining migration work |
|---|---|---|---|
| `actionScanner.ts` | `LaravelControllerScannerInterface` | `ControllerActionFlowContract` | Move action discovery input/output shape to scanner contract; remove relation-based semantic selection from implementation in a later runtime migration. |
| `actionValidationExtractor.ts` | canonical validation-rule/request-field contracts | `RouteValidationRuleEntry` | Promote evidence and closed validation judgment to upstream types; keep parsing as evidence projection. |
| `controllerAstCanonical.ts` | `LaravelSourceAstProjectionJudgment` | `ControllerAst` | Separate syntax evidence projection from semantic judgment; preserve the existing invocation judgment unchanged. |
| `controllerBodyResolver.ts` | `ControllerBodyAst` ADT | discriminated controller body projection | Model body outcomes as ADT variants, without a resolver/foundation layer duplicating semantic ownership. |
| `controllerDataflowContract.ts` | `ControllerDataflowInvocationSemanticModelInterface` | `ControllerVariableSemanticJudgment` | Keep binding, identity, variable flow and provenance in the existing closed judgment model. |
| `controllerProducer.ts` | existing `ControllerProducer` | `ControllerActionFlowContract` | Retain source identity and canonical invocation judgment through publication; do not create a second producer authority. |
| `resourceDataflowAggregator.ts` | `ResourceModelBindingJudgmentAuthority` | `ControllerResourceBindingEvidence` | Replace first-match/resource grouping semantics with authority-owned resolved/missing/ambiguous judgments. |
| `resourceInvocationDetector.ts` | `ResourceModelBindingJudgmentAuthority` | source-bound resource invocation evidence | Make parser output evidence-only; AST token classification must not be treated as a model-binding judgment. |
| `responseAttributeScanner.ts` | `InvocationSemanticIntegratedResponseCompositionInterface` and existing response contracts | `ResponseDescriptor` | Correlate response-attribute evidence with the same source-bound invocation judgment before publication. |
| `responseDetector.ts` | existing response contracts / integrated response composition | `ResponseDescriptor` | Preserve resource/model/inline response alternatives as evidence/ADT; do not silently choose by local relation helpers. |
| `responseDtoReader.ts` | existing response value contracts | `ResponseContractField` | Return source-correlated DTO field evidence with semantic type/provenance; keep response composition outside this parser. |
| `index.ts` | `LaravelControllerScannerInterface` public boundary | public controller scan judgment | Retire duplicate entry only after production consumers stop importing it. |

## Interface change

`LaravelSubscannerRetirementInterface` is now version 4 and carries a typed `LaravelControllerSubscannerResponsibility` union for those 12 modules, along with the required semantic flow and forbidden replacement layers. This is an ownership/trace contract only; it is not instantiated as a runtime registry and does not implement scanner behavior.

## Important limitation

The type-only contract now makes the responsibility mapping explicit, but **it does not itself remove the 12 modules or eliminate their relation imports**. The runtime call sites listed in the repository trace still need migration to these existing upstream contracts before directory deletion is safe. No TypeScript build or test suite is claimed by this phase; only the structural audit is run.
