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
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import { PARAMETER_TYPE_KNOWLEDGE } from '../../../types/semantic/semanticKnowledge';
import { HTTP_METHOD_REGISTRY } from '../../../types/domain/httpVocabulary';
import { solveSemanticRelations, type SemanticRelation } from '../../../compiler/scanner/lexer/routeAst/semanticRewriteEngine';
import { resolveResponseReferenceKind, type ResponseKind } from './responseReferenceSemanticRelations';

export const PARAMETER_TYPE_RULES = PARAMETER_TYPE_KNOWLEDGE;

export function inferParamType(name: string): PrimitiveKind {
  return PARAMETER_TYPE_RULES.find(rule =>
    rule.fragments.some(fragment => name.includes(fragment))
  )?.primitive ?? PrimitiveKind.STRING;
}

export function extractPathParams(path: RouteSemanticFlow['identity']['path']): ParameterIR[] {
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

export const REQUEST_BODY_METHODS = Object.values(HTTP_METHOD_REGISTRY)
  .filter(specification => specification.hasBody)
  .map(specification => specification.method);

const HTTP_BODY_RULES = Object.freeze(Object.values(HTTP_METHOD_REGISTRY).map((specification, index) => Object.freeze({
  id: `http-method-body-${specification.method}`,
  priority: Object.keys(HTTP_METHOD_REGISTRY).length - index,
  when: [{ relation: 'http_method' as const, arguments: [specification.method] }],
  then: [{ relation: 'http_body_semantic' as const, arguments: [specification.method, specification.hasBody] }],
})));

function hasRequestBody(method: string): boolean {
  const solved = solveSemanticRelations<'http_method' | 'http_body_semantic'>(
    [{ relation: 'http_method', arguments: [method] }],
    HTTP_BODY_RULES,
  );
  return solved.some((entry: SemanticRelation<'http_method' | 'http_body_semantic'>) =>
    entry.relation === 'http_body_semantic' && entry.arguments[0] === method && entry.arguments[1] === true);
}

export function buildRequestReference(
  route: RouteSemanticFlow,
  requests: Map<string, RequestIR>
): RequestReference {
  const method = route.identity.method;
  if (!hasRequestBody(method)) return { type: 'none' };

  const requestName = `${route.binding.operation.controllerName.value.value}${route.binding.operation.name.value.value}Request`;
  const request = requests.get(requestName);

  return request === undefined
    ? { type: 'none' }
    : { type: 'request_ir', reference: request.name };
}

export function buildResponseReference(route: RouteSemanticFlow): ResponseReference {
  const kind = resolveResponseReferenceKind(route.binding.response.kind);
  const response = route.binding.response;
  const builders: Readonly<Record<ResponseKind, () => ResponseReference>> = {
    resource: () => ({ type: 'resource', resource: response.resource, statusCode: response.statusCode, headers: [], pagination: response.pagination }),
    collection: () => ({ type: 'collection', resource: response.resource, statusCode: response.statusCode, headers: [], pagination: response.pagination }),
    paginated: () => ({ type: 'paginated', resource: response.resource, statusCode: response.statusCode, headers: [], pagination: response.pagination }),
    custom: () => ({ type: 'custom', responseType: response.responseType, statusCode: response.statusCode, headers: [], pagination: response.pagination }),
    empty: () => ({ type: 'empty', statusCode: response.statusCode, headers: [], pagination: response.pagination }),
  };
  return builders[kind]();
}

