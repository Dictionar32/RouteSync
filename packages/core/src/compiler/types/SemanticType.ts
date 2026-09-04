/**
 * SemanticType.ts — First-Class Semantic Type AST for RouteSync Compiler.
 * Pure Structured Domain Model (0 wrapper hacks, 0 artificial collections).
 * 
 * @module compiler/types
 */

import { TypeScriptSyntax } from '../domain/common/TypeScriptTypeLowerer';
import type { ResourceFieldDescriptor } from '../../types/route';
import { toCamelCase, ResourceNamingConvention } from '../../utils/resource-naming';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';

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
 * SemanticTypeKind
 *
 * Exhaustive Domain Vocabulary Model representing all first-class AST node kinds.
 */
export const SemanticTypeKind = Object.freeze({
    Primitive: 'primitive',
    Optional: 'optional',
    Nullable: 'nullable',
    Never: 'never',
    Error: 'error',
    Reference: 'reference',
    Union: 'union',
    Intersection: 'intersection',
    ReadonlyCollection: 'readonly_collection',
    MutableCollection: 'mutable_collection',
    Generic: 'generic',
    Object: 'object'
} as const);

export type SemanticTypeKind = typeof SemanticTypeKind[keyof typeof SemanticTypeKind];

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
    abstract readonly kind: SemanticTypeKind;

    public isNullable(): boolean {
        return false;
    }

    public isOptional(): boolean {
        return false;
    }

    /**
     * Default polymorphic property formatting (0 type cast, 0 if branching).
     */
    public formatProperty(this: SemanticType, name: string, lowerType: (type: SemanticType) => string): string {
        return TypeScriptSyntax.formatProperty(name, lowerType(this));
    }
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
export class PrimitiveType extends SemanticTypeBase {
    readonly kind = 'primitive';

    constructor(public readonly type: PrimitiveKind) {
        super();
        Object.freeze(this);
    }

    /**
     * Resolves PHP type representation into canonical PrimitiveType AST node.
     */
    public static fromPhpType(phpType: string): PrimitiveType {
        switch (phpType.toLowerCase()) {
            case 'int':
            case 'integer':
            case 'float':
            case 'double':
            case 'number':
                return new PrimitiveType(PrimitiveKind.NUMBER);
            case 'bool':
            case 'boolean':
                return new PrimitiveType(PrimitiveKind.BOOLEAN);
            case 'datetime':
            case 'date':
            case 'timestamp':
                return new PrimitiveType(PrimitiveKind.DATETIME);
            case 'file':
            case 'image':
                return new PrimitiveType(PrimitiveKind.FILE);
            case 'string':
            case 'varchar':
            case 'text':
            default:
                return new PrimitiveType(PrimitiveKind.STRING);
        }
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
    constructor(readonly members: readonly SemanticType[]) {
        super();
        Object.freeze(this);
    }

    public static of(...members: readonly (SemanticType | readonly SemanticType[])[]): UnionType {
        const flat = members.flat();
        return new UnionType(flat as readonly SemanticType[]);
    }
}

/**
 * Intersection type - represents a combination of multiple types (A & B & C).
 */
export class IntersectionType extends SemanticTypeBase {
    readonly kind = 'intersection';
    constructor(readonly members: readonly SemanticType[]) {
        super();
        Object.freeze(this);
    }

    public static of(...members: readonly (SemanticType | readonly SemanticType[])[]): IntersectionType {
        const flat = members.flat();
        return new IntersectionType(flat as readonly SemanticType[]);
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
 * Object type - represents structural object types with ordered properties.
 * 
 * @example
 * ```typescript
 * const userObject = new ObjectType('User', [
 *   { name: 'id', type: new PrimitiveType(PrimitiveKind.NUMBER), required: true, nullable: false },
 *   { name: 'name', type: new PrimitiveType(PrimitiveKind.STRING), required: true, nullable: false }
 * ]);
 * ```
 */
/**
 * First-Class Optional Type AST Node.
 * Models optionality (foo?: T) directly within the Semantic AST hierarchy.
 */
export class OptionalType extends SemanticTypeBase {
    readonly kind = 'optional';

    constructor(public readonly innerType: SemanticType) {
        super();
        Object.freeze(this);
    }

    public override isOptional(): boolean {
        return true;
    }

    /**
     * Polymorphic override for optional property formatting (0 type cast, 0 if branching).
     */
    public override formatProperty(name: string, lowerType: (type: SemanticType) => string): string {
        return TypeScriptSyntax.formatOptionalProperty(name, lowerType(this.innerType));
    }
}

/**
 * First-Class Nullable Type AST Node.
 * Replaces legacy monkey-patched 'nullable_wrapper' with '__value' hack.
 */
export class NullableType extends SemanticTypeBase {
    readonly kind = 'nullable';

    constructor(public readonly innerType: SemanticType) {
        super();
        Object.freeze(this);
    }

    /**
     * Polymorphic override (0 === string comparison).
     */
    public override isNullable(): boolean {
        return true;
    }
}

/**
 * First-Class Unified Object Property AST Node.
 * Pure Self-Contained Value Object (0 duplicated boolean flags, type is SSOT).
 */
export interface ObjectProperty {
    readonly name: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly description?: string;
}

export interface ScannedObjectPropertyParams {
    readonly name: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly description: string | null;
}

/**
 * Reusable Constructor: Scanned Object Property Descriptor.
 */
export class ScannedObjectProperty implements ObjectProperty {
    public readonly name: string;
    public readonly type: SemanticType;
    public readonly required: boolean;
    public readonly nullable: boolean;
    public readonly description?: string;

    constructor({ name, type, required, nullable, description }: ScannedObjectPropertyParams) {
        this.name = name;
        this.type = type;
        this.required = required;
        this.nullable = nullable;
        this.description = description ?? undefined;
        Object.freeze(this);
    }

    public static create({
        name,
        type,
        nullable = false,
        required = !nullable,
        description = null
    }: {
        readonly name: string;
        readonly type: SemanticType;
        readonly nullable?: boolean;
        readonly required?: boolean;
        readonly description?: string | null;
    }): ScannedObjectProperty {
        return new ScannedObjectProperty({
            name,
            type,
            required,
            nullable,
            description
        });
    }
}

export const ObjectProperty = {
    /**
     * Pure declarative factory from ResourceFieldDescriptor.
     */
    fromResourceField(field: ResourceFieldDescriptor): ObjectProperty {
        return new ScannedObjectProperty({
            name: toCamelCase(field.name),
            type: SemanticTypeResolver.resolveField(field),
            nullable: !!field.nullable,
            required: !field.nullable,
            description: null
        });
    }
};

/**
 * First-Class Native Object Type.
 * Pure Ordered AST Stream (0 key duplication, direct 1-pass generator mapping).
 */
export interface ObjectTypeDescriptorParams {
    readonly name: string;
    readonly baseName: string;
    readonly properties: readonly ObjectProperty[];
}

export class ObjectType extends SemanticTypeBase {
    readonly kind = 'object';
    public readonly name: string;
    public readonly baseName: string;
    public readonly properties: readonly ObjectProperty[] & {
        get(name: string): SemanticType | undefined;
        entries(): readonly (readonly [string, SemanticType])[];
    };

    public readonly requiredProperties?: any;
    public readonly baseObject?: any;
    public readonly interfaces?: any;
    public readonly annotations?: any;

    /**
     * Pure Origin Boundary Constructor supporting both Structured Options Object and Legacy signature.
     */
    constructor(
        paramsOrProperties: ObjectTypeDescriptorParams | any,
        requiredProperties?: any,
        baseObject?: any,
        interfaces?: any,
        annotations?: any
    ) {
        super();
        const makeEnhanced = (props: readonly ObjectProperty[]) => {
            const arr = [...props] as any;
            arr.get = function(name: string): SemanticType | undefined {
                const found = arr.find((p: ObjectProperty) => p.name === name);
                return found ? found.type : undefined;
            };
            arr.entries = function(): readonly (readonly [string, SemanticType])[] {
                return Object.freeze(arr.map((p: ObjectProperty) => Object.freeze([p.name, p.type]) as readonly [string, SemanticType]));
            };
            return Object.freeze(arr);
        };

        if (paramsOrProperties && typeof paramsOrProperties === 'object' && ('name' in paramsOrProperties || (paramsOrProperties.properties && Array.isArray(paramsOrProperties.properties)))) {
            const params = paramsOrProperties as ObjectTypeDescriptorParams;
            this.name = params.name ?? '';
            this.baseName = params.baseName ?? this.name;
            this.properties = makeEnhanced(Array.isArray(params.properties) ? params.properties : []);
        } else {
            const rawName = annotations?.get ? (annotations.get('name') || '') : '';
            const typeName = rawName ? (rawName.endsWith('Transformed') ? rawName : `${rawName}Transformed`) : '';
            const baseName = annotations?.get ? (annotations.get('baseName') || rawName) : rawName;
            this.name = typeName;
            this.baseName = baseName.endsWith('Transformed') ? baseName.replace(/Transformed$/, '') : baseName;
            this.requiredProperties = requiredProperties;
            this.baseObject = baseObject;
            this.interfaces = interfaces;
            this.annotations = annotations;

            const rawEntries = paramsOrProperties?.entries
                ? (typeof paramsOrProperties.entries === 'function' ? paramsOrProperties.entries() : [])
                : (paramsOrProperties instanceof Map ? Array.from(paramsOrProperties.entries()) : []);

            const propList: ObjectProperty[] = [];
            for (const [key, val] of rawEntries) {
                const isReq = requiredProperties?.has ? requiredProperties.has(key) : true;
                const isNull = (val as any)?.isNullable ? (val as any).isNullable() : false;
                propList.push(ScannedObjectProperty.create({
                    name: key,
                    type: val,
                    required: isReq,
                    nullable: isNull
                }));
            }
            this.properties = makeEnhanced(propList);
        }
        Object.freeze(this);
    }

    public static create({
        name,
        baseName = name,
        properties = []
    }: {
        readonly name: string;
        readonly baseName?: string;
        readonly properties?: readonly ObjectProperty[];
    }): ObjectType {
        return new ObjectType({
            name,
            baseName,
            properties
        });
    }

    public static empty(name: string, baseName: string = name): ObjectType {
        return new ObjectType({ name, baseName, properties: [] });
    }
}

/**
 * Union type of all semantic types.
 * This is the main type used throughout semantic analysis.
 */
export type SemanticType =
    | PrimitiveType
    | OptionalType
    | NullableType
    | NeverType
    | ErrorType
    | ReferenceType
    | UnionType
    | IntersectionType
    | ReadonlyCollectionType
    | MutableCollectionType
    | GenericType
    | ObjectType;