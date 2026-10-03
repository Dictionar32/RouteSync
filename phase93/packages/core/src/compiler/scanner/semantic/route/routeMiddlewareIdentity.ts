import type { RouteMiddlewareReference } from '../../../../types/upstream/routeMiddleware';

export const middlewareReferenceKey = (reference: RouteMiddlewareReference): string =>
  [reference.name.value.value, ...reference.parameters.map(parameter => parameter.value)].join(':');
