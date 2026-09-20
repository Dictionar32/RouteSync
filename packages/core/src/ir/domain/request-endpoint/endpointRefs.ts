/**
 * endpointRefs.ts
 *
 * Path parameter extraction, parameter type inference, and request/response reference builders.
 *
 * @module core/ir/domain/request-endpoint
 */

import type {
  RequestIR,
  ParameterIR,
  ResponseReference,
  RequestReference
} from '../../../types/ir';
import { PrimitiveKind } from '../../../compiler/types/SemanticType';
import { createPropertyName } from '../../../types/ir/nominalVocabulary';
import type { DescriptionText } from '../../../types/upstream/valueObjects';
import type { RequestName } from '../../../types/upstream/names';
import type { ParsedRoute } from '../../../types/domain/routes';

export function inferParamType(name: string): PrimitiveKind {
  if (name.includes('id') || name.includes('Id')) return PrimitiveKind.NUMBER;
  if (name.includes('slug')) return PrimitiveKind.STRING;
  if (name.includes('uuid') || name.includes('Uuid')) return PrimitiveKind.STRING;
  return PrimitiveKind.STRING;
}

export function extractPathParams(path: ParsedRoute['identity']['path']): ParameterIR[] {
  const rawPath = path.value.value;
  const paramMatches = rawPath.match(/\{([^}]+)\}/g) || [];
  return paramMatches.map(match => {
    const name = match.slice(1, -1);
    return {
      name: createPropertyName(name),
      type: inferParamType(name),
      required: true,
      description: { kind: 'description_text', value: `Path parameter: ${name}` } satisfies DescriptionText,
      validation: { kind: 'validation_rules', items: { kind: 'empty' } }
    };
  });
}

export function buildRequestReference(
  route: ParsedRoute,
  requests: Map<string, RequestIR>
): RequestReference {
  if (route.identity.method === 'GET') return { type: 'none' };

  const requestName = `${route.binding.controllerName.value.value}${route.binding.action.value.value}Request`;
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
  switch (route.binding.response.kind) {
    case 'resource':
      return {
        type: 'resource',
        resource: route.binding.response.resource,
        statusCode: route.binding.response.statusCode,
        headers: [],
        pagination: route.binding.response.pagination
      };
    case 'collection':
      return {
        type: 'collection',
        resource: route.binding.response.resource,
        statusCode: route.binding.response.statusCode,
        headers: [],
        pagination: route.binding.response.pagination
      };
    case 'paginated':
      return {
        type: 'paginated',
        resource: route.binding.response.resource,
        statusCode: route.binding.response.statusCode,
        headers: [],
        pagination: route.binding.response.pagination
      };
    case 'custom':
      return {
        type: 'custom',
        responseType: route.binding.response.responseType,
        statusCode: route.binding.response.statusCode,
        headers: [],
        pagination: route.binding.response.pagination
      };
    case 'empty':
      return {
        type: 'empty',
        statusCode: route.binding.response.statusCode,
        headers: [],
        pagination: route.binding.response.pagination
      };
  }
}
