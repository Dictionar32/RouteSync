/**
 * modelNormalizer.ts
 *
 * Projects canonical upstream ModelSemanticProperty judgments into the
 * legacy NormalizedModel compatibility shape. Semantic meaning is never
 * reconstructed from columns/casts/accessor bags here.
 */

import {
  type RouteManifest,
  type SemanticResolutionKernel,
  type ModelSemanticProperty,
  type SemanticType,
  PrimitiveKind,
} from '@routesync/core';
import type {
  NormalizedModel,
  NormalizedField,
  NormalizedAccessor
} from '../normalizerTypes';

const propertyName = (property: ModelSemanticProperty): string => property.property.value.value;

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }): readonly T[] =>
  sequence.kind === 'empty' ? [] : [sequence.head, ...sequenceToArray(sequence.tail)];

const primitiveField = (type: PrimitiveKind, nullable: boolean): NormalizedField => ({
  kind: 'primitive',
  type: type === PrimitiveKind.NUMBER
    ? 'number'
    : type === PrimitiveKind.BOOLEAN
      ? 'boolean'
      : 'string',
  nullable,
});

const semanticTypeToField = (type: SemanticType, nullable = type.isNullable()): NormalizedField =>
  type.accept({
    primitive: value => primitiveField(value.type, nullable),
    jsonValue: () => ({ kind: 'primitive', type: 'string', nullable }),
    never: () => ({ kind: 'primitive', type: 'string', nullable }),
    error: () => ({ kind: 'primitive', type: 'string', nullable }),
    reference: value => value.role === 'model'
      ? { kind: 'model', modelName: value.name, collection: false, nullable }
      : { kind: 'primitive', type: 'string', nullable },
    union: value => semanticTypeToField(value.members[0] ?? type, nullable),
    intersection: value => semanticTypeToField(value.members[0] ?? type, nullable),
    readonlyCollection: value => {
      const element = semanticTypeToField(value.elementType, nullable);
      return element.kind === 'model'
        ? { ...element, collection: true, nullable }
        : { kind: 'primitive', type: element.kind === 'primitive' ? element.type : 'string', nullable };
    },
    mutableCollection: value => {
      const element = semanticTypeToField(value.elementType, nullable);
      return element.kind === 'model'
        ? { ...element, collection: true, nullable }
        : { kind: 'primitive', type: element.kind === 'primitive' ? element.type : 'string', nullable };
    },
    generic: () => ({ kind: 'primitive', type: 'string', nullable }),
    optional: value => semanticTypeToField(value.innerType, nullable || value.isOptional()),
    nullable: value => semanticTypeToField(value.innerType, true),
    object: () => ({ kind: 'object', fields: {}, nullable }),
  });

const propertyField = (property: ModelSemanticProperty): NormalizedField => {
  if (property.kind === 'relation') {
    const collection = property.multiplicity.kind === 'collection';
    return {
      kind: 'model',
      modelName: property.targetModel.value.value,
      collection,
      nullable: !collection && property.traversal.semanticType.kind === 'nullable',
    };
  }
  return semanticTypeToField(
    property.traversal.semanticType,
    property.traversal.semanticType.kind === 'nullable' || property.kind === 'column'
      ? property.nullability.kind === 'nullable'
      : property.traversal.semanticType.isNullable(),
  );
};

const accessorEntry = (property: Extract<ModelSemanticProperty, { readonly kind: 'accessor' }>): NormalizedAccessor => ({
  name: propertyName(property),
  returnType: propertyField(property),
});

export function normalizeModels(manifest: RouteManifest, _kernel?: SemanticResolutionKernel): NormalizedModel[] {
  return manifest.models.map(model => {
    const semantic = model.definition.semantic;
    const fields: Record<string, NormalizedField> = {};
    const accessors: Record<string, NormalizedAccessor> = {};

    for (const property of sequenceToArray(semantic.surface.properties)) {
      if (property.kind === 'accessor') {
        accessors[propertyName(property)] = accessorEntry(property);
      } else {
        fields[propertyName(property)] = propertyField(property);
      }
    }

    return {
      symbolId: `model:${semantic.identity.name.value.value}`,
      name: semantic.identity.name.value.value,
      tableName: semantic.identity.table.value.value,
      fields,
      accessors,
      appends: sequenceToArray(semantic.exposure.appends).map(value => value.value.value),
    };
  });
}
