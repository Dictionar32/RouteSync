import { toCamelCase } from '../../../utils/resource-naming';
import type { RequestField } from '../../types/domain/request';
import type { RequestFieldMeaningVisitor, ObjectRequestMeaning, ResourceRequestMeaning, CollectionRequestMeaning, ResourceCollectionRequestMeaning } from '../../../types/domain/requestFieldMeaning';
import { indent } from './readMapperBuilder';
import { toApiFieldKey } from './formMapperBuilder';

const direct = (field: RequestField): string =>
  `  [ApiApiField.${toApiFieldKey(field.sourceName)}]: form.${field.name},`;

const object = (field: RequestField, meaning: ObjectRequestMeaning | ResourceRequestMeaning): string => {
  const innerLines = meaning.fields
    .filter(item => !item.name.value.startsWith('__'))
    .map(item => `  [ApiApiField.${toApiFieldKey(item.name.value)}]: form.${field.name}?.${toCamelCase(item.name.value)}`)
    .join(',\n');
  return `  [ApiApiField.${toApiFieldKey(field.sourceName)}]: form.${field.name} ? {\n${indent(innerLines)}\n  } : undefined,`;
};

const collection = (field: RequestField, meaning: CollectionRequestMeaning): string =>
  meaning.element.accept(COLLECTION_RENDERERS(field));

const collectionObject = (field: RequestField, fields: ObjectRequestMeaning | ResourceRequestMeaning): string => {
  const innerLines = fields.fields
    .filter(item => !item.name.value.startsWith('__'))
    .map(item => `  [ApiApiField.${toApiFieldKey(item.name.value)}]: item.${toCamelCase(item.name.value)}`)
    .join(',\n');
  return `  [ApiApiField.${toApiFieldKey(field.sourceName)}]: form.${field.name}?.map(item => ({\n${indent(innerLines)}\n  })),`;
};

const visitor = (field: RequestField): RequestFieldMeaningVisitor<string> => ({
  scalar: () => direct(field),
  object: meaning => object(field, meaning),
  resource: meaning => object(field, meaning),
  collection: meaning => collection(field, meaning),
  resourceCollection: meaning => collectionObject(field, meaning),
  jsonValue: () => direct(field),
  never: () => direct(field),
  error: () => direct(field),
  union: () => direct(field),
  intersection: () => direct(field),
  generic: () => direct(field)
});

const COLLECTION_RENDERERS = (field: RequestField): RequestFieldMeaningVisitor<string> => ({
  scalar: () => direct(field),
  object: meaning => collectionObject(field, meaning),
  resource: meaning => collectionObject(field, meaning),
  collection: meaning => collection(field, meaning),
  resourceCollection: meaning => collectionObject(field, meaning),
  jsonValue: () => direct(field),
  never: () => direct(field),
  error: () => direct(field),
  union: () => direct(field),
  intersection: () => direct(field),
  generic: () => direct(field)
});

export function buildFormFieldLine(field: RequestField): string {
  return field.meaning.accept(visitor(field));
}

export function extractObjectPropertyNames(_target: unknown): readonly string[] {
  return [];
}
