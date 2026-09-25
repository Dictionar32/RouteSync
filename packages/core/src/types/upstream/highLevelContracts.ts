import type { Expression } from './expression';
import type { ResourceFieldMeaning } from './resource';
import type { RequestFieldTarget } from './request';
import type { Presence } from './primitiveVocabulary';
import type { PropertyName, RoutePath } from './names';
import type { SourceSpan } from './provenance';
import type { TypeExpression } from './typeVocabulary';
import type { ModelReference, PropertyReference, ResourceReference } from './semanticReferences';
import type { RouteAuthentication, RouteMethod, RouteTarget } from './route';
import type { ControllerReturnSemantic } from './controller';
import type { RouteCapabilityContract } from './route';
import type { EndpointRequestBinding, EndpointResponseBinding } from './endpointBindings';
import type { ResponseJsonPayload, ResponseJsonShape, ResponseResult } from './response';
import type { RouteMiddlewares, RouteParameters, ValidationRules } from './collections';

export type { ResourceFieldMeaning, RequestFieldTarget };

export type ResponsePayloadContract = ResponseJsonPayload;
export type ResponseSemanticShape = ResponseJsonShape;
export type ResponseSemanticContract = ResponseResult;

export type RouteEndpointContract = {
  readonly kind: 'route_endpoint_contract';
  readonly method: RouteMethod;
  readonly path: RoutePath;
  readonly target: RouteTarget;
  readonly parameters: RouteParameters;
  readonly authentication: RouteAuthentication;
  readonly capability: RouteCapabilityContract;
  readonly middleware: RouteMiddlewares;
  readonly request: EndpointRequestBinding;
  readonly response: EndpointResponseBinding;
  readonly returnSemantic: ControllerReturnSemantic;
  readonly source: SourceSpan;
};
