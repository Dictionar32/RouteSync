/**
 * compounds.ts
 *
 * Object, Union, Intersection, and Unknown compound types for ResolvedSemanticType.
 *
 * @module compiler/domain/common/resolved-types/compounds
 */

import { ResolvedSemanticTypeBase } from './base';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResolvedSemanticType } from './catamorphism';
import type {
    ResolvedObjectTypeParams,
    ResolvedUnionTypeParams,
    ResolvedIntersectionTypeParams,
    ResolvedUnknownTypeParams,
    ObjectKind,
    ResolvedProperty,
    ResolvedObjectIdentity
} from './types';

export class ResolvedObjectType extends ResolvedSemanticTypeBase {
    readonly kind = 'object' as const;
    readonly fields: readonly ResolvedProperty[];
    readonly identity: ResolvedObjectIdentity;

    constructor(params: ResolvedObjectTypeParams) {
        super();
        this.fields = Object.freeze([...params.fields]);
        this.identity = Object.freeze({ ...params.identity });
        Object.freeze(this);
    }

    public static plain(fields: readonly ResolvedProperty[] = []): ResolvedObjectType {
        return new ResolvedObjectType({
            fields,
            identity: { kind: 'plain', name: SemanticValueFactory.domainName('Object') }
        });
    }

    public static named(
        kind: Exclude<ObjectKind, 'plain'>,
        name: string,
        fields: readonly ResolvedProperty[] = []
    ): ResolvedObjectType {
        const identity = kind === 'resource'
            ? { kind, name: SemanticValueFactory.resourceName(name) }
            : kind === 'model'
                ? { kind, name: SemanticValueFactory.modelName(name) }
                : { kind, name: SemanticValueFactory.responseTypeName(name) };
        return new ResolvedObjectType({ fields, identity });
    }
}

export class ResolvedUnionType extends ResolvedSemanticTypeBase {
    readonly kind = 'union' as const;
    readonly members: readonly ResolvedSemanticType[];

    constructor({ members }: ResolvedUnionTypeParams) {
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

    constructor({ members }: ResolvedIntersectionTypeParams) {
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

    constructor({ diagnosticMessage }: ResolvedUnknownTypeParams) {
        super();
        this.diagnosticMessage = diagnosticMessage;
        Object.freeze(this);
    }

    public static withMessage(diagnosticMessage: string): ResolvedUnknownType {
        return new ResolvedUnknownType({ diagnosticMessage });
    }
}
