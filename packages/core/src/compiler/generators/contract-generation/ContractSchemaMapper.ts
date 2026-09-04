/**
 * ContractSchemaMapper.ts
 * 
 * Maps SemanticType to complete Zod schema strings.
 * Consumes SemanticTypeResolver SSOT and ZodSchemaLowerer domain engine.
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType, PrimitiveType } from '../../types/SemanticType';
import type { FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { toZodSchemaExpression } from '../../domain/common/ZodSchemaLowerer';
import type { ResolvedSemanticType } from '../../domain/common/ResolvedSemanticType';
import { PrimitiveTypeRegistry } from './PrimitiveTypeRegistry';
import { ZodModifierBuilder } from './ZodModifierBuilder';

/**
 * Field configuration for schema mapping
 */
export interface FieldConfig {
    readonly fieldName: string;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly fileConstraints?: FileValidationConstraints;
}

/**
 * Mapped schema result
 */
export interface MappedSchema {
    readonly zodSchema: string;
    readonly needsImport: boolean;
    readonly referencedTypes: readonly string[];
}

export class ContractSchemaMapper {
    constructor(
        private readonly primitiveRegistry: PrimitiveTypeRegistry = new PrimitiveTypeRegistry(),
        private readonly modifierBuilder: ZodModifierBuilder = new ZodModifierBuilder(),
        private readonly resolver: SemanticTypeResolver = defaultTypeResolver
    ) { }

    /**
     * Map SemanticType to complete Zod schema string
     */
    mapToZodSchema(type: SemanticType, config: FieldConfig): MappedSchema {
        const resolved = this.resolver.resolve(type);
        let baseSchema = toZodSchemaExpression(resolved, { singleLine: true, referenceFallbackToUnknown: true });

        if (type.kind === 'reference') {
            baseSchema = 'z.unknown()';
        } else if (resolved.kind === 'primitive' && resolved.primitiveKind === 'file') {
            baseSchema = "z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)";
            if (config.fileConstraints) {
                baseSchema = this.applyFileConstraints(baseSchema, config.fileConstraints);
            }
        }

        const modifiers = this.modifierBuilder.buildModifiers({
            required: config.required,
            nullable: config.nullable
        });

        return {
            zodSchema: baseSchema + modifiers,
            needsImport: this.needsImport(type),
            referencedTypes: this.getReferencedTypes(type)
        };
    }

    private applyFileConstraints(
        schema: string,
        constraints?: FileValidationConstraints
    ): string {
        if (!constraints) return schema;

        const mimeTypes = new Set<string>(constraints.mimeTypes ?? []);
        for (const extension of constraints.extensions ?? []) {
            const mimeType = this.mimeTypeForExtension(extension);
            if (mimeType) mimeTypes.add(mimeType);
        }

        let result = schema;
        const conditions: string[] = [];
        if (constraints.image) {
            conditions.push("file.type.startsWith('image/')");
        }
        if (mimeTypes.size > 0) {
            conditions.push(Array.from(mimeTypes)
                .map(mimeType => `file.type === '${mimeType}'`)
                .join(' || '));
        }
        if (conditions.length > 0) {
            result += `.refine((file) => ${conditions.map(condition => `(${condition})`).join(' && ')}, { message: 'Unsupported file type' })`;
        }
        if (constraints.maxBytes !== undefined) {
            result += `.refine((file) => file.size <= ${constraints.maxBytes}, { message: 'File is too large' })`;
        }

        return result;
    }

    private mimeTypeForExtension(extension: string): string | undefined {
        const ext = extension.toLowerCase().replace(/^\./, '');
        const map: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            pdf: 'application/pdf'
        };
        return map[ext];
    }

    private needsImport(type: SemanticType): boolean {
        if (type.kind === 'primitive' && this.primitiveRegistry && typeof this.primitiveRegistry.supports === 'function') {
            return this.primitiveRegistry.supports(type as PrimitiveType);
        }
        const resolved = this.resolver.resolve(type);
        return resolved.kind === 'reference';
    }

    private getReferencedTypes(type: SemanticType): readonly string[] {
        const resolved = this.resolver.resolve(type);
        return this.collectReferencedTypes(resolved);
    }

    private collectReferencedTypes(resolved: ResolvedSemanticType): readonly string[] {
        switch (resolved.kind) {
            case 'reference':
                return [resolved.name];
            case 'object': {
                const refs: string[] = [];
                for (const [, fieldType] of resolved.fields) {
                    refs.push(...this.collectReferencedTypes(fieldType));
                }
                return refs;
            }
            case 'collection':
                return this.collectReferencedTypes(resolved.elementType);
            case 'nullable':
                return this.collectReferencedTypes(resolved.innerType);
            case 'union':
            case 'intersection':
                return resolved.members.flatMap(m => this.collectReferencedTypes(m));
            default:
                return [];
        }
    }
}
