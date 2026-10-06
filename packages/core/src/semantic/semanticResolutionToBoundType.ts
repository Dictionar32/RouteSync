import type { SemanticResolution } from '../types/domain/semanticResolution';
import { matchSemanticResolution } from '../types/domain/semanticResolution';
import { ObjectType, PrimitiveKind, PrimitiveType, ReferenceType, ScannedObjectProperty } from '../types/domain/semanticType';
import type { SemanticType } from '../types/domain/semanticType';
import { SemanticValueFactory } from '../types/domain/semanticValues';
import { relationProject } from './kernel/relationalSequence';

export function semanticResolutionToBoundType(resolution: SemanticResolution): SemanticType {
  return matchSemanticResolution(resolution, {
    scalar: value => value.semanticType,
    model: value => ReferenceType.model('', value.model.value.value),
    resource: value => ReferenceType.resource('', value.resource.value.value),
    object: value => ObjectType.create({
      name: 'AnonymousObject',
      baseName: 'AnonymousObject',
      role: 'plain',
      properties: relationProject(value.fields, field => ScannedObjectProperty.create({
        name: SemanticValueFactory.propertyName(field.name.value), type: field.type, description: '', origin: { kind: 'derived', reason: 'semantic_resolution' },
      })),
    }),
    query_projection: value => ObjectType.create({
      name: 'QueryProjection',
      baseName: 'QueryProjection',
      role: 'plain',
      properties: relationProject(value.surface.fields, field => ScannedObjectProperty.create({
        name: SemanticValueFactory.propertyName(field.name.value), type: field.type, description: '', origin: { kind: 'derived', reason: 'semantic_resolution' },
      })),
    }),
    indeterminate: () => primitiveType(PrimitiveKind.INDETERMINATE),
  });
}
