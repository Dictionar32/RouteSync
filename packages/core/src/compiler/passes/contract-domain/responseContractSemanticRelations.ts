/** Declarative semantic projection for response contract value kinds. */
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../scanner/lexer/routeAst/semanticRewriteEngine';

export type ResponseContractSemanticRelation =
  | 'response_value_kind'
  | 'response_value_type'
  | 'request_response_kind'
  | 'request_response_projection';

const rules: readonly [string, string][] = Object.freeze([
  ['union', 'union'],
  ['null', 'null'],
  ['textual', 'string'],
  ['whole_number', 'number'],
  ['decimal_number', 'number'],
  ['boolean_flag', 'boolean'],
  ['named_type', 'named_type'],
  ['object', 'object'],
  ['model_reference', 'model_reference'],
  ['collection', 'array'],
  ['unresolved_declaration', 'unknown'],
]);

export const RESPONSE_VALUE_TYPE_RULES:
  readonly SemanticRelationRewrite<ResponseContractSemanticRelation>[] = Object.freeze(
    rules.map(([kind, type], index) => Object.freeze({
      id: `response-value-${kind}-type`,
      priority: rules.length - index,
      when: [{ relation: 'response_value_kind' as const, arguments: [kind] }],
      then: [{ relation: 'response_value_type' as const, arguments: [kind, type] }],
    })),
  );

export function resolveResponseValueType(kind: string): string {
  const solved = solveSemanticRelations<ResponseContractSemanticRelation>(
    [{ relation: 'response_value_kind', arguments: [kind] }],
    RESPONSE_VALUE_TYPE_RULES,
  );
  const fact = solved.find(
    (entry: SemanticRelation<ResponseContractSemanticRelation>) =>
      entry.relation === 'response_value_type' && entry.arguments[0] === kind,
  );
  return (fact?.arguments[1] ?? (() => { throw new Error(`No response-value semantic rule for '${kind}'`); })()) as string;
}

export const REQUEST_RESPONSE_PROJECTION_RULES:
  readonly SemanticRelationRewrite<ResponseContractSemanticRelation>[] = Object.freeze([
    Object.freeze({
      id: 'request-response-none',
      priority: 2,
      when: [{ relation: 'request_response_kind' as const, arguments: ['none'] }],
      then: [{ relation: 'request_response_projection' as const, arguments: ['none', 'empty'] }],
    }),
    Object.freeze({
      id: 'request-response-data',
      priority: 1,
      when: [{ relation: 'request_response_kind' as const, arguments: ['data'] }],
      then: [{ relation: 'request_response_projection' as const, arguments: ['data', 'resource'] }],
    }),
  ]);

export function resolveRequestResponseProjection(kind: string): 'empty' | 'resource' {
  const solved = solveSemanticRelations<ResponseContractSemanticRelation>(
    [{ relation: 'request_response_kind', arguments: [kind] }],
    REQUEST_RESPONSE_PROJECTION_RULES,
  );
  const fact = solved.find(
    (entry: SemanticRelation<ResponseContractSemanticRelation>) =>
      entry.relation === 'request_response_projection' && entry.arguments[0] === kind,
  );
  return (fact?.arguments[1] ?? (() => { throw new Error(`No request-response semantic rule for '${kind}'`); })()) as 'empty' | 'resource';
}
