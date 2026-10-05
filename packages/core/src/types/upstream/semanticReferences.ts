import type { ControllerModelOrigin } from './controller';
import type { ControllerActionPolicyRelation } from './controllerActionPolicyRelations';
import type { RouteActionPolicyRelation } from './routeActionPolicyRelations';
import type {
  ModelName,
  ResourceName,
  RequestName,
  ResponseTypeName,
  RouteName,
  PropertyName,
  SourceFile,
  ChannelName,
  ClassName,
} from './names';

export type ClassReference = { readonly kind: 'class_reference'; readonly name: ClassName };

export type ModelReference = { readonly kind: 'model_reference'; readonly name: ModelName };
export type ResourceReference = { readonly kind: 'resource_reference'; readonly name: ResourceName };
export type RequestReference = { readonly kind: 'request_reference'; readonly name: RequestName };
export type ResponseReference = { readonly kind: 'response_reference'; readonly name: ResponseTypeName };
export type RouteReference = { readonly kind: 'route_reference'; readonly name: RouteName };
export type ChannelReference = { readonly kind: 'channel_reference'; readonly name: ChannelName };
export type ServiceReference = { readonly kind: 'service_reference'; readonly name: ClassName };
export type DependencyTargetReference = ModelReference | ServiceReference | ClassReference;
export type PropertyReference = { readonly kind: 'property_reference'; readonly name: PropertyName };
export type SourceReference = { readonly kind: 'source_reference'; readonly file: SourceFile };



export type StructuralSemanticRelation =
  | { readonly kind: 'resource_model'; readonly resource: ResourceReference; readonly model: ModelReference }
  | { readonly kind: 'model_relation'; readonly model: ModelReference; readonly target: ModelReference }
  | { readonly kind: 'request_property'; readonly request: RequestReference; readonly property: PropertyReference }
  | { readonly kind: 'response_resource'; readonly response: ResponseReference; readonly resource: ResourceReference }
  | { readonly kind: 'response_model'; readonly response: ResponseReference; readonly model: ModelReference }
  | { readonly kind: 'route_request'; readonly route: RouteReference; readonly request: RequestReference }
  | { readonly kind: 'route_response'; readonly route: RouteReference; readonly response: ResponseReference }
  | { readonly kind: 'route_controller'; readonly route: RouteReference; readonly controller: ControllerReference }
  | { readonly kind: 'controller_resource'; readonly controller: ControllerReference; readonly resource: ResourceReference }
  | { readonly kind: 'controller_model'; readonly controller: ControllerReference; readonly model: ControllerModelOrigin }
  | { readonly kind: 'controller_response'; readonly controller: ControllerReference; readonly response: ResponseReference }
  | { readonly kind: 'controller_dependency'; readonly controller: ControllerReference; readonly dependency: DependencyTargetReference }
  ;

export type SemanticRelation = StructuralSemanticRelation | ControllerActionPolicyRelation | RouteActionPolicyRelation;

export const isControllerActionPolicyRelation = (
  relation: SemanticRelation,
): relation is ControllerActionPolicyRelation =>
  relation.kind === 'controller_action_middleware_policy'
  || relation.kind === 'controller_action_authorization_policy';

export const isRouteActionPolicyRelation = (
  relation: SemanticRelation,
): relation is RouteActionPolicyRelation =>
  relation.kind === 'route_action_middleware_policy'
  || relation.kind === 'route_action_authorization_policy';

export const isPolicySemanticRelation = (
  relation: SemanticRelation,
): relation is ControllerActionPolicyRelation | RouteActionPolicyRelation =>
  isControllerActionPolicyRelation(relation) || isRouteActionPolicyRelation(relation);

export const isStructuralSemanticRelation = (
  relation: SemanticRelation,
): relation is StructuralSemanticRelation => !isPolicySemanticRelation(relation);

export type ControllerReference = { readonly kind: 'controller_reference'; readonly name: import('./names').ControllerName; readonly action: import('./names').ActionName };

export type SemanticRelationGraph = {
  readonly kind: 'semantic_relation_graph';
  readonly relations: import('./collections').Sequence<SemanticRelation>;
};

export type SemanticReference =
  | ModelReference
  | ResourceReference
  | RequestReference
  | ResponseReference
  | RouteReference
  | PropertyReference
  | ChannelReference
  | ServiceReference;

export const modelRef = (value: string): ModelReference => Object.freeze({
  kind: 'model_reference',
  name: Object.freeze({ kind: 'model_name', value: Object.freeze({ kind: 'string_value', value }) }),
});

export const responseRef = (value: string): ResponseReference => Object.freeze({
  kind: 'response_reference',
  name: Object.freeze({ kind: 'response_type_name', value: Object.freeze({ kind: 'string_value', value }) }),
});
