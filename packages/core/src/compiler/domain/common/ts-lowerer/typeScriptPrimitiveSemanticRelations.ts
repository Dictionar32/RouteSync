/**
 * Declarative target-semantic relations for PrimitiveKind -> TypeScript token.
 * The relation catalog owns semantic mapping; callers only consume solved facts.
 */
import { PrimitiveKind } from '../../../../types/domain/semanticType';
import { relationFirstOption, relationOptionFold, relationProject, relationRefine } from '../../../../semantic/foundation/relationalSequence';
import { relationAll, relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import {
  solveSemanticRelations,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from '../../../../semantic/foundation/semanticRewriteEngine';

export type TypeScriptPrimitiveSemanticRelation =
  | 'primitive_kind'
  | 'typescript_primitive_token';

export type TypeScriptPrimitiveToken =
  | 'string'
  | 'number'
  | 'boolean'
  | 'File'
  | 'unknown';

const entries: readonly [string, TypeScriptPrimitiveToken][] = Object.freeze([
  [PrimitiveKind.STRING, 'string'],
  [PrimitiveKind.NUMBER, 'number'],
  [PrimitiveKind.BOOLEAN, 'boolean'],
  [PrimitiveKind.DATETIME, 'string'],
  [PrimitiveKind.FILE, 'File'],
  [PrimitiveKind.INDETERMINATE, 'unknown'],
  [PrimitiveKind.UNSPECIFIED, 'unknown'],
]);

export const TYPESCRIPT_PRIMITIVE_TOKEN_RULES:
  readonly SemanticRelationRewrite<TypeScriptPrimitiveSemanticRelation>[] = Object.freeze(
    relationProject(entries, ([kind, token], index) => Object.freeze({
      id: `typescript-primitive-${kind}`,
      priority: entries.length - index,
      when: [{ relation: 'primitive_kind' as const, arguments: [kind] }],
      then: [{ relation: 'typescript_primitive_token' as const, arguments: [kind, token] }],
    })),
  );

const isTypeScriptPrimitiveToken = (value: SemanticRelation<TypeScriptPrimitiveSemanticRelation>['arguments'][number]): value is TypeScriptPrimitiveToken => relationAny([
  relationEqual(value, 'string'),
  relationEqual(value, 'number'),
  relationEqual(value, 'boolean'),
  relationEqual(value, 'File'),
  relationEqual(value, 'unknown'),
]);

export function resolveTypeScriptPrimitiveToken(
  kind: PrimitiveKind | string,
): TypeScriptPrimitiveToken {
  const solved = solveSemanticRelations<TypeScriptPrimitiveSemanticRelation>(
    [{ relation: 'primitive_kind', arguments: [kind] }],
    TYPESCRIPT_PRIMITIVE_TOKEN_RULES,
  );
  const token = relationFirstOption(
    solved,
    (fact: SemanticRelation<TypeScriptPrimitiveSemanticRelation>) =>
      relationAll([relationEqual(fact.relation, 'typescript_primitive_token'), relationEqual(fact.arguments[0], kind)]),
  );
  return relationOptionFold(token, () => { throw Error(`No TypeScript primitive semantic rule for '${kind}'`); }, fact =>
    relationOptionFold(
      relationRefine(fact.arguments[1], isTypeScriptPrimitiveToken),
      () => { throw Error(`Invalid TypeScript primitive witness for '${kind}'`); },
      value => value,
    ));
}
