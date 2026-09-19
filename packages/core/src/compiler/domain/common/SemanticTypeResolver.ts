/**
 * SemanticTypeResolver.ts
 *
 * Active Consumer Orchestrator for transforming raw AST SemanticTypes
 * into target-agnostic structured ResolvedSemanticType domain value objects.
 * Pure flow declaration: coordinates handler strategy execution.
 *
 * @module compiler/domain/common
 */

import {
    type SemanticType
} from '../../types/SemanticType';
import type { ResourceFieldDescriptor } from '../../../types/domain/expressions';

import {
    ResolvedUnknownType,
    type ResolvedSemanticType
} from './ResolvedSemanticType';

import {
    type SemanticTypeResolverLike,
    type SemanticTypeHandler,
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler,
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler,
    createDefaultSemanticTypeHandlers
} from './semantic-resolver';

export {
    type SemanticTypeResolverLike,
    type SemanticTypeHandler,
    PrimitiveTypeHandler,
    ReferenceTypeHandler,
    CollectionTypeHandler,
    NullableWrapperHandler,
    DefaultObjectHandler,
    UnionTypeHandler,
    IntersectionTypeHandler
};

const DEFAULT_HANDLERS = createDefaultSemanticTypeHandlers();
const EMPTY_CUSTOM_HANDLERS: readonly SemanticTypeHandler[] = Object.freeze([]);

export interface SemanticTypeResolverParams {
    readonly customHandlers: readonly SemanticTypeHandler[];
}

export class SemanticTypeResolver implements SemanticTypeResolverLike {
    private readonly handlers: readonly SemanticTypeHandler[];

    constructor(params: SemanticTypeResolverParams);
    constructor(params?: { readonly customHandlers?: readonly SemanticTypeHandler[] });
    constructor({ customHandlers = EMPTY_CUSTOM_HANDLERS }: { readonly customHandlers?: readonly SemanticTypeHandler[] } = {}) {
        this.handlers = Object.freeze([...customHandlers, ...DEFAULT_HANDLERS]);
    }

    public static default(): SemanticTypeResolver {
        return new SemanticTypeResolver({ customHandlers: EMPTY_CUSTOM_HANDLERS });
    }

    public static withHandlers(customHandlers: readonly SemanticTypeHandler[]): SemanticTypeResolver {
        return new SemanticTypeResolver({ customHandlers });
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        for (const handler of this.handlers) {
            if (handler.supports(type)) {
                return handler.resolve(type, this);
            }
        }
        return new ResolvedUnknownType({
            diagnosticMessage: `unsupported SemanticType kind '${type.kind}'`
        });
    }

    public static resolveField(field: ResourceFieldDescriptor): SemanticType {
        if (field.semantic.kind !== 'verified') {
            throw new Error(`Resource field semantic rejected: ${field.semantic.bound.reason}`);
        }
        return field.semantic.type;
    }
}
