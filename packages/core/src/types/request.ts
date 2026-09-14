/**
 * Request, Route Definition, and Schema Contracts
 *
 * Core request definitions for RouteSync SDK and Compiler.
 * Eliminates naked `Record<string, any>`, `null`, and `any` in favor of
 * strongly-typed Domain Models and Null Objects.
 * Follows Rule 10, 11, and 12: Complete Contracts (0 '?', 0 'null'),
 * 100% direct assignment in constructors, and static semantic factories.
 *
 * @module types/request
 */

import {
  RequestHeaders,
  RouteParameters,
  RouteQueryParameters,
  RequestPayload,
  RouteSchemaModel,
  ResponseSchemaModel,
  RouteMapperModel,
  type RouteParameterEntry,
  type RouteQueryEntry,
  type PayloadPropertyEntry
} from './domain/requestModels';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type RouteTransformFn<TInput = unknown, TOutput = unknown> = (value: TInput) => TOutput;
export type RouteTransform<TInput = unknown, TOutput = unknown> = RouteTransformFn<TInput, TOutput>;

export interface RouteTransformMap {
  readonly params: RouteTransformFn;
  readonly query: RouteTransformFn;
  readonly body: RouteTransformFn;
  readonly request: RouteTransformFn;
  readonly response: RouteTransformFn;
}

export class RouteTransformMapFactory {
  public static empty(): RouteTransformMap {
    const identity: RouteTransformFn = (val: unknown) => val;
    return Object.freeze({
      params: identity,
      query: identity,
      body: identity,
      request: identity,
      response: identity
    });
  }
}

export type RouteMapper = RouteTransformFn | RouteTransformMap;

export type SafeParseResult<T = unknown> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: unknown };

export interface RouteParserSchema<T = unknown> {
  readonly parse: (input: unknown) => T;
  readonly safeParse: (input: unknown) => SafeParseResult<T>;
}

export interface RouteSchemaMap {
  readonly params: RouteSchemaValue;
  readonly query: RouteSchemaValue;
  readonly body: RouteSchemaValue;
  readonly request: RouteSchemaValue;
  readonly response: RouteSchemaValue;
}

export class RouteSchemaMapFactory {
  public static empty(): RouteSchemaMap {
    const emptySchema = RouteSchemaModel.empty();
    return Object.freeze({
      params: emptySchema,
      query: emptySchema,
      body: emptySchema,
      request: emptySchema,
      response: emptySchema
    });
  }
}

export type RouteSchemaValue = RouteTransformFn | RouteParserSchema | RouteSchemaModel;
export type RouteSchema = RouteSchemaValue | RouteSchemaMap;

export interface RequestOptionsContract {
  readonly params: RouteParameters;
  readonly headers: RequestHeaders;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
}

export class RequestOptionsDescriptor implements RequestOptionsContract {
  public readonly params: RouteParameters;
  public readonly headers: RequestHeaders;
  public readonly timeoutMs: number;
  public readonly signal: AbortSignal;

  constructor(
    params: RouteParameters = RouteParameters.empty(),
    headers: RequestHeaders = RequestHeaders.empty(),
    timeoutMs: number = 0,
    signal: AbortSignal = new AbortController().signal
  ) {
    this.params = params;
    this.headers = headers;
    this.timeoutMs = timeoutMs;
    this.signal = signal;
    Object.freeze(this);
  }

  public static empty(): RequestOptionsDescriptor {
    return new RequestOptionsDescriptor();
  }
}

export interface RequestOptions {
  readonly params?: RouteParameters;
  readonly headers?: RequestHeaders;
  readonly timeout?: number;
  readonly signal?: AbortSignal;
}

export interface ResponseSchema<T = unknown> {
  parse(input: unknown): T;
}

export interface RouteContractConfig {
  readonly body: (payload: unknown) => unknown;
  readonly response: ResponseSchema<unknown> | ((payload: unknown) => unknown);
}

export class RouteContractConfigFactory {
  public static empty(): RouteContractConfig {
    const identity = (payload: unknown) => payload;
    return Object.freeze({
      body: identity,
      response: identity
    });
  }
}

export type PhantomCarrier<T> = { readonly __type: (target: T) => T };

/**
 * Complete Route Definition Contract (0 '?', 0 'null', 0 naked Record)
 */
export interface RouteDefinitionContract<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> {
  readonly method: TMethod;
  readonly path: string | Function;
  readonly auth: boolean;
  readonly schema: RouteSchema;
  readonly responseSchema: ResponseSchema<TResponse>;
  readonly contract: RouteContractConfig;
  readonly mapper: RouteMapper;
  readonly headers: RequestHeaders;
  readonly cache: unknown;
  readonly retry: unknown;
  readonly body: RequestPayload;
  readonly params: RouteParameters;
  readonly query: RouteQueryParameters;
  readonly _typeResponse: PhantomCarrier<TResponse>;
  readonly _typeParams: PhantomCarrier<TParams>;
  readonly _typeBody: PhantomCarrier<TBody>;
}

/**
 * Backward-compatible RouteDefinition type definition for SDK, React hooks, and CLI generators.
 */
export type RouteDefinition<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> = {
  method: TMethod;
  path: string | Function;
  auth?: boolean;
  schema?: RouteSchema;
  responseSchema?: ResponseSchema<TResponse>;
  contract?: RouteContractConfig;
  mapper?: RouteMapper;
  headers?: RequestHeaders;
  cache?: unknown;
  retry?: unknown;
  body?: RequestPayload;
  params?: RouteParameters;
  query?: RouteQueryParameters;
  _typeResponse?: PhantomCarrier<TResponse> | TResponse;
  _typeParams?: PhantomCarrier<TParams> | TParams;
  _typeBody?: PhantomCarrier<TBody> | TBody;
};

/**
 * Parameter Contract for RouteDefinitionDescriptor Constructor (0 '?', 0 'null')
 */
export interface RouteDefinitionDescriptorParams<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> {
  readonly method: TMethod;
  readonly path: string | Function;
  readonly auth: boolean;
  readonly schema: RouteSchema;
  readonly responseSchema: ResponseSchema<TResponse>;
  readonly contract: RouteContractConfig;
  readonly mapper: RouteMapper;
  readonly headers: RequestHeaders;
  readonly cache: unknown;
  readonly retry: unknown;
  readonly body: RequestPayload;
  readonly params: RouteParameters;
  readonly query: RouteQueryParameters;
}

/**
 * Minimal Input for RouteDefinitionDescriptor static factory
 */
export type MinimalRouteDefinitionParams<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> = {
  readonly method: TMethod;
  readonly path: string | Function;
  readonly auth?: boolean;
  readonly schema?: RouteSchema;
  readonly responseSchema?: ResponseSchema<TResponse>;
  readonly contract?: RouteContractConfig;
  readonly mapper?: RouteMapper;
  readonly headers?: RequestHeaders;
  readonly cache?: unknown;
  readonly retry?: unknown;
  readonly body?: RequestPayload;
  readonly params?: RouteParameters;
  readonly query?: RouteQueryParameters;
};

/**
 * RouteDefinitionDescriptor: Immutable Complete Contract Implementation
 * Constructor guarantees 0 '?', 0 'null', 100% direct assignment.
 */
export class RouteDefinitionDescriptor<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> implements RouteDefinitionContract<TResponse, TParams, TBody, TMethod> {
  public readonly method: TMethod;
  public readonly path: string | Function;
  public readonly auth: boolean;
  public readonly schema: RouteSchema;
  public readonly responseSchema: ResponseSchema<TResponse>;
  public readonly contract: RouteContractConfig;
  public readonly mapper: RouteMapper;
  public readonly headers: RequestHeaders;
  public readonly cache: unknown;
  public readonly retry: unknown;
  public readonly body: RequestPayload;
  public readonly params: RouteParameters;
  public readonly query: RouteQueryParameters;

  // Phantom types for inference
  public readonly _typeResponse: PhantomCarrier<TResponse> = { __type: (t: TResponse) => t };
  public readonly _typeParams: PhantomCarrier<TParams> = { __type: (t: TParams) => t };
  public readonly _typeBody: PhantomCarrier<TBody> = { __type: (t: TBody) => t };

  constructor(params: RouteDefinitionDescriptorParams<TResponse, TParams, TBody, TMethod>) {
    this.method = params.method;
    this.path = params.path;
    this.auth = params.auth;
    this.schema = params.schema;
    this.responseSchema = params.responseSchema;
    this.contract = params.contract;
    this.mapper = params.mapper;
    this.headers = params.headers;
    this.cache = params.cache;
    this.retry = params.retry;
    this.body = params.body;
    this.params = params.params;
    this.query = params.query;
    Object.freeze(this);
  }

  public static create<
    TResponse = unknown,
    TParams = unknown,
    TBody = unknown,
    TMethod extends HttpMethod = HttpMethod
  >(
    params: RouteDefinitionDescriptorParams<TResponse, TParams, TBody, TMethod>
  ): RouteDefinitionDescriptor<TResponse, TParams, TBody, TMethod> {
    return new RouteDefinitionDescriptor(params);
  }

  public static fromMinimal<
    TResponse = unknown,
    TParams = unknown,
    TBody = unknown,
    TMethod extends HttpMethod = HttpMethod
  >(
    params: MinimalRouteDefinitionParams<TResponse, TParams, TBody, TMethod>
  ): RouteDefinitionDescriptor<TResponse, TParams, TBody, TMethod> {
    const {
      method,
      path,
      auth = false,
      schema = RouteSchemaModel.empty(),
      responseSchema = ResponseSchemaModel.empty<TResponse>(),
      contract = RouteContractConfigFactory.empty(),
      mapper = RouteMapperModel.identity(),
      headers = RequestHeaders.empty(),
      cache = false,
      retry = false,
      body = RequestPayload.empty(),
      params: routeParams = RouteParameters.empty(),
      query = RouteQueryParameters.empty()
    } = params;

    return new RouteDefinitionDescriptor<TResponse, TParams, TBody, TMethod>({
      method,
      path,
      auth,
      schema,
      responseSchema,
      contract,
      mapper,
      headers,
      cache,
      retry,
      body,
      params: routeParams,
      query
    });
  }
}

/**
 * Domain Model for API Action Entry
 */
export interface ApiActionEntry<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TMethod extends HttpMethod = HttpMethod
> {
  readonly action: string;
  readonly definition: RouteDefinition<TResponse, TParams, TBody, TMethod>;
}

/**
 * Domain Contract for API Group
 */
export interface ApiGroupContract {
  readonly groupName: string;
  readonly actions: readonly ApiActionEntry[];
  getAction(actionName: string): RouteDefinition | undefined;
}

/**
 * Domain Contract for API Manifest
 */
export interface ApiManifestContract {
  readonly groups: readonly ApiGroupContract[];
  getGroup(groupName: string): ApiGroupContract | undefined;
}

/**
 * Structural Type Map for defineApi DX compatibility
 */
export type ApiDefinition = {
  readonly [group: string]: {
    readonly [action: string]: RouteDefinition<unknown, unknown, unknown, HttpMethod>;
  };
};

export {
  RequestHeaders,
  RouteParameters,
  RouteQueryParameters,
  RequestPayload,
  RouteSchemaModel,
  ResponseSchemaModel,
  RouteMapperModel,
  type RouteParameterEntry,
  type RouteQueryEntry,
  type PayloadPropertyEntry
};
