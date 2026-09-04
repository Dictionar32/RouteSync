/**
 * ResolvedObjectType.ts
 *
 * Flow-Based Sealed Class Hierarchy for ObjectType Inspection & Lowering across Compiler Passes.
 *
 * @module compiler/domain/common
 */

import type { ObjectType, SemanticType } from '../../types/SemanticType';

/**
 * Options contract for NullableWrapperObject constructor
 */
export interface NullableWrapperObjectParams {
    readonly rawObject: ObjectType;
    readonly innerType: SemanticType;
}

/**
 * Options contract for PlainObject constructor
 */
export interface PlainObjectParams {
    readonly rawObject: ObjectType;
}

/**
 * Base Abstract Value Object for Resolved ObjectType (Domain View Boundary)
 */
export abstract class ResolvedObjectType {
    abstract readonly kind: 'plain' | 'nullable_wrapper';
    public readonly rawObject: ObjectType;

    /**
     * Named Options Object Contract for Base Abstract Class
     * (0% Positional Parameter, 0% Colons inside Destructured Parameter Object)
     */
    constructor({ rawObject }: PlainObjectParams) {
        this.rawObject = rawObject;
    }

    /**
     * Reusable Domain Helper: Extract clean user-land properties
     * (filters out internal meta properties starting with '__')
     */
    public getCleanProperties(): readonly (readonly [string, SemanticType])[] {
        if (Array.isArray(this.rawObject.properties)) {
            return (this.rawObject.properties as any[])
                .filter(p => typeof p.name === 'string' && !p.name.startsWith('__'))
                .map(p => [p.name, p.type] as const);
        }
        if (this.rawObject.properties && typeof (this.rawObject.properties as any).entries === 'function') {
            return Array.from((this.rawObject.properties as any).entries())
                .filter(([key]: any) => typeof key === 'string' && !key.startsWith('__'));
        }
        return [];
    }
}

/**
 * ObjectType representing a Nullable Wrapper (e.g. ?-> or nullable resource wrapper)
 * Guarantees unwrapped innerType at compile-time boundary
 */
export class NullableWrapperObject extends ResolvedObjectType {
    public readonly kind = 'nullable_wrapper' as const;
    public readonly innerType: SemanticType;

    constructor({ rawObject, innerType }: NullableWrapperObjectParams) {
        super({ rawObject });
        this.innerType = innerType;
        Object.freeze(this);
    }
}

/**
 * ObjectType representing a Standard Structural Object
 */
export class PlainObject extends ResolvedObjectType {
    public readonly kind = 'plain' as const;

    constructor({ rawObject }: PlainObjectParams) {
        super({ rawObject });
        Object.freeze(this);
    }
}

/**
 * Discriminated Union of all resolved ObjectType variants
 */
export type ResolvedObjectTypeUnion = NullableWrapperObject | PlainObject;

/**
 * Pure Factory Boundary: Resolves raw unstructured ObjectType AST into a Structured Domain Value Object
 * (Single Source of Truth for ObjectType annotation & property inspection)
 * (0% Ternary Operator ? :, 0% !== inequality checks - Pure Switch Pattern Matching)
 */
export function resolveObjectType(rawObject: ObjectType): ResolvedObjectTypeUnion {
    const kindAnnotation = rawObject.annotations?.get ? rawObject.annotations.get('kind') : (rawObject as any)?.metadata?.get?.('kind');

    switch (kindAnnotation) {
        case 'nullable_wrapper': {
            let innerType: SemanticType | undefined = undefined;
            if (typeof (rawObject.properties as any)?.get === 'function') {
                innerType = (rawObject.properties as any).get('__value');
            } else if (Array.isArray(rawObject.properties)) {
                innerType = (rawObject.properties as any[]).find(p => p.name === '__value')?.type;
            }

            switch (innerType) {
                case undefined:
                    return new PlainObject({ rawObject });
                default:
                    return new NullableWrapperObject({ rawObject, innerType });
            }
        }

        default:
            return new PlainObject({ rawObject });
    }
}
