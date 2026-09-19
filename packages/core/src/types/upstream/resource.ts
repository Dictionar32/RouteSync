import type { Expression } from './expression';
import type { ActionName, ModelName, PropertyName, ResourceName, ResponseTypeName, RoutePath } from './names';
import type { Assignments, Properties, ResourceFields, ResourceActions, RoutePaths } from './collections';
import type { TypeExpression } from './typeVocabulary';
import type { Presence } from './primitiveVocabulary';
import type { SourceSpan } from './provenance';
import type { TruthValue } from './valueObjects';

export type ResourceField = {
  readonly kind: 'resource_field';
  readonly name: PropertyName;
  readonly expression: Expression;
  readonly type: TypeExpression;
  readonly presence: Presence;
  readonly source: SourceSpan;
};

export type ResourceDefinition = {
  readonly kind: 'resource';
  readonly name: ResourceName;
  readonly baseName: ResourceName;
  readonly model: ModelName;
  readonly responseType: ResponseTypeName;
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
