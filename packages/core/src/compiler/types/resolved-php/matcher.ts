/** Catamorphic pattern matcher for the resolved PHP type algebra. */

import { relationEqual, relationResolve } from '../../../semantic/kernel/semanticRelations';
import { relationOptionFold } from '../../../semantic/kernel/relationalSequence';
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
    const kind = type.kind;
    return relationResolve(relationEqual(kind, 'primitive'), () => visitor.primitive(type as PrimitivePhpType), () => relationResolve(
        relationEqual(kind, 'model'),
        () => visitor.model(type as EloquentModelPhpType),
        () => relationResolve(
            relationEqual(kind, 'resource'),
            () => visitor.resource(type as ResourceWrapperPhpType),
            () => relationResolve(relationEqual(kind, 'void'), () => visitor.void(type as VoidPhpType), () => visitor.unknown(type as UnknownPhpType)),
        ),
    ));
}
