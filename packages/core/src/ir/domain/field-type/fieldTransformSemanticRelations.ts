/** Declarative field-name transformation semantics. */
import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from '../../../compiler/scanner/lexer/routeAst/semanticRewriteEngine';
import { relationFirstOption, relationOptionFold } from '../../../semantic/kernel/relationalSequence';

export type FieldTransformSemanticRelation = 'field_case' | 'field_transform';
export type FieldCaseTransform = 'camel' | 'pascal' | 'snake' | 'kebab';

export const FIELD_TRANSFORM_RULES: readonly SemanticRelationRewrite<FieldTransformSemanticRelation>[] = Object.freeze([
  { id: 'field-case-camel', priority: 4, when: [{ relation: 'field_case', arguments: ['camel'] }], then: [{ relation: 'field_transform', arguments: ['camel', 'camel'] }] },
  { id: 'field-case-pascal', priority: 3, when: [{ relation: 'field_case', arguments: ['pascal'] }], then: [{ relation: 'field_transform', arguments: ['pascal', 'pascal'] }] },
  { id: 'field-case-snake', priority: 2, when: [{ relation: 'field_case', arguments: ['snake'] }], then: [{ relation: 'field_transform', arguments: ['snake', 'snake'] }] },
  { id: 'field-case-kebab', priority: 1, when: [{ relation: 'field_case', arguments: ['kebab'] }], then: [{ relation: 'field_transform', arguments: ['kebab', 'kebab'] }] },
]);

export function resolveFieldTransform(caseTransform: string): FieldCaseTransform {
  const requested = relationOptionFold(
    relationFirstOption(['camel', 'pascal', 'snake', 'kebab'] as const, value => Object.is(value, caseTransform)),
    () => 'camel' as const,
    value => value
  );
  const solved = solveSemanticRelations<FieldTransformSemanticRelation>(
    [{ relation: 'field_case', arguments: [requested] }],
    FIELD_TRANSFORM_RULES,
  );
  const fact = relationFirstOption(solved, entry => Object.is(entry.relation, 'field_transform'));
  return relationOptionFold(fact, () => { throw Error(`No field transformation semantic rule for '${requested}'`); }, entry => entry.arguments[1] as FieldCaseTransform);
}
