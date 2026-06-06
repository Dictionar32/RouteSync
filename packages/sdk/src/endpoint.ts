import { RouteDefinition, HttpMethod } from '@routesync/core'

export type EndpointDefinition = RouteDefinition

type ExtractResponse<T> = T extends { response: infer R } ? R : T
type ExtractParams<T, TFallback> = T extends { request: { params: infer P } } ? P : TFallback
type ExtractBody<T, TFallback> = T extends { request: { body: infer B } } ? B : TFallback

type ExtractRouteParams<T> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : T extends (...args: any[]) => any
        ? Record<string, string | number>
        : unknown;

type IsAny<T> = 0 extends (1 & T) ? true : false;

export function endpoint<
  TContract = any,
  TResponse = any,
  TParams = any,
  TBody = any,
  TContractResponse = any,
  TPath extends string | Function = string | Function,
  TMethod extends HttpMethod = HttpMethod
>(
  def: {
    method: TMethod
    path: TPath
    auth?: boolean
    schema?: any
    contract?: {
      body?: (payload: unknown) => any
      response?: (payload: unknown) => TContractResponse
    }
    mapper?: {
      response?: (payload: any) => TResponse
      body?: (payload: TBody) => any
      params?: (payload: TParams) => any
    }
    headers?: Record<string, string>
    cache?: unknown
    retry?: unknown
    body?: Record<string, any>
    params?: Record<string, any>
    query?: Record<string, any>
  }
): RouteDefinition<
  IsAny<TContract> extends true
    ? (unknown extends TResponse ? (unknown extends TContractResponse ? any : TContractResponse) : TResponse)
    : ExtractResponse<TContract>,
  IsAny<TContract> extends true
    ? (any extends TParams ? ExtractRouteParams<TPath> : TParams)
    : ExtractParams<TContract, unknown>,
  IsAny<TContract> extends true
    ? TBody
    : ExtractBody<TContract, unknown>,
  TMethod
> {
  return def as any
}