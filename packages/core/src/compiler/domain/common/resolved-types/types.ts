/**
 * types.ts
 *
 * Parameter contracts and vocabulary for ResolvedSemanticType domain hierarchy.
 *
 * @module compiler/domain/common/resolved-types/types
 */

import type { ResolvedSemanticType } from './catamorphism';
import type { PropertyName, DomainTypeName } from '../../../../types/upstream/names';
import type { Presence } from '../../../../types/upstream/primitiveVocabulary';

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
    readonly namespace: string;
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

export interface PlainObjectIdentity {
    readonly kind: 'plain';
    readonly name: DomainTypeName;
}

export interface ResourceObjectIdentity {
    readonly kind: 'resource';
    readonly name: import('../../../../types/upstream/names').ResourceName;
}

export interface ModelObjectIdentity {
    readonly kind: 'model';
    readonly name: import('../../../../types/upstream/names').ModelName;
}

export interface ResponseObjectIdentity {
    readonly kind: 'response';
    readonly name: import('../../../../types/upstream/names').ResponseTypeName;
}


export type PropertyPresence = Presence;

export interface ResolvedProperty {
    readonly name: PropertyName;
    readonly type: ResolvedSemanticType;
    readonly presence: Presence;
}

export type ResolvedObjectIdentity =
    | PlainObjectIdentity
    | ResourceObjectIdentity
    | ModelObjectIdentity
    | ResponseObjectIdentity;

export interface ResolvedObjectTypeParams {
    readonly fields: readonly ResolvedProperty[];
    readonly identity: ResolvedObjectIdentity;
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
