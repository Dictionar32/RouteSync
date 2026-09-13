/**
 * endpointRefs.ts
 *
 * Path parameter extraction, parameter type inference, and request/response reference builders.
 *
 * @module core/ir/domain/request-endpoint
 */

import type {
  ResourceIR,
  RequestIR,
  ParsedRoute,
  ParameterIR,
  ResponseReference,
  RequestReference
} from '../../../types/ir';
import type { SemanticType } from '../../../types/semantic';

export function inferParamType(name: string): SemanticType {
  if (name.includes('id') || name.includes('Id')) return 'number';
  if (name.includes('slug')) return 'string';
  if (name.includes('uuid') || name.includes('Uuid')) return 'string';
  return 'string';
}

export function extractPathParams(path: string): ParameterIR[] {
  const paramMatches = path.match(/\{([^}]+)\}/g) || [];
  return paramMatches.map(match => {
    const name = match.slice(1, -1);
    return {
      name,
      type: inferParamType(name),
      required: true,
      description: `Path parameter: ${name}`
    };
  });
}

export function buildRequestReference(
  route: ParsedRoute,
  requests: Map<string, RequestIR>
): RequestReference | undefined {
  if (route.method === 'GET') return undefined;

  const requestName = `${route.controller}${route.action}Request`;
  const request = requests.get(requestName);

  if (request) {
    return {
      type: 'request_ir',
      reference: request.name
    };
  }

  return {
    type: 'none'
  };
}

export function buildResponseReference(
  route: ParsedRoute,
  resources: Map<string, ResourceIR>
): ResponseReference {
  const resourceName = `${route.controller.replace('Controller', '')}Resource`;
  const resource = resources.get(resourceName);

  if (resource) {
    const isCollection = route.action === 'index' || route.path.includes('search');
    return {
      type: isCollection ? 'collection' : 'resource',
      resource: resource.name,
      statusCode: 200
    };
  }

  return {
    type: 'custom',
    statusCode: 200
  };
}
