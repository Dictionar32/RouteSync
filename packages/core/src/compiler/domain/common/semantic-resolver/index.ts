/**
 * semantic-resolver/index.ts
 *
 * Explicit named exports for semantic type resolving handlers.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/domain/common/semantic-resolver
 */

export type {
    SemanticTypeResolverLike,
    SemanticTypeHandler
} from './resolverContracts';

export {
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler
} from './primitiveHandlers';

export {
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler
} from './compoundHandlers';

import type { SemanticTypeHandler } from './resolverContracts';
import {
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler
} from './primitiveHandlers';
import {
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler
} from './compoundHandlers';

export function createDefaultSemanticTypeHandlers(): readonly SemanticTypeHandler[] {
    return Object.freeze([
        new PrimitiveTypeHandler(),
        new ReferenceTypeHandler(),
        new CollectionTypeHandler(),
        new NullableWrapperHandler(),
        new DefaultObjectHandler(),
        new UnionTypeHandler(),
        new IntersectionTypeHandler()
    ]);
}
