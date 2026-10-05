/**
 * Compatibility facade for the canonical resolved object domain model.
 * Property selection and identity are declarative relations.
 */
import type { ObjectType, SemanticType } from '../../types/SemanticType';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { PropertyName } from '../../../types/upstream/names';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import { relationProject, relationResolve, relationSelect } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import {
    ResolvedObjectType as CanonicalResolvedObjectType,
    ResolvedNullableType,
    type ResolvedSemanticType
} from './ResolvedSemanticType';

export interface NullableWrapperObjectParams { readonly rawObject: ObjectType; readonly innerType: SemanticType; }
export interface PlainObjectParams { readonly rawObject: ObjectType; }

export abstract class ResolvedObjectType {
    abstract readonly kind: 'plain' | 'nullable_wrapper';
    public readonly rawObject: ObjectType;
    protected constructor({ rawObject }: PlainObjectParams) { this.rawObject = rawObject; }

    public getCleanProperties(): readonly (readonly [PropertyName, SemanticType])[] {
        return relationProject(
            relationSelect(this.rawObject.properties, property => relationEqual(property.name.value.value.startsWith('__'), false)),
            property => [property.name, property.type] as const,
        );
    }
}

export class NullableWrapperObject extends ResolvedObjectType {
    public readonly kind = 'nullable_wrapper' as const;
    public readonly innerType: SemanticType;
    constructor({ rawObject, innerType }: NullableWrapperObjectParams) { super({ rawObject }); this.innerType = innerType; Object.freeze(this); }
}

export class PlainObject extends ResolvedObjectType {
    public readonly kind = 'plain' as const;
    constructor({ rawObject }: PlainObjectParams) { super({ rawObject }); Object.freeze(this); }
}

export type ResolvedObjectTypeUnion = NullableWrapperObject | PlainObject;
export function resolveObjectType(rawObject: ObjectType): ResolvedObjectTypeUnion { return PlainObject({ rawObject }); }

export function resolveCanonicalObjectType(rawObject: ObjectType, resolver: (type: SemanticType) => ResolvedSemanticType): CanonicalResolvedObjectType {
    const visible = relationSelect(rawObject.properties, property => relationEqual(property.name.value.value.startsWith('__'), false));
    const fields: readonly { readonly name: PropertyName; readonly type: ResolvedSemanticType; readonly presence: Presence }[] = relationProject(visible, property => ({
        name: property.name,
        type: resolver(property.type),
        presence: relationResolve(property.type.isOptional(), () => ({ kind: 'optional' }) as Presence, () => ({ kind: 'required' }) as Presence),
    }));
    const identityCatalog = [
        ['plain', { kind: 'plain', name: SemanticValueFactory.domainName(rawObject.name) }],
        ['resource', { kind: 'resource', name: SemanticValueFactory.resourceName(rawObject.name) }],
        ['model', { kind: 'model', name: SemanticValueFactory.modelName(rawObject.name) }],
        ['response', { kind: 'response', name: SemanticValueFactory.responseTypeName(rawObject.name) }],
    ] as const;
    const identity = relationResolve(
        relationEqual(rawObject.role, 'plain'),
        () => identityCatalog[0][1],
        () => relationResolve(relationEqual(rawObject.role, 'resource'), () => identityCatalog[1][1], () =>
            relationResolve(relationEqual(rawObject.role, 'model'), () => identityCatalog[2][1], () => identityCatalog[3][1])),
    );
    return CanonicalResolvedObjectType({ fields, identity });
}

export function resolveCanonicalNullable(type: SemanticType, resolver: (type: SemanticType) => ResolvedSemanticType): ResolvedSemanticType {
    return ResolvedNullableType.create({ innerType: resolver(type) });
}
