/**
 * defineApi.ts
 *
 * Active Consumer Orchestrator for SDK defineApi.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`), explicit named exports only.
 *
 * @module sdk/defineApi
 */

import { PathResolver, type ApiDefinition, type ServiceConfig } from '@routesync/core';
import {
  type CallOptions,
  type EndpointCallableOptions,
  type LooseEndpointOptions,
  type OptionalIfEmpty,
  type ApiError,
  type EndpointCallable,
  type ApiGroupProxy,
  type ApiProxy,
  getClient,
  createClient,
  splitFlatOptions,
  parseRouteSchema,
  applyMapper
} from './api-runtime';

export {
  type CallOptions,
  type EndpointCallableOptions,
  type LooseEndpointOptions,
  type OptionalIfEmpty,
  type ApiError,
  type EndpointCallable,
  getClient,
  createClient
};

export function defineApi<T extends ApiDefinition>(
  definition: T,
  config?: ServiceConfig
): ApiProxy<T> {
  if (config) {
    createClient(config);
  }

  const proxy = {} as ApiProxy<T>;

  for (const group in definition) {
    const groupDef = definition[group];
    const groupProxy = {} as ApiGroupProxy<typeof groupDef>;

    for (const action in groupDef) {
      const route = groupDef[action];

      const callable = async (options?: unknown) => {
        const client = getClient();

        const resolvedOptions = splitFlatOptions(route, options) as CallOptions | undefined;

        const params = applyMapper(
          route, 'params',
          parseRouteSchema(route, 'params', resolvedOptions?.params)
        ) as Record<string, unknown> | undefined;

        const query = applyMapper(
          route, 'query',
          parseRouteSchema(route, 'query', resolvedOptions?.query)
        ) as Record<string, unknown> | undefined;

        let body = applyMapper(
          route, 'body',
          parseRouteSchema(route, 'body', resolvedOptions?.body)
        );
        if (route.contract?.body && body !== undefined) {
          body = route.contract.body(body);
        }

        const resolvedPath = PathResolver.resolve(route.path, params);

        const method = route.method.toLowerCase() as
          | 'get' | 'post' | 'put' | 'patch' | 'delete';

        const requestConfig = { params: query, headers: { ...route.headers, ...resolvedOptions?.headers } };

        let response: unknown;

        if (method === 'get' || method === 'delete') {
          response = await client[method](resolvedPath, requestConfig);
        } else {
          response = await client[method](resolvedPath, body, requestConfig);
        }

        const responseSchema = route.contract?.response ?? route.responseSchema;
        if (client.config.validateResponse && responseSchema) {
          try {
            if (typeof responseSchema === 'function') {
              response = (responseSchema as (val: unknown) => unknown)(response);
            } else {
              response = responseSchema.parse(response);
            }
          } catch (error) {
            if (client.config.onValidationError) {
              client.config.onValidationError(error, {
                endpoint: action,
                method: route.method,
                path: resolvedPath,
                request: { params, query, body, headers: requestConfig.headers },
                response
              });
            }
            throw error;
          }
        } else if (client.config.validateResponse) {
          response = parseRouteSchema(route, 'response', response);
        }

        return applyMapper(
          route, 'response',
          response
        );
      };

      // Attach metadata to the callable
      const callableObj = callable as unknown as Record<string, unknown>;
      callableObj.$def = route;
      callableObj.$key = [group, action];
      callableObj.$queryKey = (options?: EndpointCallableOptions<unknown, unknown>) => {
        return options ? [group, action, options] : [group, action];
      };

      const groupProxyObj = groupProxy as unknown as Record<string, unknown>;
      groupProxyObj[action] = callable;
    }

    const proxyObj = proxy as unknown as Record<string, unknown>;
    proxyObj[group] = groupProxy;
  }

  return proxy;
}
