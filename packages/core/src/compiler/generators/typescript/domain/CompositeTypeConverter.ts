/**
 * @file CompositeTypeConverter.ts
 * @description Sub-domain converter for collection, union, and intersection semantic types
 *
 * @module compiler/generators/typescript/domain/CompositeTypeConverter
 */

import type { SemanticType } from '../../../types/SemanticType';
import { TSArrayType } from '../../../target/typescript/nodes/TSArrayType';
import { TSUnionType } from '../../../target/typescript/nodes/TSUnionType';
import { TSIntersectionType } from '../../../target/typescript/nodes/TSIntersectionType';
import { TSTypeReference } from '../../../target/typescript/nodes/TSTypeReference';

export type SemanticTypeMapper = (type: SemanticType) => TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType;

export class CompositeTypeConverter {
    constructor(
        private readonly mapper: SemanticTypeMapper,
        private readonly onRequireImport: (typeName: string) => void
    ) {}

    public convertCollectionType(type: SemanticType): TSTypeReference | TSArrayType | TSUnionType {
        if (type.kind !== 'readonly_collection' && type.kind !== 'mutable_collection') {
            throw new Error('Expected collection type');
        }

        const isReadonly = type.kind === 'readonly_collection';
        const elementType = this.mapper(type.elementType);

        switch (type.collectionKind) {
            case 'array':
                return new TSArrayType(elementType, isReadonly);

            case 'collection':
                this.onRequireImport('Collection');
                return new TSArrayType(elementType, isReadonly);

            case 'nullable': {
                const nullType = new TSTypeReference('null');
                const nullableElement = new TSUnionType([elementType, nullType]);
                return new TSArrayType(nullableElement, isReadonly);
            }

            default:
                return new TSArrayType(elementType, isReadonly);
        }
    }

    public convertUnionType(type: SemanticType): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        if (type.kind !== 'union') {
            throw new Error('Expected union type');
        }

        const members = Array.from(type.members.values());
        if (members.length === 0) return new TSTypeReference('never');
        if (members.length === 1) return this.mapper(members[0]);

        return new TSUnionType(members.map(member => this.mapper(member)));
    }

    public convertIntersectionType(type: SemanticType): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        if (type.kind !== 'intersection') {
            throw new Error('Expected intersection type');
        }

        const members = Array.from(type.members.values());
        if (members.length === 0) return new TSTypeReference('never');
        if (members.length === 1) return this.mapper(members[0]);

        return new TSIntersectionType(members.map(member => this.mapper(member)));
    }
}
