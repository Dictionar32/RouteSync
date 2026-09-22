import {
  type SemanticType,
  type ObjectProperty,
  type SemanticTypeVisitor,
  ReferenceType,
  ObjectType
} from '../../compiler/types/SemanticType';
import { SemanticValueFactory, type PropertyName, type ResourceName } from './semanticValues';

export interface MappingIntentField {
  readonly name: PropertyName;
  readonly intent: MappingIntent;
}

export interface DirectMappingIntent {
  readonly kind: 'direct';
}

export interface ObjectMappingIntent {
  readonly kind: 'object';
  readonly fields: readonly MappingIntentField[];
}

export interface ResourceMappingIntent {
  readonly kind: 'resource';
  readonly resourceName: ResourceName;
  readonly fields: readonly MappingIntentField[];
}

export interface CollectionMappingIntent {
  readonly kind: 'collection';
  readonly element: MappingIntent;
}

export interface ResourceCollectionMappingIntent {
  readonly kind: 'resource_collection';
  readonly resourceName: ResourceName;
  readonly fields: readonly MappingIntentField[];
}

export type MappingIntent =
  | DirectMappingIntent
  | ObjectMappingIntent
  | ResourceMappingIntent
  | CollectionMappingIntent
  | ResourceCollectionMappingIntent;

export interface ResourceMappingIntentGraph {
  readonly resourceName: ResourceName;
  readonly fields: readonly MappingIntentField[];
}

const resourceNameOf = (type: ReferenceType | ObjectType): ResourceName =>
  SemanticValueFactory.resourceName(type.name.endsWith('Resource') ? type.name.slice(0, -8) : type.name);

const isResourceReference = (type: ReferenceType): boolean =>
  type.name.endsWith('Resource') || type.namespace.includes('Resources');

const direct: DirectMappingIntent = Object.freeze({ kind: 'direct' });

function resolve(type: SemanticType): MappingIntent {
  return type.accept<MappingIntent>(VISITOR);
}

const fieldsOf = (properties: readonly ObjectProperty[]): readonly MappingIntentField[] =>
  Object.freeze(properties.map(field => Object.freeze({
    name: field.name,
    intent: resolve(field.type)
  })));

const VISITOR: SemanticTypeVisitor<MappingIntent> = {
  primitive: () => direct,
  jsonValue: () => direct,
  optional: type => resolve(type.innerType),
  nullable: type => resolve(type.innerType),
  never: () => direct,
  error: () => direct,
  reference: type => isResourceReference(type)
    ? Object.freeze({ kind: 'resource', resourceName: resourceNameOf(type), fields: Object.freeze([]) })
    : direct,
  union: () => direct,
  intersection: () => direct,
  readonlyCollection: type => collection(type.elementType),
  mutableCollection: type => collection(type.elementType),
  generic: () => direct,
  object: type => type.role === 'resource'
    ? Object.freeze({ kind: 'resource', resourceName: resourceNameOf(type), fields: fieldsOf(type.properties) })
    : Object.freeze({ kind: 'object', fields: fieldsOf(type.properties) })
};

function collection(element: SemanticType): MappingIntent {
  const intent = resolve(element);
  return COLLECTION_FACTORIES[intent.kind](intent);
}

const COLLECTION_FACTORIES: {
  readonly [K in MappingIntent['kind']]: (intent: Extract<MappingIntent, { kind: K }>) => MappingIntent;
} = {
  direct: () => Object.freeze({ kind: 'collection', element: direct }),
  object: intent => Object.freeze({ kind: 'collection', element: intent }),
  resource: intent => Object.freeze({ kind: 'resource_collection', resourceName: intent.resourceName, fields: intent.fields }),
  collection: intent => Object.freeze({ kind: 'collection', element: intent }),
  resource_collection: intent => Object.freeze({ kind: 'collection', element: intent })
};

export function resolveMappingIntent(type: SemanticType): MappingIntent {
  return resolve(type);
}

export function createResourceMappingIntentGraph(
  resourceName: string,
  fields: readonly ObjectProperty[]
): ResourceMappingIntentGraph {
  return Object.freeze({
    resourceName: SemanticValueFactory.resourceName(resourceName),
    fields: fieldsOf(fields)
  });
}
