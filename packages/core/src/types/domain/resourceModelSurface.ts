import type { ModelSemanticDefinition, ParsedModel } from './models';
import type { ModelName, PropertyName, RelationName } from './semanticValues';
import type { ModelSemanticProperty, ModelPropertyMultiplicity } from './models';
import type { SemanticType } from '../../compiler/types/SemanticType';
import { createResourceModelMethodSurface, type ResourceModelMethodSurface } from './resourceModelMethodSurface';

export type ResourceModelMember =
  | { readonly kind: 'property'; readonly property: ModelSemanticProperty };

export type ResourceModelPropertyResolution =
  | { readonly kind: 'property'; readonly property: PropertyName; readonly semantic: ModelSemanticProperty; readonly semanticType: SemanticType };

export interface ResourceModelRelationResolution {
  readonly relation: RelationName;
  readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'relation' }>;
  readonly targetModel: ModelName;
  readonly semanticType: SemanticType;
  readonly multiplicity: ModelPropertyMultiplicity;
}

export type ResourceModelPropertyLookup =
  | { readonly kind: 'found'; readonly resolution: ResourceModelPropertyResolution }
  | { readonly kind: 'missing'; readonly property: PropertyName };

export type ResourceModelRelationLookup =
  | { readonly kind: 'found'; readonly resolution: ResourceModelRelationResolution }
  | { readonly kind: 'missing'; readonly relation: RelationName };

export interface ResourceModelSurface {
  readonly model: ModelName;
  readonly members: readonly ResourceModelMember[];
  readonly methods: ResourceModelMethodSurface;
  readonly resolveProperty: (property: PropertyName) => ResourceModelPropertyLookup;
  readonly resolveRelation: (relation: RelationName) => ResourceModelRelationLookup;
}

export function createResourceModelSemanticSurface(model: ModelSemanticDefinition): ResourceModelSurface {
  const surface = model.surface;
  const members = Object.freeze(surface.properties.map(property => Object.freeze({ kind: 'property' as const, property })));
  const resolveProperty = (property: PropertyName): ResourceModelPropertyLookup => {
    const member = surface.byName.lookup(property);
    if (member.kind === 'missing') return Object.freeze({ kind: 'missing', property });
    return Object.freeze({ kind: 'found', resolution: Object.freeze({ kind: 'property', property: member.value.property, semantic: member.value, semanticType: member.value.semanticType }) });
  };
  const resolveRelation = (relation: RelationName): ResourceModelRelationLookup => {
    const member = surface.relationsByName.lookup(relation);
    if (member.kind === 'missing') return Object.freeze({ kind: 'missing', relation });
    const semantic = member.value;
    return Object.freeze({ kind: 'found', resolution: Object.freeze({ relation, semantic, targetModel: semantic.targetModel, semanticType: semantic.semanticType, multiplicity: semantic.multiplicity }) });
  };
  return Object.freeze({ model: model.identity.name, members, methods: createResourceModelMethodSurface(model), resolveProperty, resolveRelation });
}

export function createResourceModelSurface(model: ParsedModel): ResourceModelSurface {
  const surface = model.semantic.surface;
  const members = Object.freeze(surface.properties.map(property =>
    Object.freeze({ kind: 'property' as const, property })
  ));

  const resolveProperty = (property: PropertyName): ResourceModelPropertyLookup => {
    const member = surface.byName.lookup(property);
    if (member.kind === 'missing') return Object.freeze({ kind: 'missing', property });
    return Object.freeze({
      kind: 'found',
      resolution: Object.freeze({
        kind: 'property',
        property: member.value.property,
        semantic: member.value,
        semanticType: member.value.semanticType
      })
    });
  };

  const resolveRelation = (relation: RelationName): ResourceModelRelationLookup => {
    const member = surface.relationsByName.lookup(relation);
    if (member.kind === 'missing') return Object.freeze({ kind: 'missing', relation });
    const semantic = member.value;
    return Object.freeze({
      kind: 'found',
      resolution: Object.freeze({
        relation: semantic.relation,
        semantic,
        targetModel: semantic.targetModel,
        semanticType: semantic.semanticType,
        multiplicity: semantic.multiplicity
      })
    });
  };

  return Object.freeze({
    model: model.semantic.identity.name,
    members,
    methods: createResourceModelMethodSurface(model.semantic),
    resolveProperty,
    resolveRelation
  });
}
