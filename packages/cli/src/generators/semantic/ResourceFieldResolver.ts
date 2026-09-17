/** Resource/model field lowering from verified manifest descriptors. */
import { NullableType, SemanticTypeResolver, camelCase } from '@routesync/core';
import { toTypeScriptTypeExpression } from '@routesync/core';
import { toZodSchemaExpression } from '@routesync/core';
import type { ParsedModel, ParsedResource, ResourceFieldDescriptor } from '@routesync/core';
import type { CompilerIR, ResolvedField } from './semanticTypes';
import type { SemanticResolutionContext } from './SemanticResolutionContext';
import { resolveSingleResourceField } from './resource-field';

const resolver = SemanticTypeResolver.default();

export class ResourceFieldResolver {
    public static resolveFieldMappings(context: SemanticResolutionContext, ir: CompilerIR): void {
        for (const model of context.models) {
            this.resolveModelFields(model, ir);
        }
        for (const resource of context.resources) {
            this.resolveResourceFieldsRecursive(resource.fields, ir.fieldMappings, resource.name);
        }
    }

    public static buildResponseFields(resource: ParsedResource): Map<string, ResolvedField> {
        const fields = new Map<string, ResolvedField>();
        this.resolveResourceFieldsRecursive(resource.fields, fields, resource.name);
        return fields;
    }

    public static buildModelFields(model: ParsedModel): Map<string, ResolvedField> {
        const fields = new Map<string, ResolvedField>();
        for (const column of model.columns) {
            fields.set(column.name, this.resolveModelField(column));
        }
        return fields;
    }

    public static resolve(field: ResourceFieldDescriptor): ResolvedField {
        return resolveSingleResourceField(field);
    }

    private static resolveModelFields(model: ParsedModel, ir: CompilerIR): void {
        for (const column of model.columns) {
            const key = `${model.name}.${column.name}`;
            if (ir.fieldMappings.has(key)) continue;
            ir.fieldMappings.set(key, this.resolveModelField(column));
        }
    }

    private static resolveModelField(column: ParsedModel['columns'][number]): ResolvedField {
        const semanticType = column.nullability.kind === 'nullable'
            ? new NullableType(column.semanticType)
            : column.semanticType;
        const resolved = resolver.resolve(semanticType);
        return Object.freeze({
            name: camelCase(column.name),
            sourceName: column.name,
            semanticType: resolved,
            zodType: toZodSchemaExpression(resolved),
            tsType: toTypeScriptTypeExpression(resolved),
            origin: { kind: 'model_column', columnName: column.name } as const,
        });
    }

    private static resolveResourceFieldsRecursive(
        fields: readonly ResourceFieldDescriptor[],
        fieldMappings: Map<string, ResolvedField>,
        pathPrefix: string,
    ): void {
        for (const field of fields) {
            const fieldPath = `${pathPrefix}.${field.name}`;
            if (field.expression.kind === 'object') {
                this.resolveResourceFieldsRecursive(field.expression.fields, fieldMappings, fieldPath);
                continue;
            }
            if (fieldMappings.has(fieldPath)) continue;
            fieldMappings.set(fieldPath, resolveSingleResourceField(field));
        }
    }
}
