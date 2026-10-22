# Phase 2051 — Runtime Function Inventory and Interface-First Migration

## Scope

The CSV beside this document inventories declaration-shaped functions found by a source scan under `packages/core/src/compiler/scanner` and `packages/core/src/types/upstream`, excluding test/spec files. It is deliberately a candidate inventory, not a claim that every row is semantic reasoning: overloads and pure constructors/projections also appear. The source scan yielded **2280 declaration lines**. Use the path, line, and symbol columns to inspect exact implementations.

## P0: semantic runtime functions that must be owned by typed contracts

| File | Runtime function(s) | Why it must be interface-owned |
|---|---|---|
| `compiler/scanner/lexer/astClassifierRuntime.ts` | `classifyAstTokens`, `parseBlock`, expression/statement classifiers, rule resolver adapters | Converts PHP token evidence into AST variants and chooses grammar/semantic interpretations. The existing `AstClassifierEvidenceInterface` and upstream `AstClassificationRuleAlgebraInterface` should own the closed request/result and rule judgments; runtime should execute those contracts. |
| `compiler/scanner/wiring/laravelControllerScanner.ts` | `scanLaravelControllers` | Coordinates declaration parsing, source correlation, controller-action projection, and integrated response projection. It should consume explicit judgments and pipeline interfaces; it must not recreate invocation/response semantics. |
| `compiler/scanner/subscanners/controller/controllerAstCanonical.ts` | `controllerMethodSemanticProjectionFromMethod`, `controllerMethodContractFromMethod`, `controllerActionFromMethod`, `controllerFailureFromMethod` | Derives method contracts and action semantics from AST. These are high-risk semantic derivations, not just data constructors; their input/output should be closed interfaces/judgments. |
| `compiler/scanner/subscanners/controller/controllerDataflowContract.ts` | `buildSemanticDataflow`, `collectResourceBindings`, `resourceBindingCandidate`, `modelOriginEvidence`, `staticCallOriginInput`, `staticCallArgumentEvidence` | Reconstructs data-flow/resource origins from AST and variable evidence. This belongs to an upstream typed dataflow authority/contract, not loose runtime inference. |
| `types/upstream/laravelControllerResponseSemanticPipeline.ts` | `projectCanonicalReturn`, `projectResourceDefinitionOutputType`, `projectSemanticValueOutputType`, `projectResponseResultOutputType`, `judgeResponseOutputType`, `judgePaginationEnvelope`, `judgeResponse`, `projectMethodResponses` | These functions are already located beside semantic contracts, but several are still implementation functions behind authorities. Preserve their existing authority ownership and expose/strengthen the relevant interface contracts; do not add another response authority. |
| `compiler/scanner/subscanners/controller/responseAttributeScanner.ts` | `inferObservedValue`, `inferPhpAstValue`, `inferNestedArray`, `mergeObservedValues`, `mergeContracts`, `resolveObservedFields` | Performs semantic inference and merge of observed PHP return values with declared response fields. Needs a closed response-value judgment contract. |
| `compiler/scanner/subscanners/controller/responseDetector.ts` | `detectResourceResponse`, `detectModelResponse`, `detectInlineResponse`, `resolveInlineDomain` | Detects response semantics from token context. Prefer typed evidence candidates and an existing response authority over direct runtime classification. |
| `compiler/scanner/binders/resource/propertyPathResolution.ts` | `resolvePropertyPath`, `methodTransition`, `propertyTransition`, `transitionMember` | Performs type/model/relation resolution while walking property paths. This is semantic binding, not merely AST projection. |
| `compiler/scanner/binders/resource/fieldBinder.ts` | `resolveVariableRoot`, `resolveVariableReceivers`, `bindField` | Performs variable-flow and receiver inference. Needs explicit typed variable-flow judgment input/output. |
| `compiler/scanner/binders/resource/resourceBinder.ts` | `buildResourceField`, `bindResourceDefinition`, `fieldFromEntry`, `operationFromField`, `assignmentFromStatement` | Derives resource fields/operations from PHP AST and symbol/model context. Should consume typed evidence and return a closed resource-binding judgment. |
| `compiler/scanner/binders/resource/whenLoadedRelationArgument.ts` | `readWhenLoadedRelation`, `readRelationArgument`, `missingArgument` | Interprets framework helper arguments and their relation identity. Use a closed argument-interpretation ADT. |
| `types/upstream/semanticDataflowRuntimeExecutor.ts` | `executeEvidenceRequest` | Runtime executor is allowed only to dispatch an already-closed dataflow contract; inspect whether the current function does any classification beyond execution. |

## P1: runtime wiring functions, not semantic authorities

- `astClassifierEvidence.ts`: `classifyExpression`, `classifyBlock`, `classify`, `classifyValueResult`, `classifyTokensResult`, `classifyBlockResult`, `classifySemanticResult`. These should remain thin interface adapters; the parsing runtime behind `classify` is the semantic implementation target.
- `responseScanner.ts`: `controllerResponseResults`, `scanResponseBundle`, `scanResponseAsts`. These should consume `LaravelControllerScanJudgment` and closed response products rather than rescan controller return semantics.
- `responseProducer.ts`: `dtoResponse`, `controllerResponse`, `foundBranchResults`, `producerResolution`. Check whether each is a pure projection or whether it infers response meaning; only the latter needs a semantic authority.
- `controllerProducer.ts`: `produce` and `projectMethodEvidence`. They are intended as projections of precomputed judgments/evidence and should stay dumb. Do not turn pure projection constructors into separate authorities just because they are functions.

## Implemented in Phase 2051

The local `responseJudgmentFor()` runtime function was removed from `laravelControllerScanner.ts`. Its source correlation → evidence production → source binding → response execution sequence is now a method on the existing `LaravelControllerResponseSemanticPipelineInterface`: `judgeIntegratedResponse(input)`. The implementation lives beside the existing pipeline implementation, and the scanner only submits the exact invocation judgment plus declaration evidence. The same invocation object remains attached to the output; no invocation or response authority is duplicated. Pipeline contract version advanced from 16 to 17.

## Migration rule

Do not blindly convert every function into an interface. First classify each function as one of: (1) semantic judgment/derivation, which must be interface-owned and return a closed ADT; (2) runtime executor/wiring, which may only dispatch/forward an already-closed contract; (3) pure constructor/structural projection, which should remain a simple implementation and does not need a new authority. The objective is not zero functions; it is zero semantic reasoning hidden in uncontracted runtime functions. No relation/foundation subscanner is introduced.
