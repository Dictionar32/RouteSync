/**
 * Declarative semantic lowering relations for compiler IR builders.
 *
 * The relation program owns semantic dispatch. Registries are derived views;
 * they do not own semantic truth.
 */
import {
  relationFirstOption,
  relationOptionFold,
  relationProject,
} from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../scanner/lexer/routeAst/semanticRewriteEngine';

export type IRLoweringRelation = 'semantic_kind' | 'lowering_operation';
type Rule = SemanticRelationRewrite<IRLoweringRelation>;

const source = (value: string): SemanticRelation<IRLoweringRelation> => ({
  relation: 'semantic_kind',
  arguments: [value],
});

const mapRule = (id: string, from: string, operation: string): Rule => ({
  id,
  priority: 0,
  when: [{ relation: 'semantic_kind', arguments: [from] }],
  then: [{ relation: 'lowering_operation', arguments: [operation] }],
});

const kindRules = (prefix: string, kinds: readonly string[]): readonly Rule[] =>
  relationProject(kinds, kind => mapRule(`${prefix}-${kind}`, kind, kind));

export const CONTRACT_TYPE_LOWERING_RULES: readonly Rule[] = Object.freeze([
  ...kindRules('contract-type', ['primitive', 'reference', 'optional', 'nullable', 'collection', 'object', 'union', 'literal', 'unknown', 'intersection']),
]);

export const RESPONSE_ANALYSIS_LOWERING_RULES: readonly Rule[] = Object.freeze([
  ...kindRules('response-analysis', ['resource', 'model', 'object', 'primitive', 'binary', 'empty', 'redirect']),
]);

export const RESPONSE_FIELD_NORMALIZATION_RULES: readonly Rule[] = Object.freeze([
  mapRule('response-field-primitive', 'primitive', 'primitive'),
  mapRule('response-field-object', 'object', 'object'),
  mapRule('response-field-array', 'array', 'array'),
  mapRule('response-field-variable', 'variable', 'primitive'),
  mapRule('response-field-property-access', 'property_access', 'primitive'),
]);

export const RESPONSE_RESOLVED_TYPE_RULES: readonly Rule[] = Object.freeze([
  mapRule('response-resolved-reference', 'reference', 'reference'),
  mapRule('response-resolved-type', 'type', 'type'),
  mapRule('response-resolved-unresolved', 'unresolved', 'unresolved'),
]);

export const NULLABLE_WRAPPER_RULES: readonly Rule[] = Object.freeze([
  mapRule('nullable-wrapper-nullable', 'nullable', 'nullable_wrapper'),
  mapRule('nullable-wrapper-other', 'other', 'not_nullable_wrapper'),
]);

export const RESPONSE_FIELD_PRESENCE_RULES: readonly Rule[] = Object.freeze([
  mapRule('response-field-present', 'present', 'present'),
  mapRule('response-field-absent', 'absent', 'absent'),
]);

export function resolveLoweringOperation(
  kind: string,
  rules: readonly Rule[],
): string {
  const solved = solveSemanticRelations([source(kind)], rules);
  return relationOptionFold(
    relationFirstOption(solved, item => relationEqual(item.relation, 'lowering_operation')),
    () => { throw Error(`No declarative lowering operation for ${kind}`); },
    fact => String(fact.arguments[0]),
  );
}
