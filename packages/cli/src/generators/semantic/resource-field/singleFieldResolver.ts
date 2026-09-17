/** Lower a verified Laravel ResourceFieldDescriptor without re-classification. */
import { camelCase, SemanticTypeResolver } from '@routesync/core';
import { toTypeScriptTypeExpression } from '@routesync/core';
import { toZodSchemaExpression } from '@routesync/core';
import type { ResourceFieldDescriptor } from '@routesync/core';
import type { ResolvedField } from '../semanticTypes';

const resolver = SemanticTypeResolver.default();

export function resolveSingleResourceField(field: ResourceFieldDescriptor): ResolvedField {
    const resolved = resolver.resolve(field.semanticType);
    return Object.freeze({
        name: camelCase(field.name),
        sourceName: field.name,
        semanticType: resolved,
        zodType: toZodSchemaExpression(resolved),
        tsType: toTypeScriptTypeExpression(resolved),
        origin: {
            kind: 'resource_expression',
            expressionKind: field.expression.kind,
        } as const,
    });
}
