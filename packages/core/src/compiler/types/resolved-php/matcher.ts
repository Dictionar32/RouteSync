/** Catamorphic pattern matcher for the resolved PHP type algebra. */

import { relationVariantFold } from '../../../semantic/kernel/relationalSequence';
import { PrimitivePhpType, EloquentModelPhpType, ResourceWrapperPhpType, VoidPhpType, UnknownPhpType } from './variants';

export interface ResolvedPhpTypeVisitor<R> {
    readonly primitive: (type: PrimitivePhpType) => R;
    readonly model: (type: EloquentModelPhpType) => R;
    readonly resource: (type: ResourceWrapperPhpType) => R;
    readonly void: (type: VoidPhpType) => R;
    readonly unknown: (type: UnknownPhpType) => R;
}

export type ResolvedPhpType = PrimitivePhpType | EloquentModelPhpType | ResourceWrapperPhpType | VoidPhpType | UnknownPhpType;

export function matchResolvedPhpType<R>(type: ResolvedPhpType, visitor: ResolvedPhpTypeVisitor<R>): R {
    return relationVariantFold(
        type,
        'primitive',
        () => relationVariantFold(
            type,
            'model',
            () => relationVariantFold(
                type,
                'resource',
                () => relationVariantFold(
                    type,
                    'void',
                    () => relationVariantFold(type, 'unknown', () => { throw Error('Unreachable resolved PHP type variant'); }, visitor.unknown),
                    visitor.void,
                ),
                visitor.resource,
            ),
            visitor.model,
        ),
        visitor.primitive,
    );
}
