/**
 * ResolvedSemanticType.ts
 *
 * Target-Agnostic Structured Domain Value Object Hierarchy for RouteSync Compiler IR.
 * Represents resolved semantic intent independent of target generator syntax (Zod, TS, Mapper).
 *
 * @module compiler/domain/common
 */

export type ResolvedPrimitiveKind =
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'file'
    | 'unknown';

export interface ResolvedPrimitiveTypeParams {
    readonly primitiveKind: ResolvedPrimitiveKind;
}

export interface ResolvedReferenceTypeParams {
    readonly name: string;
    readonly namespace: string | null;
}

export interface ResolvedOptionalTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedNullableTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedCollectionTypeParams {
    readonly elementType: ResolvedSemanticType;
}

export type ObjectKind = 'resource' | 'model' | 'response' | 'plain';

export type ResolvedField = readonly [name: string, type: ResolvedSemanticType];

export interface ResolvedObjectTypeParams {
    readonly fields: readonly ResolvedField[];
    readonly objectKind: ObjectKind;
    readonly resourceName: string | null;
    readonly typeName: string | null;
}

export interface ResolvedUnionTypeParams {
    readonly members: readonly ResolvedSemanticType[];
}

export interface ResolvedIntersectionTypeParams {
    readonly members: readonly ResolvedSemanticType[];
}

export interface ResolvedUnknownTypeParams {
    readonly diagnosticMessage: string;
}

export abstract class ResolvedSemanticTypeBase {
    abstract readonly kind: string;

    formatProperty(this: ResolvedSemanticType, name: string, lower: (t: ResolvedSemanticType) => string): string {
        return `${name}: ${lower(this)};`;
    }

    formatMapperAssignment(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }

    formatChildArrayMapper(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }
}

export class ResolvedPrimitiveType extends ResolvedSemanticTypeBase {
    readonly kind = 'primitive' as const;
    readonly primitiveKind: ResolvedPrimitiveKind;

    constructor({ primitiveKind }: ResolvedPrimitiveTypeParams) {
        super();
        this.primitiveKind = primitiveKind;
        Object.freeze(this);
    }

    public static string(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'string' });
    }
    public static number(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'number' });
    }
    public static boolean(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'boolean' });
    }
    public static datetime(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'datetime' });
    }
    public static file(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'file' });
    }
    public static unknown(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'unknown' });
    }
}

export class ResolvedReferenceType extends ResolvedSemanticTypeBase {
    readonly kind = 'reference' as const;
    readonly name: string;
    readonly namespace: string;

    constructor(params: ResolvedReferenceTypeParams);
    constructor(params: { readonly name: string; readonly namespace?: string | null });
    constructor({ name, namespace = '' }: any) {
        super();
        this.name = name;
        this.namespace = namespace ?? '';
        Object.freeze(this);
    }

    public static create(name: string, namespace: string | null = null): ResolvedReferenceType {
        return new ResolvedReferenceType({ name, namespace });
    }

    public static named(name: string, namespace: string | null = null): ResolvedReferenceType {
        return new ResolvedReferenceType({ name, namespace });
    }

    override formatChildArrayMapper(name: string): string {
        const childResource = this.name.replace(/(Transformed|ApiResponse)$/, '');
        return `  ${name}: api.${name}?.map(to${childResource}Read),`;
    }
}

export class ResolvedOptionalType extends ResolvedSemanticTypeBase {
    readonly kind = 'optional' as const;
    readonly innerType: ResolvedSemanticType;

    constructor({ innerType }: ResolvedOptionalTypeParams) {
        super();
        this.innerType = innerType;
        Object.freeze(this);
    }

    public static of(innerType: ResolvedSemanticType): ResolvedOptionalType {
        return new ResolvedOptionalType({ innerType });
    }

    override formatProperty(name: string, lower: (t: ResolvedSemanticType) => string): string {
        return `${name}?: ${lower(this.innerType)};`;
    }
}

export class ResolvedNullableType extends ResolvedSemanticTypeBase {
    readonly kind = 'nullable' as const;
    readonly innerType: ResolvedSemanticType;

    constructor({ innerType }: ResolvedNullableTypeParams) {
        super();
        this.innerType = innerType;
        Object.freeze(this);
    }

    public static of(innerType: ResolvedSemanticType): ResolvedNullableType {
        return new ResolvedNullableType({ innerType });
    }
}

export class ResolvedCollectionType extends ResolvedSemanticTypeBase {
    readonly kind = 'collection' as const;
    readonly elementType: ResolvedSemanticType;

    constructor({ elementType }: ResolvedCollectionTypeParams) {
        super();
        this.elementType = elementType;
        Object.freeze(this);
    }

    public static of(elementType: ResolvedSemanticType): ResolvedCollectionType {
        return new ResolvedCollectionType({ elementType });
    }

    override formatMapperAssignment(name: string): string {
        return this.elementType.formatChildArrayMapper(name);
    }
}

export class ResolvedObjectType extends ResolvedSemanticTypeBase {
    readonly kind = 'object' as const;
    readonly fields: readonly ResolvedField[];
    readonly objectKind: ObjectKind;
    readonly resourceName?: string;
    readonly typeName?: string;

    constructor(params: ResolvedObjectTypeParams);
    constructor(params?: {
        readonly fields?: readonly ResolvedField[];
        readonly objectKind?: ObjectKind;
        readonly resourceName?: string | null;
        readonly typeName?: string | null;
    });
    constructor({
        fields = Object.freeze([]),
        objectKind = 'plain',
        resourceName = null,
        typeName = null
    }: any = {}) {
        super();
        this.fields = Object.freeze([...fields]);
        this.objectKind = objectKind;
        this.resourceName = resourceName ?? undefined;
        this.typeName = typeName ?? undefined;
        Object.freeze(this);
    }

    public static plain(fields: readonly ResolvedField[] = []): ResolvedObjectType {
        return new ResolvedObjectType({ fields, objectKind: 'plain', resourceName: null, typeName: null });
    }

    public static resource(resourceName: string, fields: readonly ResolvedField[] = [], typeName: string | null = null): ResolvedObjectType {
        return new ResolvedObjectType({ fields, objectKind: 'resource', resourceName, typeName });
    }
}

export class ResolvedUnionType extends ResolvedSemanticTypeBase {
    readonly kind = 'union' as const;
    readonly members: readonly ResolvedSemanticType[];

    constructor(params: ResolvedUnionTypeParams);
    constructor(params?: { readonly members?: readonly ResolvedSemanticType[] });
    constructor({ members = Object.freeze([]) }: any = {}) {
        super();
        this.members = Object.freeze([...members]);
        Object.freeze(this);
    }

    public static of(members: readonly ResolvedSemanticType[]): ResolvedUnionType {
        return new ResolvedUnionType({ members });
    }
}

export class ResolvedIntersectionType extends ResolvedSemanticTypeBase {
    readonly kind = 'intersection' as const;
    readonly members: readonly ResolvedSemanticType[];

    constructor(params: ResolvedIntersectionTypeParams);
    constructor(params?: { readonly members?: readonly ResolvedSemanticType[] });
    constructor({ members = Object.freeze([]) }: any = {}) {
        super();
        this.members = Object.freeze([...members]);
        Object.freeze(this);
    }

    public static of(members: readonly ResolvedSemanticType[]): ResolvedIntersectionType {
        return new ResolvedIntersectionType({ members });
    }
}

export class ResolvedUnknownType extends ResolvedSemanticTypeBase {
    readonly kind = 'unknown' as const;
    readonly diagnosticMessage: string;

    constructor(params: ResolvedUnknownTypeParams);
    constructor(params?: { readonly diagnosticMessage?: string });
    constructor({ diagnosticMessage = 'Unknown semantic type' }: any = {}) {
        super();
        this.diagnosticMessage = diagnosticMessage;
        Object.freeze(this);
    }

    public static withMessage(diagnosticMessage: string): ResolvedUnknownType {
        return new ResolvedUnknownType({ diagnosticMessage });
    }
}

export type ResolvedSemanticType =
    | ResolvedPrimitiveType
    | ResolvedReferenceType
    | ResolvedOptionalType
    | ResolvedNullableType
    | ResolvedCollectionType
    | ResolvedObjectType
    | ResolvedUnionType
    | ResolvedIntersectionType
    | ResolvedUnknownType;

export const ResolvedSemanticTypeKind = Object.freeze({
    Primitive: 'primitive',
    Reference: 'reference',
    Optional: 'optional',
    Nullable: 'nullable',
    Collection: 'collection',
    Object: 'object',
    Union: 'union',
    Intersection: 'intersection',
    Unknown: 'unknown'
} as const);

export type ResolvedSemanticTypeKind = typeof ResolvedSemanticTypeKind[keyof typeof ResolvedSemanticTypeKind];

export interface ResolvedSemanticTypeSpecification<K extends ResolvedSemanticTypeKind = ResolvedSemanticTypeKind> {
    readonly kind: K;
    readonly isTerminal: boolean;
    readonly isWrapper: boolean;
    readonly isCompound: boolean;
    readonly description: string;
}

export type ResolvedSemanticTypeRegistry = {
    readonly [K in ResolvedSemanticTypeKind]: ResolvedSemanticTypeSpecification<K>;
};

export const RESOLVED_SEMANTIC_TYPE_REGISTRY: ResolvedSemanticTypeRegistry = Object.freeze({
    [ResolvedSemanticTypeKind.Primitive]: {
        kind: ResolvedSemanticTypeKind.Primitive,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Leaf primitive data type (string, number, boolean, datetime, file, etc.)'
    },
    [ResolvedSemanticTypeKind.Reference]: {
        kind: ResolvedSemanticTypeKind.Reference,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Named reference to an external entity, DTO, or model contract'
    },
    [ResolvedSemanticTypeKind.Optional]: {
        kind: ResolvedSemanticTypeKind.Optional,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper marking inner type as optional (can be omitted)'
    },
    [ResolvedSemanticTypeKind.Nullable]: {
        kind: ResolvedSemanticTypeKind.Nullable,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper marking inner type as nullable (can be null)'
    },
    [ResolvedSemanticTypeKind.Collection]: {
        kind: ResolvedSemanticTypeKind.Collection,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper representing an ordered collection/array of element types'
    },
    [ResolvedSemanticTypeKind.Object]: {
        kind: ResolvedSemanticTypeKind.Object,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound record structure with ordered named fields'
    },
    [ResolvedSemanticTypeKind.Union]: {
        kind: ResolvedSemanticTypeKind.Union,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound sum/union type of member types'
    },
    [ResolvedSemanticTypeKind.Intersection]: {
        kind: ResolvedSemanticTypeKind.Intersection,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound product/intersection type of member types'
    },
    [ResolvedSemanticTypeKind.Unknown]: {
        kind: ResolvedSemanticTypeKind.Unknown,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Unresolved or fallback type with diagnostic message'
    }
});

export type ResolvedSemanticTypeVisitor<R> = {
    readonly primitive: (type: ResolvedPrimitiveType) => R;
    readonly reference: (type: ResolvedReferenceType) => R;
    readonly optional: (type: ResolvedOptionalType) => R;
    readonly nullable: (type: ResolvedNullableType) => R;
    readonly collection: (type: ResolvedCollectionType) => R;
    readonly object: (type: ResolvedObjectType) => R;
    readonly union: (type: ResolvedUnionType) => R;
    readonly intersection: (type: ResolvedIntersectionType) => R;
    readonly unknown: (type: ResolvedUnknownType) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ResolvedSemanticType dengan exhaustive type safety
 */
export function matchResolvedSemanticType<R>(
    type: ResolvedSemanticType,
    visitor: ResolvedSemanticTypeVisitor<R>
): R {
    return visitor[type.kind](type as any);
}