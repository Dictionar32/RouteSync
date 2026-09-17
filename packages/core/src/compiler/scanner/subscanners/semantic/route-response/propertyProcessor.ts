/**
 * Converts verified response field descriptors into semantic properties.
 * No runtime shape probing: the scanner has already established the ADT.
 */

import {
    ObjectProperty,
    ScannedObjectProperty,
    type SemanticType
} from '../../../../types/SemanticType';
import type { ResourceFieldDescriptor } from '../../../../../types/domain/expressions';
import { matchResourceFieldExpression } from '../../../../../types/domain/expressions';
import { toCamelCase } from '../../../../../utils/resource-naming';
import type { SemanticDerivationContext } from '../SemanticDerivationContext';
import { matchBoundSemanticNode } from '../../../../../types/domain/boundAst';

export function processResponseProperties(
    fields: readonly ResourceFieldDescriptor[],
    context: SemanticDerivationContext,
    prefix = ''
): ObjectProperty[] {
    const properties: ObjectProperty[] = [];
    for (const field of fields) {
        processField(field, context, prefix, properties);
    }
    return properties;
}

function processField(
    field: ResourceFieldDescriptor,
    context: SemanticDerivationContext,
    prefix: string,
    properties: ObjectProperty[]
): void {
    const camelName = toCamelCase(field.name.value);
    const name = prefix.length > 0
        ? `${prefix}${camelName.charAt(0).toUpperCase()}${camelName.slice(1)}`
        : camelName;

    matchResourceFieldExpression(field.expression, {
        object: expression => {
            properties.push(...processResponseProperties(expression.fields, context, name));
        },
        array: () => pushLeaf(field, name, properties),
        primitive: () => pushLeaf(field, name, properties),
        model: () => pushLeaf(field, name, properties),
        resource: () => pushLeaf(field, name, properties),
        property_access: () => pushLeaf(field, name, properties),
        nullsafe_property_access: () => pushLeaf(field, name, properties),
        variable: () => pushLeaf(field, name, properties),
        type_cast: () => pushLeaf(field, name, properties),
        binary_expression: () => pushLeaf(field, name, properties),
        method_call: () => pushLeaf(field, name, properties),
        nullsafe_method_call: () => pushLeaf(field, name, properties),
        static_method_call: () => pushLeaf(field, name, properties),
        array_access: () => pushLeaf(field, name, properties),
        function_call: () => pushLeaf(field, name, properties),
        ternary: () => pushLeaf(field, name, properties),
        short_ternary: () => pushLeaf(field, name, properties),
        null_coalesce: () => pushLeaf(field, name, properties),
        literal: () => pushLeaf(field, name, properties),
        unsupported: () => pushLeaf(field, name, properties)
    });
    void context;
}

function pushLeaf(
    field: ResourceFieldDescriptor,
    name: string,
    properties: ObjectProperty[]
): void {
    properties.push(property(name, semanticTypeFromBoundField(field)));
}

function semanticTypeFromBoundField(field: ResourceFieldDescriptor): SemanticType {
    const boundAst = field.boundAst;
    if (!boundAst) return field.semanticType;
    return matchBoundSemanticNode(boundAst, {
        bound_model_reference: node => field.semanticType,
        bound_resource_reference: node => field.semanticType,
        bound_primitive: node => node.semanticType,
        bound_model_column: node => node.semanticType,
        bound_relation: node => field.semanticType,
        bound_property_chain: node => node.resultingType,
        bound_conditional: node => node.semanticType,
        bound_binary: node => node.resultingType,
        bound_ternary: node => node.resultingType,
        bound_method_call: node => node.returnType,
        bound_query_projection: node => field.semanticType,
        bound_projection_field: node => node.semanticType,
        bound_unsupported: node => field.semanticType
    });
}
function property(name: string, type: SemanticType): ObjectProperty {
    return ScannedObjectProperty.create({
        name,
        type,
        required: true
    });
}
