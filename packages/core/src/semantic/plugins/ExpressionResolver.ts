/** Declarative expression resolver projection. */
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { indeterminateResolution } from '../semanticResolutionSupport';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveLiteral, resolveBinaryExpression, resolveTernary, resolvePropertyAccess } from './expression';
import { relationEqual } from '../kernel/semanticRelations';
import { relationFirstOption, relationOptionFold, relationOptionMap, relationRefine, type RelationOption } from '../kernel/relationalSequence';

export { resolveLiteral, resolveBinaryExpression, resolveTernary, resolvePropertyAccess };

type ResolverRule = (meta: ResolverMeta, context: ResolutionContext) => RelationOption<SemanticResolution>;

const literalRule: ResolverRule = (meta, _context) =>
  relationOptionMap(relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'literal' }> => relationEqual(value.kind, 'literal')), resolveLiteral);

const binaryRule: ResolverRule = (meta, context) =>
  relationOptionMap(relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'binary_expression' }> => relationEqual(value.kind, 'binary_expression')), value => resolveBinaryExpression(value, context, context.scope));

const ternaryRule: ResolverRule = (meta, context) =>
  relationOptionMap(relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'ternary' }> => relationEqual(value.kind, 'ternary')), value => resolveTernary(value, context, context.scope));

const propertyRule: ResolverRule = (meta, context) =>
  relationOptionMap(relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'property_access' }> => relationEqual(value.kind, 'property_access')), value => resolvePropertyAccess(value, context));

const nullsafePropertyRule: ResolverRule = (meta, context) =>
  relationOptionMap(relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'nullsafe_property_access' }> => relationEqual(value.kind, 'nullsafe_property_access')), value => resolvePropertyAccess(value, context));

const RESOLVABLE_KINDS = Object.freeze(['literal', 'binary_expression', 'ternary', 'property_access', 'nullsafe_property_access']);

const resolverCatalog: readonly ResolverRule[] = Object.freeze([
  literalRule,
  binaryRule,
  ternaryRule,
  propertyRule,
  nullsafePropertyRule,
]);

const resolveByRelation = (meta: ResolverMeta, context: ResolutionContext): RelationOption<SemanticResolution> => {
  const rule = relationFirstOption(resolverCatalog, candidate => relationEqual(candidate(meta, context).kind, 'some'));
  return relationOptionFold(rule, () => ({ kind: 'none' }), candidate => candidate(meta, context));
};

const canResolve = (meta: ResolverMeta): boolean => relationEqual(relationFirstOption(RESOLVABLE_KINDS, kind => relationEqual(kind, meta.kind)).kind, 'some');

const resolve = (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => {
    return relationOptionFold(
      resolveByRelation(meta, context),
      () => indeterminateResolution('ExpressionResolver', 'Unsupported expression kind', meta.kind, 'unsupported_syntax'),
      value => value,
    );
};

export const ExpressionResolver: ResolverPlugin = Object.freeze({ canResolve, resolve });
