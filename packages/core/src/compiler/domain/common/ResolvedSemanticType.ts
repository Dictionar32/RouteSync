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