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
import type { ObjectPropertyOrigin } from '../../types/domain/objectPropertyOrigin';
import { SemanticValueFactory, type PropertyName, type VariableName } from '../../types/domain/semanticValues';
import type { StringValue } from '../../types/upstream/valueObjects';

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
    UNKNOWN = 'unknown',
    /** Source explicitly declares a collection but omits its element type. */
    UNSPECIFIED = 'unspecified'
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
    JsonValue: 'json_value',
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

export interface SemanticTypeVisitor<R> {
    readonly primitive: (type: PrimitiveType) => R;
    readonly jsonValue: (type: JsonValueType) => R;
    readonly optional: (type: OptionalType) => R;
    readonly nullable: (type: NullableType) => R;
    readonly never: (type: NeverType) => R;
    readonly error: (type: ErrorType) => R;
    readonly reference: (type: ReferenceType) => R;
    readonly union: (type: UnionType) => R;
    readonly intersection: (type: IntersectionType) => R;
    readonly readonlyCollection: (type: ReadonlyCollectionType) => R;
    readonly mutableCollection: (type: MutableCollectionType) => R;
    readonly generic: (type: GenericType) => R;
    readonly object: (type: ObjectType) => R;
}

/**
 * Base class for all semantic types.
 * Uses a brand to prevent accidental type confusion at runtime.
 */
export abstract class SemanticTypeBase {
    protected readonly [semanticTypeBrand] = true;
    abstract readonly kind: SemanticTypeKind;
    abstract accept<R>(visitor: SemanticTypeVisitor<R>): R;

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.primitive(this); }

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
 * JSON value semantic type.
 * Represents JSON data whose runtime shape is not declared by the source cast.
 * This is distinct from UNKNOWN: the value domain is known to be JSON.
 */
export class JsonValueType extends SemanticTypeBase {
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.jsonValue(this); }

    readonly kind = 'json_value';
    constructor() {
        super();
        Object.freeze(this);
    }
}

/**
 * Never type - represents impossible/unreachable values.
 * Bottom type in the type hierarchy.
 */
export class NeverType extends SemanticTypeBase {
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.never(this); }

    readonly kind = 'never';
}

/**
 * Error type - represents a type error with diagnostic message.
 * Used to continue compilation after encountering type errors.
 */
export class ErrorType extends SemanticTypeBase {
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.error(this); }

    readonly kind = 'error';
    constructor(diagnosticMessage: string) {
        super();
        this.diagnosticMessage = Object.freeze({ kind: 'string_value', value: diagnosticMessage });
    }

    readonly diagnosticMessage: StringValue;
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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.reference(this); }

    readonly kind = 'reference';
    readonly role: ObjectTypeRole;
    readonly emittedName: string;

    constructor(
        readonly namespace: string,
        readonly name: string,
        role: ObjectTypeRole = 'plain'
    ) {
        super();
        this.role = role;
        this.emittedName = role === 'resource' && !name.endsWith('Transformed')
            ? `${name}Transformed`
            : name;
        Object.freeze(this);
    }

    public static model(namespace: string, name: string): ReferenceType {
        return new ReferenceType(namespace, name, 'model');
    }

    public static resource(namespace: string, name: string): ReferenceType {
        return new ReferenceType(namespace, name, 'resource');
    }

    public static response(namespace: string, name: string): ReferenceType {
        return new ReferenceType(namespace, name, 'response');
    }

    public static plain(namespace: string, name: string): ReferenceType {
        return new ReferenceType(namespace, name, 'plain');
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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.union(this); }

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.intersection(this); }

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.readonlyCollection(this); }

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.mutableCollection(this); }

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
    readonly name: VariableName;
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
 *     name: SemanticValueFactory.variableName('T'), 
 *     variance: 'covariant',
 *     type: new ReferenceType('App\\Models', 'User')
 *   }]
 * );
 * ```
 */
export class GenericType extends SemanticTypeBase {
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.generic(this); }

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.optional(this); }

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
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.nullable(this); }

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
export type ObjectTypeRole = 'plain' | 'resource' | 'model' | 'response';

export interface ObjectProperty {
    readonly name: PropertyName;
    readonly type: SemanticType;
    readonly description: string;
    readonly origin: ObjectPropertyOrigin;
}

export interface ScannedObjectPropertyParams {
    readonly name: PropertyName;
    readonly type: SemanticType;
    readonly description: string;
    readonly origin: ObjectPropertyOrigin;
}

export class ScannedObjectProperty implements ObjectProperty {
    public readonly name: PropertyName;
    public readonly type: SemanticType;
    public readonly description: string;
    public readonly origin: ObjectPropertyOrigin;

    constructor({ name, type, description, origin }: ScannedObjectPropertyParams) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.origin = origin;
        Object.freeze(this);
    }

    public static create(params: ScannedObjectPropertyParams): ScannedObjectProperty {
        return new ScannedObjectProperty(params);
    }
}

export const ObjectProperty = {
    fromResourceField(field: ResourceFieldDescriptor): ObjectProperty {
        const type = SemanticTypeResolver.resolveField(field);
        return new ScannedObjectProperty({
            name: SemanticValueFactory.propertyName(toCamelCase(field.name.value)),
            type,
            description: '',
            origin: { kind: 'bound_expression', bound: field.semantic.bound }
        });
    }
};

export interface ObjectTypeDescriptorParams {
    readonly name: string;
    readonly baseName: string;
    readonly properties: readonly ObjectProperty[];
    readonly role: ObjectTypeRole;
    readonly baseObject?: ReferenceType;
    readonly interfaces?: readonly ReferenceType[];
}

export class ObjectType extends SemanticTypeBase {
    public accept<R>(visitor: SemanticTypeVisitor<R>): R { return visitor.object(this); }

    readonly kind = 'object';
    public readonly name: string;
    public readonly baseName: string;
    public readonly properties: readonly ObjectProperty[];
    public readonly role: ObjectTypeRole;
    public readonly baseObject?: ReferenceType;
    public readonly interfaces: readonly ReferenceType[];

    constructor(params: ObjectTypeDescriptorParams) {
        super();
        this.name = params.name;
        this.baseName = params.baseName;
        this.properties = Object.freeze([...params.properties]);
        this.role = params.role;
        this.baseObject = params.baseObject;
        this.interfaces = Object.freeze([...(params.interfaces ?? [])]);
        Object.freeze(this);
    }

    public static create(params: ObjectTypeDescriptorParams): ObjectType {
        return new ObjectType(params);
    }

    public static empty(name: string, baseName: string = name): ObjectType {
        return new ObjectType({ name, baseName, properties: [], role: 'plain' });
    }
}

/**
 * Union type of all semantic types.
 * This is the main type used throughout semantic analysis.
 */
export type SemanticType =
    | PrimitiveType
    | JsonValueType
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