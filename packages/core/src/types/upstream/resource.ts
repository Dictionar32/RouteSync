import type { Expression } from './expression';
import type { ActionName, PropertyName, ResourceName, RoutePath } from './names';
import type { Assignments, Properties, ResourceFields, ResourceActions, RoutePaths } from './collections';
import type { TypeExpression } from './typeVocabulary';
import type { Presence } from './primitiveVocabulary';
import type { SourceSpan } from './provenance';
import type { TruthValue } from './valueObjects';
import type { ModelReference, PropertyReference, ResourceReference, ResponseReference } from './semanticReferences';
import type { EloquentRelationCardinality, ModelPropertyMultiplicity } from './model';
import type { ModelRelationTargetShape, ModelRelationTraversalTarget } from './modelSourceFacts';

export type ResourceFieldMeaning =
  | { readonly kind: 'property_projection'; readonly property: PropertyReference; readonly model: ModelReference }
  | { readonly kind: 'relation_projection'; readonly relation: PropertyReference; readonly resource: ResourceReference; readonly targetModel: ModelReference; readonly cardinality: EloquentRelationCardinality; readonly multiplicity: ModelPropertyMultiplicity; readonly targetShape: ModelRelationTargetShape; readonly traversalTarget: ModelRelationTraversalTarget }
  | { readonly kind: 'computed_projection'; readonly expression: Expression };

export type ResourceField = {
  readonly kind: 'resource_field';
  readonly name: PropertyName;
  readonly expression: Expression;
  readonly meaning: ResourceFieldMeaning;
  readonly type: TypeExpression;
  readonly presence: Presence;
  readonly source: SourceSpan;
};

export type ResourceFacts = {
  readonly kind: 'resource_facts';
  readonly identity: ResourceReference;
  readonly model: ModelReference;
  readonly response: ResponseReference;
  readonly fields: ResourceFields;
  readonly assignments: Assignments;
  readonly sourceProperties: Properties;
  readonly actions: ResourceActions;
  readonly endpoints: RoutePaths;
  readonly synthetic: TruthValue;
  readonly source: SourceSpan;
};

export type ResourceDefinition = {
  readonly kind: 'resource';
  readonly name: ResourceName;
  readonly baseName: ResourceName;
  readonly model: ModelReference;
  readonly response: ResponseReference;
  readonly fields: ResourceFields;
  readonly assignments: Assignments;
  readonly sourceProperties: Properties;
  readonly actions: ResourceActions;
  readonly endpoints: RoutePaths;
  readonly synthetic: TruthValue;
  readonly source: SourceSpan;
};

export type ResourceBody = { readonly kind: 'body_absent' } | { readonly kind: 'body_present' };
export type ResourceResponsePresence = { readonly kind: 'response_absent' } | { readonly kind: 'response_present' };
export type ResourceAction = {
  readonly kind: 'resource_action';
  readonly name: ActionName;
  readonly method: import('./route').RouteMethod;
  readonly body: ResourceBody;
  readonly response: ResourceResponsePresence;
  readonly routes: RoutePaths;
};
export type ResourceResponse =
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceName }
  | { readonly kind: 'resource_paginated'; readonly resource: ResourceName };
