/**
 * @file TypeConverter.ts
 * @description Sub-domain transformer mapping SemanticType to TypeScript Target AST nodes
 *
 * @module compiler/generators/typescript/domain/TypeConverter
 */

import type { SemanticType, SemanticTypeVisitor, PrimitiveType, ReferenceType, GenericType, ObjectType } from '../../../types/SemanticType';
import { TSTypeReference } from '../../../target/typescript/nodes/TSTypeReference';
import { TSArrayType } from '../../../target/typescript/nodes/TSArrayType';
import { TSUnionType } from '../../../target/typescript/nodes/TSUnionType';
import { TSIntersectionType } from '../../../target/typescript/nodes/TSIntersectionType';
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
        return semanticType.accept(this.createVisitor());
    }

    private createVisitor(): SemanticTypeVisitor<
        TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType
    > {
        return {
            primitive: (type) => this.convertPrimitiveType(type),
            jsonValue: () => new TSTypeReference('unknown'),
            optional: (type) => this.semanticTypeToTSType(type.innerType),
            nullable: (type) => new TSUnionType([
                this.semanticTypeToTSType(type.innerType),
                new TSTypeReference('null')
            ]),
            never: () => new TSTypeReference('never'),
            error: () => new TSTypeReference('unknown'),
            reference: (type) => this.convertReferenceType(type),
            union: (type) => this.compositeConverter.convertUnionType(type),
            intersection: (type) => this.compositeConverter.convertIntersectionType(type),
            readonlyCollection: (type) => this.compositeConverter.convertCollectionType(type),
            mutableCollection: (type) => this.compositeConverter.convertCollectionType(type),
            generic: (type) => this.convertGenericType(type),
            object: (type) => this.convertObjectType(type)
        };
    }

    public convertPrimitiveType(type: PrimitiveType): TSTypeReference {
        return new TSTypeReference(PRIMITIVE_MAP[type.type] || 'unknown');
    }

    public convertReferenceType(type: ReferenceType): TSTypeReference {
        this.importTracker.collectImportRequirement(type.name, this.generatedTypes);
        return new TSTypeReference(type.name);
    }

    private requireReferenceType(
        type: TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType,
        source: SemanticType
    ): TSTypeReference {
        if (type.kind === 'type-reference') return type;
        throw new Error(`Complex generic parameter not yet supported: ${source.kind}`);
    }

    public convertGenericType(type: GenericType): TSTypeReference {
        const baseTypeRef = this.convertReferenceType(type.base);
        const typeArgs: TSTypeReference[] = [];
        for (const param of type.parameters) {
            typeArgs.push(this.requireReferenceType(this.semanticTypeToTSType(param.type), param.type));
        }

        return new TSTypeReference(baseTypeRef.name, typeArgs, false);
    }

    public convertObjectType(type: ObjectType): TSTypeReference {
        const propertyCount = type.properties.length;
        const hasInheritance = type.baseObject !== undefined ||
            (type.interfaces && type.interfaces.length > 0);

        if (propertyCount > 3 || hasInheritance) {
            const syntheticName = `SyntheticType_${++this.syntheticTypeCounter}`;
            if (type.baseObject) {
                this.importTracker.collectImportRequirement(type.baseObject.name, this.generatedTypes);
            }
            for (const iface of type.interfaces) {
                this.importTracker.collectImportRequirement(iface.name, this.generatedTypes);
            }
            for (const property of type.properties) {
                this.importTracker.collectPropertyTypeImports(property.type, this.generatedTypes);
            }
            return new TSTypeReference(syntheticName);
        }

        if (propertyCount > 0) {
            const propLines: string[] = [];
            for (const property of type.properties) {
                this.importTracker.collectPropertyTypeImports(property.type, this.generatedTypes);
                const tsType = this.semanticTypeToTSType(property.type);
                propLines.push(`  ${property.name}: ${tsType.name};`);
            }
            return new TSTypeReference(`{\n${propLines.join('\n')}\n}`);
        }

        return new TSTypeReference('object');
    }
}
