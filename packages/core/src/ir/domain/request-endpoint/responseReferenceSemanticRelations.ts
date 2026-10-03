/** Declarative response-kind -> response-projection semantics. */
import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from '../../../compiler/scanner/lexer/routeAst/semanticRewriteEngine';
import { relationFirstOption, relationOptionFold } from '../../../semantic/kernel/relationalSequence';

export type ResponseReferenceSemanticRelation = 'response_kind' | 'response_projection';

const kinds = ['resource', 'collection', 'paginated', 'custom', 'empty'] as const;
export type ResponseKind = typeof kinds[number];

export const RESPONSE_REFERENCE_RULES: readonly SemanticRelationRewrite<ResponseReferenceSemanticRelation>[] = Object.freeze([
  { id: 'response-reference-resource', priority: 5, when: [{ relation: 'response_kind', arguments: ['resource'] }], then: [{ relation: 'response_projection', arguments: ['resource', 'resource'] }] },
  { id: 'response-reference-collection', priority: 4, when: [{ relation: 'response_kind', arguments: ['collection'] }], then: [{ relation: 'response_projection', arguments: ['collection', 'collection'] }] },
  { id: 'response-reference-paginated', priority: 3, when: [{ relation: 'response_kind', arguments: ['paginated'] }], then: [{ relation: 'response_projection', arguments: ['paginated', 'paginated'] }] },
  { id: 'response-reference-custom', priority: 2, when: [{ relation: 'response_kind', arguments: ['custom'] }], then: [{ relation: 'response_projection', arguments: ['custom', 'custom'] }] },
  { id: 'response-reference-empty', priority: 1, when: [{ relation: 'response_kind', arguments: ['empty'] }], then: [{ relation: 'response_projection', arguments: ['empty', 'empty'] }] },
]);

export function resolveResponseReferenceKind(kind: string): ResponseKind {
  const solved = solveSemanticRelations<ResponseReferenceSemanticRelation>(
    [{ relation: 'response_kind', arguments: [kind] }],
    RESPONSE_REFERENCE_RULES,
  );
  const fact = relationFirstOption(solved, entry => Object.is(entry.relation, 'response_projection'));
  return relationOptionFold(fact, () => { throw Error(`No response-reference semantic rule for '${kind}'`); }, entry => entry.arguments[1] as ResponseKind);
}
