import type { SemanticResolution } from '../types/domain/semanticResolution';
import { matchSemanticResolution } from '../types/domain/semanticResolution';
import { ObjectType, PrimitiveKind, PrimitiveType, ReferenceType, ScannedObjectProperty } from '../compiler/types/SemanticType';
import type { SemanticType } from '../compiler/types/SemanticType';

export function semanticResolutionToBoundType(resolution: SemanticResolution): SemanticType {
  return matchSemanticResolution(resolution, {
    scalar: value => value.semanticType,
    model: value => new ReferenceType('', value.model.value),
    resource: value => new ReferenceType('', value.resource.value),
    object: value => ObjectType.create({
      name: 'AnonymousObject',
      baseName: 'AnonymousObject',
      role: 'plain',
      properties: value.fields.map(field => ScannedObjectProperty.create({
        name: field.name.value, type: field.type, required: true, origin: { kind: 'derived', reason: 'semantic_resolution' },
      })),
    }),
    query_projection: value => ObjectType.create({
      name: 'QueryProjection',
      baseName: 'QueryProjection',
      role: 'plain',
      properties: value.surface.fields.map(field => ScannedObjectProperty.create({
        name: field.name.value, type: field.type, required: true, origin: { kind: 'derived', reason: 'semantic_resolution' },
      })),
    }),
    unknown: () => new PrimitiveType(PrimitiveKind.UNKNOWN),
  });
}
