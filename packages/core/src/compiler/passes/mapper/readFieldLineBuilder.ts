import { toCamelCase } from '../../../utils/resource-naming';
import type {
  MappingIntent,
  ObjectMappingIntent,
  ResourceMappingIntent,
  CollectionMappingIntent,
  ResourceCollectionMappingIntent
} from '../../../types/domain/mappingIntent';

export function indent(block: string): string {
  return block.split('\n').map(line => `  ${line}`).join('\n');
}

const direct = (target: string, path: string): string => `  ${toCamelCase(target)}: ${path},`;

const object = (target: string, path: string, intent: ObjectMappingIntent | ResourceMappingIntent): string =>
  intent.fields
    .filter(field => !field.name.value.startsWith('__'))
    .map(field => buildFieldMappingLine(field.name.value, field.intent, `${path}.${field.name.value}`))
    .join('\n');

const collection = (target: string, path: string, intent: CollectionMappingIntent | ResourceCollectionMappingIntent): string => {
  const renderer = COLLECTION_RENDERERS[intent.kind];
  return renderer(target, path, intent);
};

const collectionObject = (
  target: string,
  path: string,
  fields: ObjectMappingIntent | ResourceMappingIntent
): string => {
  const body = fields.fields
    .filter(field => !field.name.value.startsWith('__'))
    .map(field => buildFieldMappingLine(field.name.value, field.intent, `item.${field.name.value}`))
    .join('\n');
  return `  ${toCamelCase(target)}: ${path}?.map(item => ({\n${indent(body)}\n  })),`;
};

const COLLECTION_RENDERERS: {
  readonly collection: (target: string, path: string, intent: CollectionMappingIntent) => string;
  readonly resource_collection: (target: string, path: string, intent: ResourceCollectionMappingIntent) => string;
} = {
  collection: (target, path, intent) => COLLECTION_ELEMENT_RENDERERS[intent.element.kind](target, path, intent.element),
  resource_collection: (target, path, intent) =>
    `  ${toCamelCase(target)}: ${path}.map(to${intent.resourceName.value}Read),`
};

const COLLECTION_ELEMENT_RENDERERS: {
  readonly [K in MappingIntent['kind']]: (target: string, path: string, intent: Extract<MappingIntent, { kind: K }>) => string;
} = {
  direct: (target, path) => direct(target, path),
  object: (target, path, intent) => collectionObject(target, path, intent),
  resource: (target, path, intent) => collectionObject(target, path, intent),
  collection: (target, path) => direct(target, path),
  resource_collection: (target, path) => direct(target, path)
};

const RENDERERS: {
  readonly [K in MappingIntent['kind']]: (target: string, path: string, intent: Extract<MappingIntent, { kind: K }>) => string;
} = {
  direct: (target, path) => direct(target, path),
  object: object,
  resource: object,
  collection,
  resource_collection: collection
};

export function buildFieldMappingLine(targetPropKey: string, intent: MappingIntent, jsonPath: string): string {
  return RENDERERS[intent.kind](targetPropKey, jsonPath, intent);
}

export function resolveResourceBaseName(intent: MappingIntent): string | null {
  return RESOURCE_NAMES[intent.kind](intent);
}

const RESOURCE_NAMES: {
  readonly [K in MappingIntent['kind']]: (intent: Extract<MappingIntent, { kind: K }>) => string | null;
} = {
  direct: () => null,
  object: () => null,
  resource: intent => intent.resourceName.value,
  collection: intent => RESOURCE_NAMES[intent.element.kind](intent.element),
  resource_collection: intent => intent.resourceName.value
};
