/**
 * @file TypeConverter.ts
 * @description Sub-domain transformer mapping SemanticType to TypeScript Target AST nodes
 *
 * @module compiler/generators/typescript/domain/TypeConverter
 */

import type { SemanticType } from '../../../types/SemanticType';
import { TSTypeReference } from '../../../target/typescript/nodes/TSTypeReference';
import { TSArrayType } from '../../../target/typescript/nodes/TSArrayType';
import { TSUnionType } from '../../../target/typescript/nodes/TSUnionType';
import { TSIntersectionType } from '../../../target/typescript/nodes/TSIntersectionType';
import { TypeConversionError } from './generatorErrors';
import type { ImportTracker } from './ImportTracker';
import { CompositeTypeConverter } from './CompositeTypeConverter';

const PRIMITIVE_MAP: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'datetime': 'string',
    'file': 'File',
    'unknown': 'unknown'
};

export class TypeConverter {
    private readonly compositeConverter: CompositeTypeConverter;
    private syntheticTypeCounter = 0;

    constructor(
        private readonly importTracker: ImportTracker,
        private readonly generatedTypes: Set<string>
    ) {
        this.compositeConverter = new CompositeTypeConverter(
            (type) => this.semanticTypeToTSType(type),
            (typeName) => this.importTracker.collectImportRequirement(typeName, this.generatedTypes)
        );
    }

    public reset(): void {
        this.syntheticTypeCounter = 0;
    }

    public semanticTypeToTSType(
        semanticType: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        switch (semanticType.kind) {
            case 'primitive':
                return this.convertPrimitiveType(semanticType);
            case 'reference':
                return this.convertReferenceType(semanticType);
            case 'readonly_collection':
            case 'mutable_collection':
                return this.compositeConverter.convertCollectionType(semanticType);
            case 'union':
                return this.compositeConverter.convertUnionType(semanticType);
            case 'intersection':
                return this.compositeConverter.convertIntersectionType(semanticType);
            case 'never':
                return new TSTypeReference('never');
            case 'error':
                return new TSTypeReference('unknown');
            case 'generic':
                return this.convertGenericType(semanticType);
            case 'object':
                return this.convertObjectType(semanticType);
        }
    }

    public convertPrimitiveType(type: SemanticType): TSTypeReference {
        if (type.kind !== 'primitive') {
            throw new TypeConversionError(
                `Expected primitive type, got ${type.kind}`,
                type,
                'Use semanticTypeToTSType() for non-primitive types'
            );
        }
        return new TSTypeReference(PRIMITIVE_MAP[type.type] || 'unknown');
    }

    public convertReferenceType(type: SemanticType): TSTypeReference {
        if (type.kind !== 'reference') {
            throw new TypeConversionError(
                `Expected reference type, got ${type.kind}`,
                type,
                'Reference types are custom types like User, Product, etc.'
            );
        }
        this.importTracker.collectImportRequirement(type.name, this.generatedTypes);
        return new TSTypeReference(type.name);
    }

    public convertGenericType(type: SemanticType): TSTypeReference {
        if (type.kind !== 'generic') {
            throw new Error('Expected generic type');
        }

        const baseTypeRef = this.convertReferenceType(type.base);
        if (type.parameters.length === 0) {
            return baseTypeRef;
        }

        const typeArgs: TSTypeReference[] = [];
        for (const param of type.parameters) {
            const paramType = this.semanticTypeToTSType(param.type);
            if (paramType instanceof TSTypeReference) {
                typeArgs.push(paramType);
            } else {
                throw new Error(`Complex generic parameter not yet supported: ${param.type.kind}`);
            }
        }

        return new TSTypeReference(baseTypeRef.name, typeArgs, false);
    }

    public convertObjectType(type: SemanticType): TSTypeReference {
        if (type.kind !== 'object') {
            throw new Error('Expected object type');
        }

        const propertyCount = type.properties.entries().length;
        const hasInheritance = type.baseObject !== undefined ||
            (type.interfaces && type.interfaces.length > 0);

        if (propertyCount > 3 || hasInheritance) {
            const syntheticName = `SyntheticType_${++this.syntheticTypeCounter}`;
            if (type.baseObject && type.baseObject.kind === 'reference') {
                this.importTracker.collectImportRequirement(type.baseObject.name, this.generatedTypes);
            }
            if (type.interfaces) {
                for (const iface of type.interfaces) {
                    if (iface.kind === 'reference') {
                        this.importTracker.collectImportRequirement(iface.name, this.generatedTypes);
                    }
                }
            }
            for (const [, propType] of type.properties.entries()) {
                this.importTracker.collectPropertyTypeImports(propType, this.generatedTypes);
            }
            return new TSTypeReference(syntheticName);
        }

        if (propertyCount > 0) {
            const propLines: string[] = [];
            for (const [propName, propType] of type.properties.entries()) {
                this.importTracker.collectPropertyTypeImports(propType, this.generatedTypes);
                const tsType = this.semanticTypeToTSType(propType);
                propLines.push(`  ${propName}: ${tsType.name};`);
            }
            return new TSTypeReference(`{\n${propLines.join('\n')}\n}`);
        }

        return new TSTypeReference('object');
    }
}
