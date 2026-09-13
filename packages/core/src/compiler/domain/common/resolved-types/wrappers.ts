/**
 * wrappers.ts
 *
 * Reference, Optional, Nullable, and Collection wrappers for ResolvedSemanticType.
 *
 * @module compiler/domain/common/resolved-types/wrappers
 */

import { ResolvedSemanticTypeBase } from './base';
import type { ResolvedSemanticType } from './catamorphism';
import type {
    ResolvedReferenceTypeParams,
    ResolvedOptionalTypeParams,
    ResolvedNullableTypeParams,
    ResolvedCollectionTypeParams
} from './types';

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
