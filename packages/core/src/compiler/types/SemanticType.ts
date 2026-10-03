/**
 * Relation-native semantic type algebra.
 *
 * Semantic types are immutable witnesses.  There is no class hierarchy and
 * no constructor-owned semantic state: each factory emits a closed structural
 * witness whose kind and payload are the semantic facts.
 */
import { TypeScriptSyntax } from '../domain/common/TypeScriptTypeLowerer';
import type { ResourceFieldDescriptor } from '../../types/route';
import { toCamelCase } from '../../utils/resource-naming';
import type { ObjectPropertyOrigin } from '../../types/domain/objectPropertyOrigin';
import { SemanticValueFactory, type PropertyName, type VariableName } from '../../types/domain/semanticValues';
import type { StringValue } from '../../types/upstream/valueObjects';
import { relationEqual, relationResolve } from '../../semantic/kernel/semanticRelations';
import { expandRelation } from '../../semantic/kernel/relationalSequence';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';

export enum PrimitiveKind {
    STRING = 'string', NUMBER = 'number', BOOLEAN = 'boolean', DATETIME = 'datetime', FILE = 'file',
    INDETERMINATE = 'indeterminate', UNSPECIFIED = 'unspecified'
}

export enum CollectionKind { ARRAY = 'array', COLLECTION = 'collection', NULLABLE = 'nullable' }

export const SemanticTypeKind = Object.freeze({
    Primitive: 'primitive', JsonValue: 'json_value', Optional: 'optional', Nullable: 'nullable',
    Never: 'never', Error: 'error', Reference: 'reference', Union: 'union', Intersection: 'intersection',
    ReadonlyCollection: 'readonly_collection', MutableCollection: 'mutable_collection', Generic: 'generic', Object: 'object'
} as const);
export type SemanticTypeKind = typeof SemanticTypeKind[keyof typeof SemanticTypeKind];

export type ObjectTypeRole = 'plain' | 'resource' | 'model' | 'response';
export type GenericVariance = 'covariant' | 'contravariant' | 'invariant';

export interface SemanticTypeBase {
    readonly kind: SemanticTypeKind;
    readonly accept: <R>(visitor: SemanticTypeVisitor<R>) => R;
    readonly isNullable: () => boolean;
    readonly isOptional: () => boolean;
    readonly formatProperty: (name: string, lowerType: (type: SemanticType) => string) => string;
}

export interface PrimitiveType extends SemanticTypeBase { readonly kind: 'primitive'; readonly type: PrimitiveKind; }
export interface JsonValueType extends SemanticTypeBase { readonly kind: 'json_value'; }
export interface NeverType extends SemanticTypeBase { readonly kind: 'never'; }
export interface ErrorType extends SemanticTypeBase { readonly kind: 'error'; readonly diagnosticMessage: StringValue; }
export interface ReferenceType extends SemanticTypeBase {
    readonly kind: 'reference'; readonly namespace: string; readonly name: string; readonly role: ObjectTypeRole; readonly emittedName: string;
}
export interface UnionType extends SemanticTypeBase { readonly kind: 'union'; readonly members: readonly SemanticType[]; }
export interface IntersectionType extends SemanticTypeBase { readonly kind: 'intersection'; readonly members: readonly SemanticType[]; }
export interface ReadonlyCollectionType extends SemanticTypeBase { readonly kind: 'readonly_collection'; readonly collectionKind: CollectionKind; readonly elementType: SemanticType; }
export interface MutableCollectionType extends SemanticTypeBase { readonly kind: 'mutable_collection'; readonly collectionKind: CollectionKind; readonly elementType: SemanticType; }
export interface GenericParameter { readonly name: VariableName; readonly variance: GenericVariance; readonly type: SemanticType; }
export interface GenericType extends SemanticTypeBase { readonly kind: 'generic'; readonly base: ReferenceType; readonly parameters: readonly GenericParameter[]; }
export interface OptionalType extends SemanticTypeBase { readonly kind: 'optional'; readonly innerType: SemanticType; }
export interface NullableType extends SemanticTypeBase { readonly kind: 'nullable'; readonly innerType: SemanticType; }

export interface ObjectProperty { readonly name: PropertyName; readonly type: SemanticType; readonly description: string; readonly origin: ObjectPropertyOrigin; }
export interface ScannedObjectPropertyParams { readonly name: PropertyName; readonly type: SemanticType; readonly description: string; readonly origin: ObjectPropertyOrigin; }
export interface ScannedObjectProperty extends ObjectProperty {}
export interface ObjectTypeDescriptorParams {
    readonly name: string; readonly baseName: string; readonly properties: readonly ObjectProperty[]; readonly role: ObjectTypeRole;
    readonly baseObject?: ReferenceType; readonly interfaces?: readonly ReferenceType[];
}
export interface ObjectType extends SemanticTypeBase {
    readonly kind: 'object'; readonly name: string; readonly baseName: string; readonly properties: readonly ObjectProperty[];
    readonly role: ObjectTypeRole; readonly baseObject?: ReferenceType; readonly interfaces: readonly ReferenceType[];
}

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

export type SemanticType = PrimitiveType | JsonValueType | OptionalType | NullableType | NeverType | ErrorType |
    ReferenceType | UnionType | IntersectionType | ReadonlyCollectionType | MutableCollectionType | GenericType | ObjectType;

const baseWitness = <K extends SemanticTypeKind>(kind: K, accept: SemanticTypeBase['accept'], nullable = false, optional = false) => ({
    kind, accept, isNullable: () => nullable, isOptional: () => optional,
});

export function primitiveType(type: PrimitiveKind): PrimitiveType {
    const witness = {
        ...baseWitness('primitive', visitor => visitor.primitive(witness)), type,
        formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)),
    } satisfies PrimitiveType;
    return Object.freeze(witness);
}

export function JsonValueType(): JsonValueType {
    const witness = { ...baseWitness('json_value', visitor => visitor.jsonValue(witness)), formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies JsonValueType;
    return Object.freeze(witness);
}

export function NeverType(): NeverType {
    const witness = { ...baseWitness('never', visitor => visitor.never(witness)), formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies NeverType;
    return Object.freeze(witness);
}

export function ErrorType(diagnosticMessage: string): ErrorType {
    const witness = { ...baseWitness('error', visitor => visitor.error(witness)), diagnosticMessage: Object.freeze({ kind: 'string_value', value: diagnosticMessage }) as StringValue, formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies ErrorType;
    return Object.freeze(witness);
}

const reference = (namespace: string, name: string, role: ObjectTypeRole): ReferenceType => {
    const emittedName = relationResolve(relationEqual(role, 'resource'), () => relationResolve(name.endsWith('Transformed'), () => name, () => `${name}Transformed`), () => name);
    const witness = { ...baseWitness('reference', visitor => visitor.reference(witness)), namespace, name, role, emittedName, formatProperty: (property: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(property, lower(witness)) } satisfies ReferenceType;
    return Object.freeze(witness);
};

export function ReferenceType(namespace: string, name: string, role: ObjectTypeRole = 'plain'): ReferenceType { return reference(namespace, name, role); }
export namespace ReferenceType {
    export const model = (namespace: string, name: string): ReferenceType => reference(namespace, name, 'model');
    export const resource = (namespace: string, name: string): ReferenceType => reference(namespace, name, 'resource');
    export const response = (namespace: string, name: string): ReferenceType => reference(namespace, name, 'response');
    export const plain = (namespace: string, name: string): ReferenceType => reference(namespace, name, 'plain');
}

const compound = (kind: 'union' | 'intersection', members: readonly SemanticType[]): SemanticType => {
    const witness = { ...baseWitness(kind, visitor => relationResolve(relationEqual(kind, 'union'), () => visitor.union(witness as UnionType), () => visitor.intersection(witness as IntersectionType))), members: Object.freeze([...members]), formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness as SemanticType)) };
    return Object.freeze(witness);
};
export function UnionType(members: readonly SemanticType[]): UnionType { return compound('union', members) as UnionType; }
export namespace UnionType { export const of = (...members: readonly (SemanticType | readonly SemanticType[])[]): UnionType => UnionType(expandRelation(members)); }
export function IntersectionType(members: readonly SemanticType[]): IntersectionType { return compound('intersection', members) as IntersectionType; }
export namespace IntersectionType { export const of = (...members: readonly (SemanticType | readonly SemanticType[])[]): IntersectionType => IntersectionType(expandRelation(members)); }

export function ReadonlyCollectionType(collectionKind: CollectionKind, elementType: SemanticType): ReadonlyCollectionType {
    const witness = { ...baseWitness('readonly_collection', visitor => visitor.readonlyCollection(witness)), collectionKind, elementType, formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies ReadonlyCollectionType;
    return Object.freeze(witness);
}
export function MutableCollectionType(collectionKind: CollectionKind, elementType: SemanticType): MutableCollectionType {
    const witness = { ...baseWitness('mutable_collection', visitor => visitor.mutableCollection(witness)), collectionKind, elementType, formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies MutableCollectionType;
    return Object.freeze(witness);
}
export function GenericType(base: ReferenceType, parameters: readonly GenericParameter[]): GenericType {
    const witness = { ...baseWitness('generic', visitor => visitor.generic(witness)), base, parameters: Object.freeze([...parameters]), formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies GenericType;
    return Object.freeze(witness);
}
export function OptionalType(innerType: SemanticType): OptionalType {
    const witness = { ...baseWitness('optional', visitor => visitor.optional(witness), false, true), innerType, formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatOptionalProperty(name, lower(innerType)) } satisfies OptionalType;
    return Object.freeze(witness);
}
export function NullableType(innerType: SemanticType): NullableType {
    const witness = { ...baseWitness('nullable', visitor => visitor.nullable(witness), true, false), innerType, formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness)) } satisfies NullableType;
    return Object.freeze(witness);
}

export function ScannedObjectProperty(params: ScannedObjectPropertyParams): ScannedObjectProperty { return Object.freeze({ ...params }); }
export namespace ScannedObjectProperty { export const create = (params: ScannedObjectPropertyParams): ScannedObjectProperty => ScannedObjectProperty(params); }

export const ObjectProperty = Object.freeze({
    fromResourceField(field: ResourceFieldDescriptor): ObjectProperty {
        const type = SemanticTypeResolver.resolveField(field);
        return ScannedObjectProperty({ name: SemanticValueFactory.propertyName(toCamelCase(field.name.value)), type, description: '', origin: { kind: 'bound_expression', bound: field.semantic.bound } });
    }
});

export function ObjectType(params: ObjectTypeDescriptorParams): ObjectType {
    const interfaces = relationResolve(Object.prototype.hasOwnProperty.call(params, 'interfaces'), () => params.interfaces as readonly ReferenceType[], () => []);
    const witness = {
        ...baseWitness('object', visitor => visitor.object(witness)), name: params.name, baseName: params.baseName,
        properties: Object.freeze([...params.properties]), role: params.role, baseObject: params.baseObject,
        interfaces: Object.freeze([...interfaces]), formatProperty: (name: string, lower: (t: SemanticType) => string) => TypeScriptSyntax.formatProperty(name, lower(witness))
    } satisfies ObjectType;
    return Object.freeze(witness);
}
export namespace ObjectType {
    export const create = (params: ObjectTypeDescriptorParams): ObjectType => ObjectType(params);
    export const empty = (name: string, baseName = name): ObjectType => ObjectType({ name, baseName, properties: [], role: 'plain' });
}

export const SemanticTypeFactory = Object.freeze({
    primitive: primitiveType,
    json: JsonValueType,
    never: NeverType,
    error: ErrorType,
    reference: ReferenceType,
    nullable: NullableType,
    optional: OptionalType,
    collection: (kind: CollectionKind, element: SemanticType): ReadonlyCollectionType => ReadonlyCollectionType(kind, element),
    mutableCollection: MutableCollectionType,
    union: (members: readonly SemanticType[]): UnionType => UnionType(members),
    intersection: (members: readonly SemanticType[]): IntersectionType => IntersectionType(members),
    generic: GenericType,
    object: ObjectType,
});

