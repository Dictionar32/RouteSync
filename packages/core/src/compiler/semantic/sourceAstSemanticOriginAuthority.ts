import type { ExpressionOrigin } from '../../types/upstream/ast';
import { createActionName, createPropertyName, createResourceName, createModelName, createControllerName, createServiceName } from '../../types/upstream/names';
import type { SourceAstEvidenceKind } from '../../types/upstream/sourceAstEvidenceAcquisitionInterface';
import type { SourceAstSemanticOriginInterface, SourceAstSemanticOriginEvidence } from '../../types/upstream/sourceAstSemanticOriginInterface';

/** Declarative closed relation: every admitted source family has an explicit semantic-origin rule. */
const originRules = {
  model: (evidence: SourceAstSemanticOriginEvidence): ExpressionOrigin => ({
    kind: 'model_accessor',
    model: createModelName(evidence.owner),
    accessor: createPropertyName(evidence.member),
  }),
  controller: (evidence: SourceAstSemanticOriginEvidence): ExpressionOrigin => ({
    kind: 'controller_action',
    controller: createControllerName(evidence.owner),
    action: createActionName(evidence.member),
  }),
  service: (evidence: SourceAstSemanticOriginEvidence): ExpressionOrigin => ({
    kind: 'service_method',
    service: createServiceName(evidence.owner),
    method: { kind: 'method_name', value: { kind: 'string_value', value: evidence.member } },
  }),
  resource: (evidence: SourceAstSemanticOriginEvidence): ExpressionOrigin => ({
    kind: 'resource_field',
    resource: createResourceName(evidence.owner),
    field: createPropertyName(evidence.field),
  }),
} satisfies Record<SourceAstEvidenceKind, (evidence: SourceAstSemanticOriginEvidence) => ExpressionOrigin>;

const resolveOrigin = (evidence: SourceAstSemanticOriginEvidence): ExpressionOrigin =>
  originRules[evidence.sourceKind](evidence);

export const sourceAstSemanticOriginAuthority: SourceAstSemanticOriginInterface = Object.freeze({
  kind: 'source_ast_semantic_origin_interface',
  closed: true,
  resolve(evidence) {
    return Object.freeze({
      kind: 'source_ast_semantic_origin_judgment',
      evidence: Object.freeze({ ...evidence }),
      origin: resolveOrigin(evidence),
      closed: true,
    });
  },
});
