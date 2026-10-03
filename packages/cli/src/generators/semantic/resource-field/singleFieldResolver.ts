import { camelCase, SemanticTypeResolver, type ResourceField, type ResourceFieldSemanticBinding } from '@routesync/core';
import { toTypeScriptTypeExpression } from '@routesync/core';
import { toZodSchemaExpression } from '@routesync/core';
import { typeExpressionToSemanticType } from '@routesync/core';
import type { ResolvedField } from '../semanticTypes';

const resolver = SemanticTypeResolver.default();

export function resolveSingleResourceField(field: ResourceField): ResolvedField {
    const semanticType = typeExpressionToSemanticType(field.type);
    const resolved = resolver.resolve(semanticType);
    return Object.freeze({
        name: camelCase(field.name.value.value),
        sourceName: field.name.value.value,
        semanticType: resolved,
        zodType: toZodSchemaExpression(resolved),
        tsType: toTypeScriptTypeExpression(resolved),
        origin: { kind: 'resource_expression', expressionKind: field.expression.kind },
    });
}

export function resolveBoundResourceField(field: ResourceFieldSemanticBinding): ResolvedField {
    const resolved = resolver.resolve(field.semanticType);
    return Object.freeze({
        name: camelCase(field.name.value.value),
        sourceName: field.name.value.value,
        semanticType: resolved,
        zodType: toZodSchemaExpression(resolved),
        tsType: toTypeScriptTypeExpression(resolved),
        origin: { kind: 'resource_expression', expressionKind: field.expression.kind },
    });
}
