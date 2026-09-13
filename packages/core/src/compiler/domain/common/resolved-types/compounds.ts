/**
 * compounds.ts
 *
 * Object, Union, Intersection, and Unknown compound types for ResolvedSemanticType.
 *
 * @module compiler/domain/common/resolved-types/compounds
 */

import { ResolvedSemanticTypeBase } from './base';
import type { ResolvedSemanticType } from './catamorphism';
import type {
    ResolvedObjectTypeParams,
    ResolvedUnionTypeParams,
    ResolvedIntersectionTypeParams,
    ResolvedUnknownTypeParams,
    ObjectKind,
    ResolvedField
} from './types';

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
