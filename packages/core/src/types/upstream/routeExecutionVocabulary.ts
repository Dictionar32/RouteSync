import type { StringValue } from './valueObjects';

/** Canonical route execution vocabulary produced at the source/AST boundary. */
export const RouteHookKind = Object.freeze({
  Query: 'query',
  Mutation: 'mutation',
  InfiniteQuery: 'infinite_query'
} as const);
export type RouteHookKind = typeof RouteHookKind[keyof typeof RouteHookKind];

export const CrudRole = Object.freeze({
  Index: 'index',
  Show: 'show',
  Create: 'create',
  Update: 'update',
  Delete: 'delete',
  Custom: 'custom'
} as const);
export type CrudRole = typeof CrudRole[keyof typeof CrudRole];

export const RouteActionKind = Object.freeze({
  Create: 'create',
  Update: 'update',
  Read: 'read',
  Delete: 'delete'
} as const);
export type RouteActionKind = typeof RouteActionKind[keyof typeof RouteActionKind];

export const RequestContentType = Object.freeze({
  Json: 'application/json',
  Multipart: 'multipart/form-data',
  UrlEncoded: 'application/x-www-form-urlencoded',
  None: 'none'
} as const);
export type RequestContentType = typeof RequestContentType[keyof typeof RequestContentType];

export const HttpMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const);
export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

export const RoutePayloadMode = Object.freeze({
  None: 'none',
  Required: 'required',
  Optional: 'optional'
} as const);
export type RoutePayloadMode = typeof RoutePayloadMode[keyof typeof RoutePayloadMode];

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
