import {
  PrimitiveKind,
  type SemanticType,
  type GenericType,
  type UnionType,
  type IntersectionType,
  type ErrorType,
  type ReferenceType
} from '../../compiler/types/SemanticType';
import { SemanticValueFactory, type PropertyName, type ResourceName, type VariableName } from './semanticValues';
import type { StringValue } from '../upstream/valueObjects';

export interface RequestFieldMeaningVisitor<T> {
  readonly scalar: (value: ScalarRequestMeaning) => T;
  readonly object: (value: ObjectRequestMeaning) => T;
  readonly resource: (value: ResourceRequestMeaning) => T;
  readonly collection: (value: CollectionRequestMeaning) => T;
  readonly resourceCollection: (value: ResourceCollectionRequestMeaning) => T;
  readonly jsonValue: (value: JsonValueRequestMeaning) => T;
  readonly never: (value: NeverRequestMeaning) => T;
  readonly error: (value: ErrorRequestMeaning) => T;
  readonly union: (value: UnionRequestMeaning) => T;
  readonly intersection: (value: IntersectionRequestMeaning) => T;
  readonly generic: (value: GenericRequestMeaning) => T;
}

export interface ScalarRequestMeaning {
  readonly kind: 'scalar';
  readonly scalar: PrimitiveKind;
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface ObjectRequestField {
  readonly name: PropertyName;
  readonly meaning: RequestFieldMeaning;
}

export interface ObjectRequestMeaning {
  readonly kind: 'object';
  readonly fields: readonly ObjectRequestField[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface ResourceRequestMeaning {
  readonly kind: 'resource';
  readonly resourceName: ResourceName;
  readonly fields: readonly ObjectRequestField[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface CollectionRequestMeaning {
  readonly kind: 'collection';
  readonly element: RequestFieldMeaning;
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface ResourceCollectionRequestMeaning {
  readonly kind: 'resource_collection';
  readonly resourceName: ResourceName;
  readonly fields: readonly ObjectRequestField[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface JsonValueRequestMeaning {
  readonly kind: 'json_value';
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface NeverRequestMeaning {
  readonly kind: 'never';
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface ErrorRequestMeaning {
  readonly kind: 'error';
  readonly diagnosticMessage: StringValue;
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface UnionRequestMeaning {
  readonly kind: 'union';
  readonly members: readonly RequestFieldMeaning[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface IntersectionRequestMeaning {
  readonly kind: 'intersection';
  readonly members: readonly RequestFieldMeaning[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface GenericRequestMeaning {
  readonly kind: 'generic';
  readonly base: RequestFieldMeaning;
  readonly parameters: readonly RequestGenericParameter[];
  readonly accept: <T>(visitor: RequestFieldMeaningVisitor<T>) => T;
}

export interface RequestGenericParameter {
  readonly name: VariableName;
  readonly variance: 'covariant' | 'contravariant' | 'invariant';
  readonly meaning: RequestFieldMeaning;
}

export type RequestFieldMeaning =
  | ScalarRequestMeaning
  | ObjectRequestMeaning
  | ResourceRequestMeaning
  | CollectionRequestMeaning
  | ResourceCollectionRequestMeaning
  | JsonValueRequestMeaning
  | NeverRequestMeaning
  | ErrorRequestMeaning
  | UnionRequestMeaning
  | IntersectionRequestMeaning
  | GenericRequestMeaning;

class ScalarMeaning implements ScalarRequestMeaning {
  readonly kind = 'scalar' as const;
  constructor(readonly scalar: PrimitiveKind) { Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.scalar(this);
}

class ObjectMeaning implements ObjectRequestMeaning {
  readonly kind = 'object' as const;
  readonly fields: readonly ObjectRequestField[];
  constructor(fields: readonly ObjectRequestField[]) { this.fields = Object.freeze([...fields]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.object(this);
}

class ResourceMeaning implements ResourceRequestMeaning {
  readonly kind = 'resource' as const;
  readonly fields: readonly ObjectRequestField[];
  constructor(readonly resourceName: ResourceName, fields: readonly ObjectRequestField[]) { this.fields = Object.freeze([...fields]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.resource(this);
}

class CollectionMeaning implements CollectionRequestMeaning {
  readonly kind = 'collection' as const;
  constructor(readonly element: RequestFieldMeaning) { Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.collection(this);
}

class ResourceCollectionMeaning implements ResourceCollectionRequestMeaning {
  readonly kind = 'resource_collection' as const;
  readonly fields: readonly ObjectRequestField[];
  constructor(readonly resourceName: ResourceName, fields: readonly ObjectRequestField[]) { this.fields = Object.freeze([...fields]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.resourceCollection(this);
}

class JsonValueMeaning implements JsonValueRequestMeaning {
  readonly kind = 'json_value' as const;
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.jsonValue(this);
}

class NeverMeaning implements NeverRequestMeaning {
  readonly kind = 'never' as const;
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.never(this);
}

class ErrorMeaning implements ErrorRequestMeaning {
  readonly kind = 'error' as const;
  constructor(readonly diagnosticMessage: StringValue) { Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.error(this);
}

class UnionMeaning implements UnionRequestMeaning {
  readonly kind = 'union' as const;
  readonly members: readonly RequestFieldMeaning[];
  constructor(members: readonly RequestFieldMeaning[]) { this.members = Object.freeze([...members]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.union(this);
}

class IntersectionMeaning implements IntersectionRequestMeaning {
  readonly kind = 'intersection' as const;
  readonly members: readonly RequestFieldMeaning[];
  constructor(members: readonly RequestFieldMeaning[]) { this.members = Object.freeze([...members]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.intersection(this);
}

class GenericMeaning implements GenericRequestMeaning {
  readonly kind = 'generic' as const;
  readonly parameters: readonly RequestGenericParameter[];
  constructor(readonly base: RequestFieldMeaning, parameters: readonly RequestGenericParameter[]) { this.parameters = Object.freeze([...parameters]); Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldMeaningVisitor<T>): T => visitor.generic(this);
}

const objectMeaningFactories: Readonly<{ [K in import('../../compiler/types/SemanticType').ObjectTypeRole]: (value: import('../../compiler/types/SemanticType').ObjectType) => RequestFieldMeaning }> = Object.freeze({
  plain: value => objectMeaning(value),
  resource: value => resourceMeaning(value),
  model: value => objectMeaning(value),
  response: value => objectMeaning(value)
});

const referenceMeaningFactories: Readonly<{ [K in import('../../compiler/types/SemanticType').ObjectTypeRole]: (value: ReferenceType) => RequestFieldMeaning }> = Object.freeze({
  plain: value => objectReferenceMeaning(value),
  resource: value => resourceReferenceMeaning(value),
  model: value => objectReferenceMeaning(value),
  response: value => objectReferenceMeaning(value)
});

const fieldsOf = (value: import('../../compiler/types/SemanticType').ObjectType): readonly ObjectRequestField[] =>
  value.properties.map(property => ({
    name: property.name,
    meaning: resolve(property.type)
  }));

const objectMeaning = (value: import('../../compiler/types/SemanticType').ObjectType): RequestFieldMeaning =>
  new ObjectMeaning(fieldsOf(value));

const resourceMeaning = (value: import('../../compiler/types/SemanticType').ObjectType): RequestFieldMeaning =>
  new ResourceMeaning(SemanticValueFactory.resourceName(value.name), fieldsOf(value));

const objectReferenceMeaning = (_value: ReferenceType): RequestFieldMeaning =>
  new ObjectMeaning([]);

const resourceReferenceMeaning = (value: ReferenceType): RequestFieldMeaning =>
  new ResourceMeaning(SemanticValueFactory.resourceName(value.name), []);

const resolveUnion = (value: UnionType): RequestFieldMeaning =>
  new UnionMeaning(value.members.map(resolve));

const resolveIntersection = (value: IntersectionType): RequestFieldMeaning =>
  new IntersectionMeaning(value.members.map(resolve));

const resolveGeneric = (value: GenericType): RequestFieldMeaning =>
  new GenericMeaning(
    referenceMeaningFactories[value.base.role](value.base),
    value.parameters.map(parameter => ({
      name: parameter.name,
      variance: parameter.variance,
      meaning: resolve(parameter.type)
    }))
  );

const resolveError = (value: ErrorType): RequestFieldMeaning => new ErrorMeaning(value.diagnosticMessage);

const resolve = (type: SemanticType): RequestFieldMeaning => type.accept({
  primitive: value => new ScalarMeaning(value.type),
  jsonValue: () => new JsonValueMeaning(),
  optional: value => resolve(value.innerType),
  nullable: value => resolve(value.innerType),
  never: () => new NeverMeaning(),
  error: resolveError,
  union: resolveUnion,
  intersection: resolveIntersection,
  generic: resolveGeneric,
  reference: value => referenceMeaningFactories[value.role](value),
  readonlyCollection: value => new CollectionMeaning(resolve(value.elementType)),
  mutableCollection: value => new CollectionMeaning(resolve(value.elementType)),
  object: value => objectMeaningFactories[value.role](value)
});

export const RequestFieldMeaningFactory = Object.freeze({
  fromSemanticType: resolve
});
