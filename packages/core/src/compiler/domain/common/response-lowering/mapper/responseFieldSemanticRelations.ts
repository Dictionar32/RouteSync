/** Declarative resolved-type -> response-field conversion semantics. */
import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from '../../../../scanner/lexer/routeAst/semanticRewriteEngine';
import { relationAll } from '../../../../../semantic/kernel/semanticRelations';
import { relationFirst, relationOptionFold, relationProject } from '../../../../../semantic/kernel/relationalSequence';
import type { ResolvedSemanticTypeKind } from '../../ResolvedSemanticType';

export type ResponseFieldSemanticRelation = 'resolved_type_kind' | 'response_field_operation';
export type ResponseFieldOperation = 'primitive' | 'reference' | 'nullable' | 'optional' | 'collection' | 'object' | 'unknown' | 'unsupported';

const kinds: readonly ResolvedSemanticTypeKind[] = Object.freeze([
  'primitive', 'reference', 'optional', 'nullable', 'collection', 'object', 'union', 'intersection', 'unknown',
]);

const operations: Readonly<Record<ResolvedSemanticTypeKind, ResponseFieldOperation>> = Object.freeze({
  primitive: 'primitive', reference: 'reference', optional: 'optional', nullable: 'nullable', collection: 'collection', object: 'object',
  union: 'unsupported', intersection: 'unsupported', unknown: 'unknown',
});

export const RESPONSE_FIELD_RULES: readonly SemanticRelationRewrite<ResponseFieldSemanticRelation>[] = Object.freeze(
  relationProject(kinds, (kind, index) => Object.freeze({
    id: `response-field-${kind}`,
    priority: kinds.length - index,
    when: [{ relation: 'resolved_type_kind' as const, arguments: [kind] }],
    then: [{ relation: 'response_field_operation' as const, arguments: [kind, operations[kind]] }],
  })),
);

export function resolveResponseFieldOperation(kind: ResolvedSemanticTypeKind): ResponseFieldOperation {
  const solved = solveSemanticRelations<ResponseFieldSemanticRelation>(
    [{ relation: 'resolved_type_kind', arguments: [kind] }],
    RESPONSE_FIELD_RULES,
  );
  const fact = relationFirst(solved, entry => relationAll([Object.is(entry.relation, 'response_field_operation'), Object.is(entry.arguments[0], kind)]));
  return relationOptionFold(fact, () => { throw Error(`No response-field semantic rule for '${kind}'`); }, entry => entry.arguments[1] as ResponseFieldOperation);
}
