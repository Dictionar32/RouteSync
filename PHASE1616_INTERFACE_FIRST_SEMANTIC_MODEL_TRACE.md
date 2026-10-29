# Phase 1616 — Interface-first semantic model trace

## Scope

This phase is deliberately limited to the contract model and its trace. It does not change scanner wiring, composition roots, runtime executors, or production consumers.

## Trace findings

### 1. `core/src/types/upstream/semanticDecisionInterface.ts`

`SemanticDecisionRule` currently embeds `applies(input)` and `derive(input)` callbacks inside `SemanticDecisionContract`. That makes the so-called contract executable: the semantic rule's meaning is carried by callback behavior, not fully represented as data. The generic algebra in `semanticDecisionAlgebra.ts` then invokes those callbacks.

The interface now declares a separate data-only policy vocabulary:

- `SemanticDecisionRuleDefinition`: rule identity, premises, and conclusions as data;
- `SemanticDecisionPolicyContract`: closed policy, rule definitions, precedence, and declared evidence/conclusion vocabularies;
- `SemanticDecisionEvidencePacket`: source-bound evidence input;
- `SemanticDecisionRuleExecutionReceipt` and `SemanticDecisionAuthorityAssessment`: correlated receipt/result types;
- `SemanticDecisionAuthorityInterface`: authority boundary for interpreting the declarative contract.

The existing callback-bound contract remains for compatibility. It is explicitly documented as a legacy execution adapter. This phase does not claim that production consumers have migrated to the declarative model.

### 2. `core/src/types/upstream/astSemanticInterface.ts`

The file currently mixes public AST semantic types with implementation helpers (`ruleMatches`, `deriveRuleApplications`, `closeFacts`) and exports `astSemanticInterface.close` as a concrete solver. The closure certificate contains `stableFacts: true` and `rulesExhausted: true`, but does not itself bind those assertions to the exact seed/rule-set identity or provide an independent verification operation. Therefore the certificate shape is not yet independently auditable as proof evidence.

This phase does not move or rewrite that implementation. The interface contract remains an unresolved audit item for the next interface-only iteration.

### 3. `core/src/types/upstream/requestTypeDerivationInterface.ts`

The RequestType model has a stronger closed union: authority assessment variants correlate to proof conclusions, and the candidate envelope binds a contract family and verification binding. However, the public pipeline exposes only `derive(input)`, hiding the inference/candidate/verification packet from the interface-level audit. The contract should make the authority-owned closed assessment and its source-binding laws explicit without requiring runtime consumers to reconstruct intermediate evidence.

No pipeline wiring was changed in this phase.

### 4. `core/src/types/upstream/semanticTypeDerivationInterface.ts`

The file declares authority/runtime interfaces but also includes executable shape validation (`assertSemanticTypeDerivationJudgment`). The type contract distinguishes authority from executor by names, but module responsibility is still mixed. This is recorded as a contract-boundary concern; no runtime was moved.

### 5. `core/src/compiler/frontend/php/astClassifierRuntime.ts`

The scanner builds `SemanticDecisionRule` values using callbacks and hands them to the generic algebra. This confirms that scanner classification semantics are still represented as executable callback rules. The scanner is a consumer/evidence producer and should eventually supply typed evidence to the upstream semantic authority rather than define an independent executable rule catalog.

No scanner or wiring source was changed in this phase.

## Model direction

The target contract shape is:

`Typed source evidence -> declarative semantic policy -> authority evaluation -> correlated rule receipts + closed judgment -> verification -> consumer projection`

Required laws before production migration:

1. Rule identities are unique and every precedence edge refers to a declared rule.
2. Precedence is total and acyclic under the declared selection policy.
3. Premises and conclusions belong to the declared vocabulary.
4. Every receipt is bound to the exact source evidence packet and policy identity.
5. A derived conclusion is selected from the named rule's declared conclusions and supported by satisfied premises.
6. `not_derived` is valid only after all eligible rules have been accounted for.
7. A rejected/invalid/incomplete result cannot be represented as a closed successful judgment.
8. Runtime executors consume the closed authority result; they do not classify, re-derive, or pair evidence themselves.

## External design reference

MLIR's official interface documentation describes interfaces as a way for generic compiler transformations and analyses to operate without embedding special knowledge of each concrete operation/dialect. It also emphasizes that interface methods need documented semantics and that implementation is supplied by the concrete model. RouteSync's interface-first boundary should follow the same separation: consumers depend on a stable semantic contract; the authority implementation interprets it.

Reference: https://mlir.llvm.org/docs/Interfaces/

## Validation status

- Static source trace: completed for the paths listed above.
- Production wiring changed: no.
- Runtime executor changed: no.
- Full TypeScript build / Vitest: not run; dependencies are not installed in this workspace.
- This phase establishes a declarative interface model but does not claim production migration or end-to-end completion.
