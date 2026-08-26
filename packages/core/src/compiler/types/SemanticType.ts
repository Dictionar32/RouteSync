/**
 * @module compiler/types/SemanticType
 * @description Core semantic type system for RouteSync compiler
 * 
 * Defines the type hierarchy used throughout semantic analysis:
 * - Primitive types (string, number, boolean, datetime, file, unknown)
 * - Reference types (named types from Laravel models/resources)
 * - Collection types (arrays, nullable, etc.)
 * - Generic types with variance support
 * - Object types with structural typing
 * - Union and intersection types
 */

import { ImmutableMap, ImmutableSet } from '../utils/ImmutableCollections';

/**
 * Primitive type kinds supported by the type system.
 */
export enum PrimitiveKind {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATETIME = 'datetime',
    /** Browser File submitted through multipart/form-data. */
    FILE = 'file',
    UNKNOWN = 'unknown'
}

/**
 * Collection type kinds for wrapping element types.
 */
export enum CollectionKind {
    ARRAY = 'array',
    COLLECTION = 'collection',
    NULLABLE = 'nullable'
}

/**
 * Brand symbol for semantic type safety - prevents mixing with other types.
 */
const semanticTypeBrand: unique symbol = Symbol('semanticTypeBrand');

/**
 * Base class for all semantic types.
 * Uses a brand to prevent accidental type confusion at runtime.
 */
export abstract class SemanticTypeBase {
    protected readonly [semanticTypeBrand] = true;
}

/**
 * Primitive type node - represents basic scalar types.
 * 
 * @example
 * ```typescript
 * const stringType = new PrimitiveType(PrimitiveKind.STRING);
 * const numberType = new PrimitiveType(PrimitiveKind.NUMBER);
 * ```
 */
export type PrimitiveKindValue =
    | PrimitiveKind
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'file'
    | 'unknown';

const primitiveKindByValue: Readonly<Record<
    'string' | 'number' | 'boolean' | 'datetime' | 'file' | 'unknown',
    PrimitiveKind
>> = {
    string: PrimitiveKind.STRING,
    number: PrimitiveKind.NUMBER,
    boolean: PrimitiveKind.BOOLEAN,
    datetime: PrimitiveKind.DATETIME,
    file: PrimitiveKind.FILE,
    unknown: PrimitiveKind.UNKNOWN,
};

function normalizePrimitiveKind(
    value: PrimitiveKindValue,
): PrimitiveKind {
    if (value === PrimitiveKind.STRING) return PrimitiveKind.STRING;
    if (value === PrimitiveKind.NUMBER) return PrimitiveKind.NUMBER;
    if (value === PrimitiveKind.BOOLEAN) return PrimitiveKind.BOOLEAN;
    if (value === PrimitiveKind.DATETIME) return PrimitiveKind.DATETIME;
    if (value === PrimitiveKind.FILE) return PrimitiveKind.FILE;
    if (value === PrimitiveKind.UNKNOWN) return PrimitiveKind.UNKNOWN;

    // Preserve an unrecognised runtime value so downstream registries can
    // report the actual unsupported kind instead of the misleading `undefined`.
    // The public constructor remains type-safe; this only matters for malformed
    // external data or deliberate test casts.
    return primitiveKindByValue[value] ?? (value as PrimitiveKind);
}

export class PrimitiveType extends SemanticTypeBase {
    readonly kind = 'primitive';
    readonly type: PrimitiveKind;

    constructor(type: PrimitiveKindValue) {
        super();
        this.type = normalizePrimitiveKind(type);
    }
}

/**
 * Never type - represents impossible/unreachable values.
 * Bottom type in the type hierarchy.
 */
export class NeverType extends SemanticTypeBase {
    readonly kind = 'never';
}

/**
 * Error type - represents a type error with diagnostic message.
 * Used to continue compilation after encountering type errors.
 */
export class ErrorType extends SemanticTypeBase {
    readonly kind = 'error';
    constructor(readonly diagnosticMessage: string) {
        super();
    }
}

/**
 * Reference type - represents named types (Laravel models, resources, etc.).
 * 
 * @example
 * ```typescript
 * const userType = new ReferenceType('App\\Models', 'User');
 * const productResource = new ReferenceType('App\\Http\\Resources', 'ProductResource');
 * ```
 */
export class ReferenceType extends SemanticTypeBase {
    readonly kind = 'reference';
    constructor(
        readonly namespace: string,
        readonly name: string
    ) {
        super();
    }
}

/**
 * Union type - represents a choice between multiple types (A | B | C).
 * 
 * @example
 * ```typescript
 * const stringOrNumber = new UnionType(
 *   new ImmutableSet(new Set([
 *     new PrimitiveType(PrimitiveKind.STRING),
 *     new PrimitiveType(PrimitiveKind.NUMBER)
 *   ]))
 * );
 * ```
 */
export class UnionType extends SemanticTypeBase {
    readonly kind = 'union';
    constructor(readonly members: ImmutableSet<SemanticType>) {
        super();
    }
}

/**
 * Intersection type - represents a combination of multiple types (A & B & C).
 * 
 * @example
 * ```typescript
 * const combined = new IntersectionType(
 *   new ImmutableSet(new Set([typeA, typeB]))
 * );
 * ```
 */
export class IntersectionType extends SemanticTypeBase {
    readonly kind = 'intersection';
    constructor(readonly members: ImmutableSet<SemanticType>) {
        super();
    }
}

/**
 * Readonly collection type - represents immutable collections.
 * Supports covariance for element types.
 * 
 * @example
 * ```typescript
 * const readonlyUsers = new ReadonlyCollectionType(
 *   CollectionKind.ARRAY,
 *   new ReferenceType('App\\Models', 'User')
 * );
 * ```
 */
export class ReadonlyCollectionType extends SemanticTypeBase {
    readonly kind = 'readonly_collection';
    constructor(
        readonly collectionKind: CollectionKind,
        readonly elementType: SemanticType
    ) {
        super();
    }
}

/**
 * Mutable collection type - represents mutable collections.
 * Requires invariance for element types (no covariance).
 * 
 * @example
 * ```typescript
 * const mutableUsers = new MutableCollectionType(
 *   CollectionKind.ARRAY,
 *   new ReferenceType('App\\Models', 'User')
 * );
 * ```
 */
export class MutableCollectionType extends SemanticTypeBase {
    readonly kind = 'mutable_collection';
    constructor(
        readonly collectionKind: CollectionKind,
        readonly elementType: SemanticType
    ) {
        super();
    }
}

/**
 * Generic variance annotation - controls subtyping behavior.
 * 
 * - covariant: Producer position (readonly), allows subtypes
 * - contravariant: Consumer position (writeonly), allows supertypes
 * - invariant: Both positions, requires exact type match
 */
export type GenericVariance = 'covariant' | 'contravariant' | 'invariant';

/**
 * Generic type parameter with variance annotation.
 */
export interface GenericParameter {
    readonly name: string;
    readonly variance: GenericVariance;
    readonly type: SemanticType;
}

/**
 * Generic type - represents parameterized types like Collection<T>.
 * 
 * @example
 * ```typescript
 * const collection = new GenericType(
 *   new ReferenceType('Illuminate\\Support', 'Collection'),
 *   [{ 
 *     name: 'T', 
 *     variance: 'covariant',
 *     type: new ReferenceType('App\\Models', 'User')
 *   }]
 * );
 * ```
 */
export class GenericType extends SemanticTypeBase {
    readonly kind = 'generic';
    constructor(
        readonly base: ReferenceType,
        readonly parameters: readonly GenericParameter[]
    ) {
        super();
    }
}

/**
 * Object type - represents structural object types with properties.
 * Supports inheritance and interface implementation.
 * 
 * @example
 * ```typescript
 * const userObject = new ObjectType(
 *   new ImmutableMap(new Map([
 *     ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
 *     ['name', new PrimitiveType(PrimitiveKind.STRING)]
 *   ])),
 *   new ImmutableSet(new Set(['id', 'name'])), // required props
 *   undefined, // no base object
 *   [], // no interfaces
 *   new ImmutableMap(new Map()) // no annotations
 * );
 * ```
 */
export class ObjectType extends SemanticTypeBase {
    readonly kind = 'object';
    constructor(
        readonly properties: ImmutableMap<string, SemanticType>,
        readonly requiredProperties: ImmutableSet<string>,
        readonly baseObject?: SemanticType,
        readonly interfaces?: readonly SemanticType[],
        readonly annotations?: ImmutableMap<string, string>
    ) {
        super();
    }
}

/**
 * Union type of all semantic types.
 * This is the main type used throughout semantic analysis.
 */
export type SemanticType =
    | PrimitiveType
    | NeverType
    | ErrorType
    | ReferenceType
    | UnionType
    | IntersectionType
    | ReadonlyCollectionType
    | MutableCollectionType
    | GenericType
    | ObjectType;
