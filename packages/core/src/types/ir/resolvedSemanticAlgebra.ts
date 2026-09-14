/**
 * resolvedSemanticAlgebra.ts
 *
 * Pure Catamorphic Projector for ResolvedSemanticType ADT.
 * Table-driven O(1) dispatch: 0 'if', 0 'switch'.
 * Conforms to Rule 12 & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resolvedSemanticAlgebra
 */

import type {
    PrimitiveSemanticTypeIR,
    ResourceSemanticTypeIR,
    ModelSemanticTypeIR,
    ObjectSemanticTypeIR,
    ArraySemanticTypeIR,
    UnionSemanticTypeIR,
    LiteralSemanticTypeIR,
    ResolvedSemanticType
} from './resolvedSemanticTypes';

export interface ResolvedSemanticTypeVisitor<R> {
    readonly primitive: (type: PrimitiveSemanticTypeIR) => R;
    readonly resource: (type: ResourceSemanticTypeIR) => R;
    readonly model: (type: ModelSemanticTypeIR) => R;
    readonly object: (type: ObjectSemanticTypeIR) => R;
    readonly array: (type: ArraySemanticTypeIR) => R;
    readonly union: (type: UnionSemanticTypeIR) => R;
    readonly literal: (type: LiteralSemanticTypeIR) => R;
}

const DISPATCH_TABLE: {
    readonly [K in ResolvedSemanticType['kind']]: <R>(
        node: Extract<ResolvedSemanticType, { kind: K }>,
        visitor: ResolvedSemanticTypeVisitor<R>
    ) => R;
} = Object.freeze({
    primitive: (node, visitor) => visitor.primitive(node),
    resource: (node, visitor) => visitor.resource(node),
    model: (node, visitor) => visitor.model(node),
    object: (node, visitor) => visitor.object(node),
    array: (node, visitor) => visitor.array(node),
    union: (node, visitor) => visitor.union(node),
    literal: (node, visitor) => visitor.literal(node)
});

export function matchResolvedSemanticType<R>(
    type: ResolvedSemanticType,
    visitor: ResolvedSemanticTypeVisitor<R>
): R {
    const handler = DISPATCH_TABLE[type.kind];
    return handler(type as any, visitor);
}

export const matchResolvedSemanticTypeIR = matchResolvedSemanticType;
