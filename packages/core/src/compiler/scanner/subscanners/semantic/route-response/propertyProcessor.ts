/**
 * Converts verified response field descriptors into semantic properties.
 * No runtime shape probing: the scanner has already established the ADT.
 */

import {
    ObjectProperty,
    ScannedObjectProperty,
    type SemanticType
} from '../../../../../types/domain/semanticType';
import type { ResourceFieldSemanticBinding } from '../../../../../types/domain/resourceFieldSemanticBinding';
import { matchResourceFieldExpression } from '../../../../../types/domain/expressions';
import { toCamelCase } from '../../../../../utils/resource-naming';
import type { SemanticDerivationContext } from '../SemanticDerivationContext';
import { matchBoundSemantic } from '../../../../../types/domain/boundAst';
import { relationEqual } from '../../../../../semantic/foundation/semanticRelations';
import { relationFold, relationGate, relationSlice } from '../../../../../semantic/foundation/relationalSequence';

export function processResponseProperties(
    fields: readonly ResourceFieldSemanticBinding[],
    context: SemanticDerivationContext,
    prefix = ''
): ObjectProperty[] {
    const properties = relationFold(fields, [] as ObjectProperty[], (output, field) => {
        processField(field, context, prefix, output);
        return output;
    });
    return properties;
}

function processField(
    field: ResourceFieldSemanticBinding,
    context: SemanticDerivationContext,
    prefix: string,
    properties: ObjectProperty[]
): void {
    const camelName = toCamelCase(field.name.value);
    const name = relationGate(relationEqual(prefix.length, 0),
        () => camelName,
        () => `${prefix}${camelName.charAt(0).toUpperCase()}${relationSlice(Array.from(camelName), 1, camelName.length).join('')}`);

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
    field: ResourceFieldSemanticBinding,
    name: string,
    properties: ObjectProperty[]
): void {
    properties.push(property(name, semanticTypeFromBoundField(field)));
}

function semanticTypeFromBoundField(field: ResourceFieldSemanticBinding): SemanticType {
    return relationGate(relationEqual(field.semantic.kind, 'rejected'),
        () => { throw Error(`Resource field semantic rejected: ${field.semantic.bound.reason.value}`); },
        () => {
            const boundAst = field.semantic.bound;
            return matchBoundSemantic(boundAst, {
        bound_model_reference: node => field.semantic.type,
        bound_resource_reference: node => field.semantic.type,
        bound_primitive: node => node.semanticType,
        bound_model_column: node => node.semanticType,
        bound_relation: node => field.semantic.type,
        bound_property_chain: node => node.resultingType,
        bound_conditional: node => node.semanticType,
        bound_binary: node => node.resultingType,
        bound_ternary: node => node.resultingType,
        bound_method_call: node => node.returnType,
        bound_query_projection: node => field.semantic.type,
        bound_projection_field: node => node.semanticType,
        bound_unsupported: node => field.semantic.type
            });
        });
}
function property(name: string, type: SemanticType): ObjectProperty {
    return ScannedObjectProperty.create({
        name: { kind: 'property_name', value: name },
        type,
        description: '',
        origin: { kind: 'derived', reason: 'semantic_resolution' }
    });
}
