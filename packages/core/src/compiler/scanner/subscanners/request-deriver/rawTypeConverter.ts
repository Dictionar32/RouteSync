/**
 * rawTypeConverter.ts
 *
 * Converts raw AST types to canonical SemanticType instances.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { DatabaseColumnTypeMapper } from "../../../../types/route";
import {
    ObjectType,
    PrimitiveType,
    PrimitiveKind,
    ReadonlyCollectionType,
    CollectionKind,
    ReferenceType,
    SemanticType
} from "../../../types/SemanticType";
import { TypeInterner } from "../../../types/TypeInterner";
import { resolvePrimitiveKind } from "../typeDeriverUtils";

export function convertRawToSemanticType(
    raw: any,
    modelIndex: ReadonlyMap<string, any>,
    interner: TypeInterner
): SemanticType {
    if (!raw) return interner.intern(new PrimitiveType(PrimitiveKind.STRING));

    if (raw.kind === 'primitive') {
        const primKind = resolvePrimitiveKind(raw.type);
        return interner.intern(new PrimitiveType(primKind));
    }

    if (raw.kind === 'model') {
        const m = modelIndex.get(raw.model) || modelIndex.get(String(raw.model).toLowerCase());
        if (m && m.columns) {
            const properties = m.columns.map(col => {
                const primKind = col.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(col.type);
                return { name: col.name, type: interner.intern(new PrimitiveType(primKind)), required: true, nullable: false, description: '' };
            });
            return new ObjectType({ name: raw.model, baseName: raw.model, properties, role: 'model' });
        }
        return new ReferenceType('App\\Models', raw.model);
    }

    if (
        raw.kind === 'static_method_call' ||
        raw.kind === 'resource' ||
        (raw.resolved && (raw.resolved.type === 'resource' || raw.resolved.resource))
    ) {
        const resInfo = raw.resolved || raw;
        const resName = resInfo.resource || raw.className || resInfo.model;
        const isCollection = resInfo.collection === true || raw.name === 'collection';
        if (resName) {
            const refType = new ReferenceType('App\\Http\\Resources', resName);
            if (isCollection) {
                return interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, refType));
            }
            return refType;
        }
    }

    if (raw.kind === 'array') {
        const elemType = convertRawToSemanticType(raw.element, modelIndex, interner);
        return new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
    }

    if (raw.kind === 'object' || raw.fields) {
        const childFields = raw.fields || {};
        const properties = Object.entries(childFields).map(([name, value]) => ({
            name,
            type: convertRawToSemanticType(value, modelIndex, interner),
            required: true,
            nullable: false,
            description: ''
        }));
        return new ObjectType({ name: 'InlineObject', baseName: 'InlineObject', properties, role: 'plain' });
    }

    return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
}
