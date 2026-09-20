/**
 * ResolvedObjectType.ts
 *
 * Compatibility facade for the canonical resolved object domain model.
 * The canonical model lives in ./resolved-types/compounds.
 */

import type { ObjectType, SemanticType } from '../../types/SemanticType';
import type { PropertyName } from '../../../types/upstream/names';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import {
    ResolvedObjectType as CanonicalResolvedObjectType,
    ResolvedNullableType,
    type ResolvedSemanticType
} from './ResolvedSemanticType';

export interface NullableWrapperObjectParams {
    readonly rawObject: ObjectType;
    readonly innerType: SemanticType;
}

export interface PlainObjectParams {
    readonly rawObject: ObjectType;
}

export abstract class ResolvedObjectType {
    abstract readonly kind: 'plain' | 'nullable_wrapper';
    public readonly rawObject: ObjectType;

    protected constructor({ rawObject }: PlainObjectParams) {
        this.rawObject = rawObject;
    }

    public getCleanProperties(): readonly (readonly [PropertyName, SemanticType])[] {
        return this.rawObject.properties
            .filter(property => !property.name.value.startsWith('__'))
            .map(property => [property.name, property.type] as const);
    }
}

export class NullableWrapperObject extends ResolvedObjectType {
    public readonly kind = 'nullable_wrapper' as const;
    public readonly innerType: SemanticType;

    constructor({ rawObject, innerType }: NullableWrapperObjectParams) {
        super({ rawObject });
        this.innerType = innerType;
        Object.freeze(this);
    }
}

export class PlainObject extends ResolvedObjectType {
    public readonly kind = 'plain' as const;

    constructor({ rawObject }: PlainObjectParams) {
        super({ rawObject });
        Object.freeze(this);
    }
}

export type ResolvedObjectTypeUnion = NullableWrapperObject | PlainObject;

export function resolveObjectType(rawObject: ObjectType): ResolvedObjectTypeUnion {
    return new PlainObject({ rawObject });
}

export function resolveCanonicalObjectType(
    rawObject: ObjectType,
    resolver: (type: SemanticType) => ResolvedSemanticType
): CanonicalResolvedObjectType {
    const fields = rawObject.properties
        .filter(property => !property.name.value.startsWith('__'))
        .map(property => ({
            name: property.name,
            type: resolver(property.type),
            presence: property.type.isOptional() ? { kind: 'optional' } as Presence : { kind: 'required' } as Presence
        }));

    return new CanonicalResolvedObjectType({
        fields,
        identity: { kind: rawObject.role, name: rawObject.name }
    });
}

export function resolveCanonicalNullable(
    type: SemanticType,
    resolver: (type: SemanticType) => ResolvedSemanticType
): ResolvedSemanticType {
    return new ResolvedNullableType({ innerType: resolver(type) });
}
