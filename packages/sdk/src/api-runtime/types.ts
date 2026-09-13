/**
 * types.ts
 *
 * Types for SDK defineApi runtime, endpoint callables, and options.
 *
 * @module sdk/api-runtime/types
 */

import type { HttpMethod, RouteDefinition, ApiDefinition } from '@routesync/core';

export type CallOptions<TParams = unknown, TBody = unknown> = {
  params?: TParams;
  query?: Record<string, unknown>;
  body?: TBody;
  headers?: Record<string, string>;
};

export type EndpointCallableOptions<TParams, TBody> = 
  (
    (
      (unknown extends TParams ? { params?: never } : { params: TParams }) & 
      (unknown extends TBody ? { body?: TBody } : { body: TBody })
    ) | (
      (unknown extends TParams ? {} : TParams) &
      (unknown extends TBody ? {} : TBody)
    )
  ) & { query?: Record<string, unknown>; headers?: Record<string, string> };

export type LooseEndpointOptions = {
  params?: unknown;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalIfEmpty<T> = RequiredKeys<Omit<T, 'query' | 'headers'>> extends never
  ? [options?: T]
  : [options: T];

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface EndpointCallable<TResponse = unknown, TParams = unknown, TBody = unknown, TMethod extends HttpMethod = HttpMethod> {
  (...args: OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>): Promise<TResponse>;
  (options: LooseEndpointOptions | undefined): Promise<TResponse>;
  (options: CallOptions<TParams, TBody>): Promise<TResponse>;
  /** Original RouteDefinition — used by useApiQuery / useApiMutation */
  $def: RouteDefinition<TResponse, TParams, TBody, TMethod>;
  /** Stable TanStack query key: [group, action] */
  $key: string[];
  /** Consistent query key builder that incorporates params/query if provided */
  $queryKey: (options?: EndpointCallableOptions<TParams, TBody>) => unknown[];
}

export type ApiGroupProxy<G extends Record<string, RouteDefinition<unknown, unknown, unknown, HttpMethod>>> = {
  [K in keyof G]: EndpointCallable<
    G[K] extends RouteDefinition<infer R, unknown, unknown, HttpMethod> ? R : unknown,
    G[K] extends RouteDefinition<unknown, infer P, unknown, HttpMethod> ? P : unknown,
    G[K] extends RouteDefinition<unknown, unknown, infer B, HttpMethod> ? B : unknown,
    G[K] extends RouteDefinition<unknown, unknown, unknown, infer M> ? (M extends HttpMethod ? M : HttpMethod) : HttpMethod
  >;
};

export type ApiProxy<T extends ApiDefinition> = {
  [G in keyof T]: ApiGroupProxy<T[G]>;
};

export type RouteSchemaPart = 'params' | 'query' | 'body' | 'response';
