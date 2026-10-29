import type { StringValue } from './valueObjects';

/** Canonical route execution vocabulary produced at the source/AST boundary. */
export interface RouteHookKindInterface {
  readonly Query: 'query';
  readonly Mutation: 'mutation';
  readonly InfiniteQuery: 'infinite_query';
}

export const RouteHookKind: RouteHookKindInterface = Object.freeze({
  Query: 'query',
  Mutation: 'mutation',
  InfiniteQuery: 'infinite_query'
} as const);
export type RouteHookKind = typeof RouteHookKind[keyof typeof RouteHookKind];

export interface CrudRoleInterface {
  readonly Index: 'index';
  readonly Show: 'show';
  readonly Create: 'create';
  readonly Update: 'update';
  readonly Delete: 'delete';
  readonly Custom: 'custom';
}

export const CrudRole: CrudRoleInterface = Object.freeze({
  Index: 'index',
  Show: 'show',
  Create: 'create',
  Update: 'update',
  Delete: 'delete',
  Custom: 'custom'
} as const);
export type CrudRole = typeof CrudRole[keyof typeof CrudRole];

export interface RouteActionKindInterface {
  readonly Create: 'create';
  readonly Update: 'update';
  readonly Read: 'read';
  readonly Delete: 'delete';
}

export const RouteActionKind: RouteActionKindInterface = Object.freeze({
  Create: 'create',
  Update: 'update',
  Read: 'read',
  Delete: 'delete'
} as const);
export type RouteActionKind = typeof RouteActionKind[keyof typeof RouteActionKind];

export interface RequestContentTypeInterface {
  readonly Json: 'application/json';
  readonly Multipart: 'multipart/form-data';
  readonly UrlEncoded: 'application/x-www-form-urlencoded';
  readonly None: 'none';
}

export const RequestContentType: RequestContentTypeInterface = Object.freeze({
  Json: 'application/json',
  Multipart: 'multipart/form-data',
  UrlEncoded: 'application/x-www-form-urlencoded',
  None: 'none'
} as const);
export type RequestContentType = typeof RequestContentType[keyof typeof RequestContentType];

export interface HttpMethodInterface {
  readonly GET: 'GET';
  readonly POST: 'POST';
  readonly PUT: 'PUT';
  readonly PATCH: 'PATCH';
  readonly DELETE: 'DELETE';
  readonly OPTIONS: 'OPTIONS';
  readonly HEAD: 'HEAD';
  readonly QUERY: 'QUERY';
}

export const HttpMethod: HttpMethodInterface = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
  QUERY: 'QUERY'
} as const);
export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

export interface RoutePayloadModeInterface {
  readonly None: 'none';
  readonly Required: 'required';
  readonly Optional: 'optional';
}

export const RoutePayloadMode: RoutePayloadModeInterface = Object.freeze({
  None: 'none',
  Required: 'required',
  Optional: 'optional'
} as const);
export type RoutePayloadMode = typeof RoutePayloadMode[keyof typeof RoutePayloadMode];

/** Closed upstream placement for unwrapped endpoint variables. Runtime consumers must not infer this from HTTP method. */
export interface RoutePayloadLocationInterface {
  readonly None: 'none';
  readonly Query: 'query';
  readonly Body: 'body';
}

export const RoutePayloadLocation: RoutePayloadLocationInterface = Object.freeze({
  None: 'none',
  Query: 'query',
  Body: 'body'
} as const);
export type RoutePayloadLocation = typeof RoutePayloadLocation[keyof typeof RoutePayloadLocation];

/**
 * Proof-carrying resolution of payload placement. The method convention is an
 * explicit fallback policy, not evidence masquerading as a source fact.
 */
export type RoutePayloadLocationDecision =
  | {
      readonly kind: 'explicit_boundary';
      readonly location: RoutePayloadLocation;
      readonly closed: true;
    }
  | {
      readonly kind: 'http_method_fallback_policy';
      readonly method: HttpMethod;
      readonly policy: 'laravel_http_method_payload_convention';
      readonly location: RoutePayloadLocation;
      readonly closed: true;
    };

export interface RoutePayloadLocationOperationsInterface {
  readonly fromMethod: (method: HttpMethod) => RoutePayloadLocation;
}

export const routePayloadLocationOperations: RoutePayloadLocationOperationsInterface = Object.freeze({
  fromMethod: (method: HttpMethod): RoutePayloadLocation =>
    method === HttpMethod.GET || method === HttpMethod.HEAD
      ? RoutePayloadLocation.Query
      : RoutePayloadLocation.Body,
});

export interface NoPayloadExecutionSignature {
  readonly payloadMode: 'none';
  readonly parameterDeclaration: '';
  readonly callArgumentsExpression: '';
  readonly hasPayload: false;
  readonly isOptional: true;
}

export interface RequiredPayloadExecutionSignature {
  readonly payloadMode: 'required';
  readonly parameterDeclaration: StringValue;
  readonly callArgumentsExpression: StringValue;
  readonly hasPayload: true;
  readonly isOptional: false;
}

export interface OptionalPayloadExecutionSignature {
  readonly payloadMode: 'optional';
  readonly parameterDeclaration: StringValue;
  readonly callArgumentsExpression: StringValue;
  readonly hasPayload: true;
  readonly isOptional: true;
}

export type RouteExecutionSignature =
  | NoPayloadExecutionSignature
  | RequiredPayloadExecutionSignature
  | OptionalPayloadExecutionSignature;
