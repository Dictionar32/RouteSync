import type { ControllerModelOrigin } from './controller';
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

export type ModelReference = { readonly kind: 'model_reference'; readonly name: ModelName };
export type ResourceReference = { readonly kind: 'resource_reference'; readonly name: ResourceName };
export type RequestReference = { readonly kind: 'request_reference'; readonly name: RequestName };
export type ResponseReference = { readonly kind: 'response_reference'; readonly name: ResponseTypeName };
export type RouteReference = { readonly kind: 'route_reference'; readonly name: RouteName };
export type ChannelReference = { readonly kind: 'channel_reference'; readonly name: ChannelName };
export type ServiceReference = { readonly kind: 'service_reference'; readonly name: ClassName };
export type PropertyReference = { readonly kind: 'property_reference'; readonly name: PropertyName };
export type SourceReference = { readonly kind: 'source_reference'; readonly file: SourceFile };



export type SemanticRelation =
  | { readonly kind: 'resource_model'; readonly resource: ResourceReference; readonly model: ModelReference }
  | { readonly kind: 'request_property'; readonly request: RequestReference; readonly property: PropertyReference }
  | { readonly kind: 'response_resource'; readonly response: ResponseReference; readonly resource: ResourceReference }
  | { readonly kind: 'response_model'; readonly response: ResponseReference; readonly model: ModelReference }
  | { readonly kind: 'route_request'; readonly route: RouteReference; readonly request: RequestReference }
  | { readonly kind: 'route_response'; readonly route: RouteReference; readonly response: ResponseReference }
  | { readonly kind: 'route_controller'; readonly route: RouteReference; readonly controller: ControllerReference }
  | { readonly kind: 'controller_resource'; readonly controller: ControllerReference; readonly resource: ResourceReference }
  | { readonly kind: 'controller_model'; readonly controller: ControllerReference; readonly model: ControllerModelOrigin }
  | { readonly kind: 'controller_response'; readonly controller: ControllerReference; readonly response: ResponseReference };

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
