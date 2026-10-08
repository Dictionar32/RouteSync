import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { PrimitiveKind, type PrimitiveType, primitiveType } from '../../types/domain/semanticType';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveInScope } from '../kernel/resolveInScope';
import { indeterminateResolution } from '../semanticResolutionSupport';
import { relationEqual } from '../kernel/semanticRelations';
import { relationOptionFold, relationRefine, relationResolve, type RelationOption } from '../kernel/relationalSequence';

const CAST_RULES: readonly [string, PrimitiveKind][] = [
  ['int', PrimitiveKind.NUMBER], ['float', PrimitiveKind.NUMBER],
  ['string', PrimitiveKind.STRING], ['bool', PrimitiveKind.BOOLEAN],
];

type CastMeta = Extract<ResolverMeta, { kind: 'type_cast' }>;

const resolveCast = (meta: CastMeta, context: ResolutionContext): SemanticResolution => {
  const casted = relationOptionFold(
    relationRefine(CAST_RULES, ([name]) => relationEqual(name, meta.castType.kind)),
    () => primitiveType(PrimitiveKind.INDETERMINATE),
    ([, kind]) => primitiveType(kind),
  );
  const expression = resolveInScope(context.kernel, meta.expression, context.scope);
  return SemanticResolutionFactory.scalar({
    status: relationResolve(relationEqual(casted.type, PrimitiveKind.INDETERMINATE), () => 'indeterminate', () => 'resolved'),
    confidence: 100,
    trace: [{ source: 'PrimitiveResolver', rule: `Type cast relation: ${meta.castType.kind}`, input: meta.castType.kind, output: casted.kind }, ...expression.trace],
    nullability: { kind: 'non_nullable' },
    semanticType: casted,
    boundAst: expression.boundAst,
  });
};

const resolveByRelation = (meta: ResolverMeta, context: ResolutionContext): RelationOption<SemanticResolution> =>
  relationOptionFold(
    relationRefine(meta, (value): value is CastMeta => relationEqual(value.kind, 'type_cast')),
    () => ({ kind: 'none' }),
    value => ({ kind: 'some', value: resolveCast(value, context) }),
  );

export const PrimitiveResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationEqual(meta.kind, 'type_cast'),
  resolve: (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => relationOptionFold(
    resolveByRelation(meta, context),
    () => indeterminateResolution('PrimitiveResolver', 'Unsupported primitive metadata', meta.kind, 'invalid_boundary_input'),
    value => value,
  ),
});
