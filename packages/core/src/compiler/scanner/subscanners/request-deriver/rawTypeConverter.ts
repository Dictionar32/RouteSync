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
import { ImmutableMap, ImmutableSet } from "../../../utils/ImmutableCollections";
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
            const propMap = new Map<string, SemanticType>();
            for (const col of m.columns) {
                const primKind = col.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(col.type);
                propMap.set(col.name, interner.intern(new PrimitiveType(primKind)));
            }
            return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
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
        const propMap = new Map<string, SemanticType>();
        for (const [k, v] of Object.entries(childFields)) {
            propMap.set(k, convertRawToSemanticType(v, modelIndex, interner));
        }
        return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
    }

    return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
}
