import type { ResourceFieldDescriptor } from '../../../types/route';
import { matchBoundSemanticNode } from '../../../types/domain/boundAst';
import type { SemanticType } from '../../types/SemanticType';

/** Canonical semantic type projection for a verified resource field. */
export function semanticTypeFromField(field: ResourceFieldDescriptor): SemanticType {
    const bound = field.boundAst;
    if (!bound) return field.semanticType;
    return matchBoundSemanticNode(bound, {
        bound_model_reference: () => field.semanticType,
        bound_resource_reference: () => field.semanticType,
        bound_primitive: node => node.semanticType,
        bound_model_column: node => node.semanticType,
        bound_relation: () => field.semanticType,
        bound_property_chain: node => node.resultingType,
        bound_conditional: node => node.semanticType,
        bound_binary: node => node.resultingType,
        bound_ternary: node => node.resultingType,
        bound_method_call: node => node.returnType,
        bound_query_projection: () => field.semanticType,
        bound_projection_field: node => node.semanticType,
        bound_unsupported: () => field.semanticType
    });
}
