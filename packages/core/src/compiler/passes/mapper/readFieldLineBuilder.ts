import { toCamelPropertyName, propertyNameText } from '../../../utils/resource-naming';
import { relationProject, relationSelect } from '../../../semantic/kernel/semanticRelations';
import type { PropertyName } from '../../../types/domain/semanticValues';
import type {
  MappingIntent,
  ObjectMappingIntent,
  ResourceMappingIntent,
  CollectionMappingIntent,
  ResourceCollectionMappingIntent
} from '../../../types/domain/mappingIntent';

export function indent(block: string): string {
  return relationProject(block.split('\n'), line => `  ${line}`).join('\n');
}

const direct = (target: PropertyName, path: string): string => `  ${toCamelPropertyName(target)}: ${path},`;

const object = (target: PropertyName, path: string, intent: ObjectMappingIntent | ResourceMappingIntent): string =>
  relationProject(
    relationSelect(intent.fields, field => !field.name.value.value.startsWith('__')),
    field => buildFieldMappingLine(field.name, field.intent, `${path}.${propertyNameText(field.name)}`),
  ).join('\n');

const collection = (target: PropertyName, path: string, intent: CollectionMappingIntent | ResourceCollectionMappingIntent): string => {
  const renderer = COLLECTION_RENDERERS[intent.kind];
  return renderer(target, path, intent);
};

const collectionObject = (
  target: PropertyName,
  path: string,
  fields: ObjectMappingIntent | ResourceMappingIntent
): string => {
  const body = relationProject(
    relationSelect(fields.fields, field => !field.name.value.value.startsWith('__')),
    field => buildFieldMappingLine(field.name, field.intent, `item.${propertyNameText(field.name)}`),
  ).join('\n');
  return `  ${toCamelPropertyName(target)}: ${path}?.map(item => ({\n${indent(body)}\n  })),`;
};

const COLLECTION_RENDERERS: {
  readonly collection: (target: PropertyName, path: string, intent: CollectionMappingIntent) => string;
  readonly resource_collection: (target: PropertyName, path: string, intent: ResourceCollectionMappingIntent) => string;
} = {
  collection: (target, path, intent) => COLLECTION_ELEMENT_RENDERERS[intent.element.kind](target, path, intent.element),
  resource_collection: (target, path, intent) =>
    `  ${toCamelPropertyName(target)}: ${path}.map(to${intent.resourceName.value.value}Read),`
};

const COLLECTION_ELEMENT_RENDERERS: {
  readonly [K in MappingIntent['kind']]: (target: PropertyName, path: string, intent: Extract<MappingIntent, { kind: K }>) => string;
} = {
  direct: (target, path) => direct(target, path),
  object: (target, path, intent) => collectionObject(target, path, intent),
  resource: (target, path, intent) => collectionObject(target, path, intent),
  collection: (target, path) => direct(target, path),
  resource_collection: (target, path) => direct(target, path)
};

const RENDERERS: {
  readonly [K in MappingIntent['kind']]: (target: PropertyName, path: string, intent: Extract<MappingIntent, { kind: K }>) => string;
} = {
  direct: (target, path) => direct(target, path),
  object: object,
  resource: object,
  collection,
  resource_collection: collection
};

export function buildFieldMappingLine(targetPropKey: PropertyName, intent: MappingIntent, jsonPath: string): string {
  return RENDERERS[intent.kind](targetPropKey, jsonPath, intent);
}

