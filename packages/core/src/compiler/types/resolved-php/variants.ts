/**
 * variants.ts
 *
 * Concrete variant classes for ResolvedPhpType ADT.
 *
 * @module compiler/types/resolved-php
 */

import { PrimitiveKind, ObjectProperty } from '../SemanticType';

export class PrimitivePhpType {
    public readonly kind = 'primitive' as const;
    public readonly primitiveKind: PrimitiveKind;
    public readonly nullable: boolean;

    public constructor(params: {
        readonly primitiveKind: PrimitiveKind;
        readonly nullable: boolean;
    }) {
        this.primitiveKind = params.primitiveKind;
        this.nullable = params.nullable;
        Object.freeze(this);
    }

    public static create(primitiveKind: PrimitiveKind, nullable: boolean): PrimitivePhpType {
        return new PrimitivePhpType({ primitiveKind, nullable });
    }

    public static string(nullable = false): PrimitivePhpType {
        return new PrimitivePhpType({ primitiveKind: PrimitiveKind.STRING, nullable });
    }

    public static number(nullable = false): PrimitivePhpType {
        return new PrimitivePhpType({ primitiveKind: PrimitiveKind.NUMBER, nullable });
    }

    public static boolean(nullable = false): PrimitivePhpType {
        return new PrimitivePhpType({ primitiveKind: PrimitiveKind.BOOLEAN, nullable });
    }

    public static datetime(nullable = false): PrimitivePhpType {
        return new PrimitivePhpType({ primitiveKind: PrimitiveKind.DATETIME, nullable });
    }
}

export class EloquentModelPhpType {
    public readonly kind = 'model' as const;
    public readonly modelName: string;
    public readonly baseName: string;
    public readonly properties: readonly ObjectProperty[];
    public readonly nullable: boolean;

    public constructor(params: {
        readonly modelName: string;
        readonly baseName: string;
        readonly properties: readonly ObjectProperty[];
        readonly nullable: boolean;
    }) {
        this.modelName = params.modelName;
        this.baseName = params.baseName;
        this.properties = params.properties;
        this.nullable = params.nullable;
        Object.freeze(this);
    }

    public static create(params: {
        readonly modelName: string;
        readonly baseName: string;
        readonly properties: readonly ObjectProperty[];
        readonly nullable: boolean;
    }): EloquentModelPhpType {
        return new EloquentModelPhpType(params);
    }
}

export class ResourceWrapperPhpType {
    public readonly kind = 'resource' as const;
    public readonly resourceName: string;
    public readonly targetTypeName: string;
    public readonly isCollection: boolean;
    public readonly nullable: boolean;

    public constructor(params: {
        readonly resourceName: string;
        readonly targetTypeName: string;
        readonly isCollection: boolean;
        readonly nullable: boolean;
    }) {
        this.resourceName = params.resourceName;
        this.targetTypeName = params.targetTypeName;
        this.isCollection = params.isCollection;
        this.nullable = params.nullable;
        Object.freeze(this);
    }

    public static create(params: {
        readonly resourceName: string;
        readonly targetTypeName: string;
        readonly isCollection: boolean;
        readonly nullable: boolean;
    }): ResourceWrapperPhpType {
        return new ResourceWrapperPhpType(params);
    }
}

export class VoidPhpType {
    public readonly kind = 'void' as const;

    public constructor() {
        Object.freeze(this);
    }

    public static create(): VoidPhpType {
        return new VoidPhpType();
    }
}

export class UnknownPhpType {
    public readonly kind = 'unknown' as const;
    public readonly rawExpression: string;
    public readonly nullable: boolean;

    public constructor(params: {
        readonly rawExpression: string;
        readonly nullable: boolean;
    }) {
        this.rawExpression = params.rawExpression;
        this.nullable = params.nullable;
        Object.freeze(this);
    }

    public static create(rawExpression: string, nullable = false): UnknownPhpType {
        return new UnknownPhpType({ rawExpression, nullable });
    }
}
