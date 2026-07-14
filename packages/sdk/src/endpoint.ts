import { RouteDefinition, HttpMethod } from '@routesync/core'

export type EndpointDefinition = RouteDefinition

type ExtractResponse<T> = T extends { response: infer R } ? R : T
type ExtractParams<T, TFallback> = T extends { request: { params: infer P } } ? P : TFallback
type ExtractBody<T, TFallback> = T extends { request: { body: infer B } } ? B : TFallback

export type ExtractRouteParams<T> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : T extends (...args: infer _) => unknown
        ? Record<string, unknown> // Fallback for function-based paths (e.g. constant generated helpers)
        : unknown;

type IsAny<T> = 0 extends (1 & T) ? true : false;

type ResolveResponse<TContract, TResponse, TContractResponse> =
  IsAny<TContract> extends true
    ? (unknown extends TResponse ? (unknown extends TContractResponse ? unknown : TContractResponse) : TResponse)
    : ExtractResponse<TContract>

type ResolveParams<TContract, TParams, TPath> =
  IsAny<TContract> extends true
    ? (unknown extends TParams ? ExtractRouteParams<TPath> : TParams)
    : (unknown extends ExtractParams<TContract, unknown> ? (unknown extends TParams ? ExtractRouteParams<TPath> : TParams) : ExtractParams<TContract, unknown>)

type ResolveBody<TContract, TBody> =
  IsAny<TContract> extends true
    ? TBody
    : (unknown extends ExtractBody<TContract, unknown> ? TBody : ExtractBody<TContract, unknown>)

export function endpoint<
  TContract = unknown,
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TContractResponse = unknown,
  TPath extends string | Function = string | Function,
  TMethod extends HttpMethod = HttpMethod,
  TMapperInput = TResponse
>(
  def: {
    method: TMethod
    path: TPath
    auth?: boolean
    schema?: unknown
    contract?: {
      body?: (payload: unknown) => unknown
      response?: (payload: unknown) => TContractResponse
    }
    mapper?: {
      response?: (payload: TMapperInput) => TResponse
      body?: (payload: TBody) => unknown
      params?: (payload: TParams) => unknown
    }
    headers?: Record<string, string>
    cache?: unknown
    retry?: unknown
    body?: Record<string, unknown>
    params?: Record<string, unknown>
    query?: Record<string, unknown>
  }
): RouteDefinition<
  ResolveResponse<TContract, TResponse, TContractResponse>,
  ResolveParams<TContract, TParams, TPath>,
  ResolveBody<TContract, TBody>,
  TMethod
> {
  return def as unknown as RouteDefinition<
    ResolveResponse<TContract, TResponse, TContractResponse>,
    ResolveParams<TContract, TParams, TPath>,
    ResolveBody<TContract, TBody>,
    TMethod
  >
}