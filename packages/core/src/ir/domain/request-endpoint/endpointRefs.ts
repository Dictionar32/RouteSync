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
import type { PrimitiveKind } from '../../../compiler/types/SemanticType';

export function inferParamType(name: string): PrimitiveKind {
  if (name.includes('id') || name.includes('Id')) return PrimitiveKind.NUMBER;
  if (name.includes('slug')) return PrimitiveKind.STRING;
  if (name.includes('uuid') || name.includes('Uuid')) return PrimitiveKind.STRING;
  return PrimitiveKind.STRING;
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
): RequestReference {
  if (route.method === 'GET') return { type: 'none' };

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
      statusCode: 200,
      headers: [],
      pagination: null
    };
  }

  return {
    type: 'custom',
    statusCode: 200,
    headers: [],
    pagination: null
  };
}
