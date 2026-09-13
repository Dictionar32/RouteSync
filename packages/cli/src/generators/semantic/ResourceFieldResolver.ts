/**
 * @file ResourceFieldResolver.ts
 * @description Sub-domain for recursive resource field resolution and AST property matching.
 * Active Consumer orchestrating recursive traversal and field mapping.
 *
 * @module cli/generators/semantic/ResourceFieldResolver
 */

import type {
    CompilerIR,
    ResolvedField,
    FieldResolutionMeta
} from './semanticTypes';
import type { SemanticResolutionContext } from './SemanticResolutionContext';
import { FieldTypeMapper } from './FieldTypeMapper';
import { resolveSingleResourceField, buildFieldMap } from './resource-field';

export class ResourceFieldResolver {
    public static resolveFieldMappings(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        for (const model of context.modelsByName.values()) {
            for (const column of model.columns) {
                const mappingKey = `${model.name}.${column.name}`;
                if (ir.fieldMappings.has(mappingKey)) continue;

                try {
                    const cast = model.casts.get(column.name);
                    const meta: FieldResolutionMeta = {
                        type: column.type,
                        cast,
                        nullable: column.nullable,
                    };
                    const resolved = FieldTypeMapper.resolveField(column.name, meta);
                    ir.fieldMappings.set(mappingKey, resolved);
                } catch (error) {
                    ir.metadata.warnings.push(`Failed to resolve field ${mappingKey}: ${error}`);
                }
            }
        }

        for (const resource of context.resources) {
            if (!resource.fields || typeof resource.fields !== 'object') continue;
            this.resolveResourceFieldsRecursive(
                resource.name,
                resource.fields as Record<string, unknown>,
                context,
                ir,
                resource.name
            );
        }
    }

    public static resolveResourceFieldsRecursive(
        resourceName: string,
        fields: Record<string, unknown>,
        context: SemanticResolutionContext,
        ir: CompilerIR,
        pathPrefix: string,
    ): void {
        for (const [fieldName, fieldDefRaw] of Object.entries(fields)) {
            const fieldPath = `${pathPrefix}.${fieldName}`;
            if (!fieldDefRaw || typeof fieldDefRaw !== 'object') continue;
            const fieldDef = fieldDefRaw as Record<string, unknown>;

            if (fieldDef.kind === 'object' && fieldDef.fields && typeof fieldDef.fields === 'object') {
                this.resolveResourceFieldsRecursive(
                    resourceName,
                    fieldDef.fields as Record<string, unknown>,
                    context,
                    ir,
                    fieldPath,
                );
                continue;
            }

            if (ir.fieldMappings.has(fieldPath)) continue;

            try {
                const resolved = this.resolveResourceField(fieldName, fieldDef, context, resourceName, fieldPath);
                ir.fieldMappings.set(fieldPath, resolved);
            } catch (error) {
                ir.metadata.warnings.push(`Failed to resolve resource field ${fieldPath}: ${error}`);
            }
        }
    }

    public static resolveResourceField(
        fieldName: string,
        fieldDef: Record<string, unknown>,
        context: SemanticResolutionContext,
        resourceName: string,
        fieldPath: string,
    ): ResolvedField {
        return resolveSingleResourceField(fieldName, fieldDef, context, resourceName, fieldPath);
    }

    public static buildFieldMap(meta: unknown): Map<string, ResolvedField> {
        return buildFieldMap(meta);
    }
}
