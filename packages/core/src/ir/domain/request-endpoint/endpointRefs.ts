/**
 * endpointRefs.ts
 *
 * Path parameter extraction, parameter type inference, and request/response reference builders.
 *
 * @module core/ir/domain/request-endpoint
 */

import type {
  RequestIR,
  ParsedRoute,
  ParameterIR,
  ResponseReference,
  RequestReference
} from '../../../types/ir';
import { PrimitiveKind } from '../../../compiler/types/SemanticType';
import { createPropertyName, createTypeExpression } from '../../../types/ir/nominalVocabulary';

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
      name: createPropertyName(name),
      type: inferParamType(name),
      required: true,
      description: createTypeExpression(`Path parameter: ${name}`)
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

export function buildResponseReference(route: ParsedRoute): ResponseReference {
  switch (route.response.kind) {
    case 'resource':
      return {
        type: 'resource',
        resource: route.response.resource,
        statusCode: route.response.statusCode,
        headers: [],
        pagination: route.response.pagination
      };
    case 'collection':
      return {
        type: 'collection',
        resource: route.response.resource,
        statusCode: route.response.statusCode,
        headers: [],
        pagination: route.response.pagination
      };
    case 'paginated':
      return {
        type: 'paginated',
        resource: route.response.resource,
        statusCode: route.response.statusCode,
        headers: [],
        pagination: route.response.pagination
      };
    case 'custom':
      return {
        type: 'custom',
        responseType: route.response.responseType,
        statusCode: route.response.statusCode,
        headers: [],
        pagination: route.response.pagination
      };
    case 'empty':
      return {
        type: 'empty',
        statusCode: route.response.statusCode,
        headers: [],
        pagination: route.response.pagination
      };
  }
}
