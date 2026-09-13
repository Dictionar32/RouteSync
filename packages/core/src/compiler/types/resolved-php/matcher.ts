/**
 * matcher.ts
 *
 * Catamorphic pattern matcher and visitor interface for ResolvedPhpType.
 *
 * @module compiler/types/resolved-php
 */

import {
    PrimitivePhpType,
    EloquentModelPhpType,
    ResourceWrapperPhpType,
    VoidPhpType,
    UnknownPhpType
} from './variants';

export interface ResolvedPhpTypeVisitor<R> {
    readonly primitive: (type: PrimitivePhpType) => R;
    readonly model: (type: EloquentModelPhpType) => R;
    readonly resource: (type: ResourceWrapperPhpType) => R;
    readonly void: (type: VoidPhpType) => R;
    readonly unknown: (type: UnknownPhpType) => R;
}

export type ResolvedPhpType =
    | PrimitivePhpType
    | EloquentModelPhpType
    | ResourceWrapperPhpType
    | VoidPhpType
    | UnknownPhpType;

/**
 * Catamorphic pattern matcher (0 'if', 0 'switch' in caller).
 */
export function matchResolvedPhpType<R>(
    type: ResolvedPhpType,
    visitor: ResolvedPhpTypeVisitor<R>
): R {
    switch (type.kind) {
        case 'primitive':
            return visitor.primitive(type);
        case 'model':
            return visitor.model(type);
        case 'resource':
            return visitor.resource(type);
        case 'void':
            return visitor.void(type);
        case 'unknown':
            return visitor.unknown(type);
    }
}
