/**
 * ContractSchemaMapper.ts
 * 
 * Maps SemanticType to complete Zod schema strings.
 * Consumes SemanticTypeResolver SSOT and ZodSchemaLowerer domain engine.
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { FileValidationConstraints, FileValidationConstraintVisitor } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { toZodSchemaExpression, UNKNOWN_REFERENCE_STRATEGY } from '../../domain/common/ZodSchemaLowerer';
import { matchResolvedSemanticType, type ResolvedSemanticType } from '../../domain/common/ResolvedSemanticType';
import { PrimitiveTypeRegistry } from './PrimitiveTypeRegistry';
import { ZodModifierBuilder } from './ZodModifierBuilder';

/**
 * Field configuration for schema mapping
 */
export interface FieldConfig {
    readonly fieldName: string;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly fileConstraints: FileValidationConstraints;
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
        const baseSchema = type.accept({
            primitive: value => this.applyFileConstraints(this.primitiveRegistry.getZodSchema(value), config.fileConstraints),
            reference: () => 'z.unknown()',
            jsonValue: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            optional: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            nullable: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            never: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            error: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            union: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            intersection: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            readonlyCollection: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            mutableCollection: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            generic: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY }),
            object: () => toZodSchemaExpression(resolved, { referenceStrategy: UNKNOWN_REFERENCE_STRATEGY })
        });

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

    private applyFileConstraints(schema: string, constraints: FileValidationConstraints): string {
        return constraints.reduce((current, constraint) => constraint.accept<string>(this.fileConstraintRenderer(current)), schema);
    }

    private fileConstraintRenderer(schema: string): FileValidationConstraintVisitor<string> {
        return {
            image: () => `${schema}.refine((file) => file.type.startsWith('image/'), { message: 'Unsupported file type' })`,
            extensions: value => `${schema}.refine((file) => ${value.values.map(extension => `(file.name.toLowerCase().endsWith('.${extension.toLowerCase()}'))`).join(' || ')}, { message: 'Unsupported file type' })`,
            mimeTypes: value => `${schema}.refine((file) => ${value.values.map(mimeType => `(file.type === '${mimeType}')`).join(' || ')}, { message: 'Unsupported file type' })`,
            maxBytes: value => `${schema}.refine((file) => file.size <= ${value.value}, { message: 'File is too large' })`
        };
    }

    private needsImport(type: SemanticType): boolean {
        return type.accept({
            primitive: value => this.primitiveRegistry.supports(value),
            reference: () => true,
            jsonValue: () => false,
            optional: () => false,
            nullable: () => false,
            never: () => false,
            error: () => false,
            union: () => false,
            intersection: () => false,
            readonlyCollection: () => false,
            mutableCollection: () => false,
            generic: () => false,
            object: () => false
        });
    }

    private getReferencedTypes(type: SemanticType): readonly string[] {
        const resolved = this.resolver.resolve(type);
        return this.collectReferencedTypes(resolved);
    }

    private collectReferencedTypes(resolved: ResolvedSemanticType): readonly string[] {
        return matchResolvedSemanticType(resolved, {
            reference: value => [value.name],
            object: value => value.fields.flatMap(field => this.collectReferencedTypes(field.type)),
            collection: value => this.collectReferencedTypes(value.elementType),
            nullable: value => this.collectReferencedTypes(value.innerType),
            union: value => value.members.flatMap(member => this.collectReferencedTypes(member)),
            intersection: value => value.members.flatMap(member => this.collectReferencedTypes(member)),
            primitive: () => [],
            optional: value => this.collectReferencedTypes(value.innerType),
            unknown: () => []
        });
    }

}
