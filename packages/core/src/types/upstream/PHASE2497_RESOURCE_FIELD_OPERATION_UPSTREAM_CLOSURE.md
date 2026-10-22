# Phase2497 — Resource Field Operation Upstream Closure

## Changes

- Connected `ResourceProducerInterface.produceField` to the existing `ResourceFieldProductionOperationInterface<Value, Model>` rather than repeating an inline call signature.
- Moved the canonical `produceResourceField` implementation from `scanner/subscanners/resource` to `scanner/operations/resourceFieldProducer.ts`.
- Wired `operations/resourceProducer.ts` to the operation-owned field producer and retired the old field-producer source file.
- Kept the existing `ResourceFieldSemanticAuthorityInterface` and its closed judgment as the source of field meaning, semantic type, and output-shape decisions. No parallel authority was introduced.
- Added a focused audit at `scripts/audits/audit-phase2497-resource-field-operation-upstream-closure.cjs`.

## Remaining debt

- `resourceFieldProducer` previously delegated AST-to-expression mapping to the subscanner mapper. Phase2498 moved that operation to `scanner/operations/resourceAstExpressionMapper.ts`; the mapper still imports `semantic/relations`.
- `operations/resourceProducer.ts` still imports `semantic/relations` and delegates model property production to `subscanners/model/propertyProducer.ts`.
- `ResourceModelReasoningEvidence` remains exported but has no operational consumer; its intended role must be decided from the model-resolution evidence flow before either connecting or removing it.
- This phase does not claim full CLI end-to-end validation, whole-project typecheck, build, or Vitest success.
