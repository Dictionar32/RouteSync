import { SemanticTypeResolver, camelCase, typeExpressionToSemanticType, type ResourceAst, type ResourceField, type ResourceFieldSemanticBinding, type ModelSemanticDefinition } from '@routesync/core';
import { toTypeScriptTypeExpression } from '@routesync/core';
import { toZodSchemaExpression } from '@routesync/core';
import type { CompilerIR, ResolvedField } from './semanticTypes';
import type { SemanticResolutionContext } from './SemanticResolutionContext';
import { resolveSingleResourceField, resolveBoundResourceField } from './resource-field';

const resolver = SemanticTypeResolver.default();

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }, output: readonly T[] = []): readonly T[] =>
    sequence.kind === 'empty' ? output : sequenceToArray(sequence.tail, [...output, sequence.head]);

export class ResourceFieldResolver {
    public static resolveFieldMappings(context: SemanticResolutionContext, ir: CompilerIR): void {
        context.models.forEach(model => this.resolveModelFields(model, ir));
        context.resources.forEach(resource => this.resolveResourceFieldsRecursive(resource.definition.fields.items, ir.fieldMappings, resource.definition.name.value.value));
    }

    public static buildResponseFields(resource: ResourceAst): Map<string, ResolvedField> {
        const fields = new Map<string, ResolvedField>();
        this.resolveResourceFieldsRecursive(resource.definition.fields.items, fields, resource.definition.name.value.value);
        return fields;
    }

    public static resolve(field: ResourceFieldSemanticBinding): ResolvedField {
        return resolveBoundResourceField(field);
    }

    private static resolveModelFields(model: ModelSemanticDefinition, ir: CompilerIR): void {
        sequenceToArray(model.surface.properties).forEach(property => {
            const key = `${model.identity.name.value.value}.${property.property.value.value}`;
            if (ir.fieldMappings.has(key)) return;
            const semanticType = typeExpressionToSemanticType(property.semanticType);
            const resolved = resolver.resolve(semanticType);
            ir.fieldMappings.set(key, Object.freeze({
                name: camelCase(property.property.value.value),
                sourceName: property.property.value.value,
                semanticType: resolved,
                zodType: toZodSchemaExpression(resolved),
                tsType: toTypeScriptTypeExpression(resolved),
                origin: { kind: 'model_column', columnName: property.property.value.value },
            }));
        });
    }

    private static resolveResourceFieldsRecursive(
        fields: ResourceAst['definition']['fields']['items'],
        fieldMappings: Map<string, ResolvedField>,
        pathPrefix: string,
    ): void {
        sequenceToArray(fields).forEach(field => {
            const fieldPath = `${pathPrefix}.${field.name.value.value}`;
            if (field.output.kind === 'nested_object') {
                this.resolveResourceFieldsRecursive(field.output.fields.items, fieldMappings, fieldPath);
            }
            if (fieldMappings.has(fieldPath)) return;
            fieldMappings.set(fieldPath, resolveSingleResourceField(field));
        });
    }
}
