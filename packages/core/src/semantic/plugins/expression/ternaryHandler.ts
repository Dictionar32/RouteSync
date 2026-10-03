import type { SemanticResolution, ScalarSemanticResolution, SemanticTraceNode } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../types';
import type { ResolutionScope } from '../../resolutionScope';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';
import { resolveInScope } from '../../kernel/resolveInScope';
import { relationOptionFold, relationRefine } from '../../kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../kernel/semanticRelations';
import { relationIsSome } from '../../kernel/semanticRelations';
import { solveCandidate, requirement, type SemanticCandidate } from '../../kernel/semanticDecisionRewriteEngine';

const isTernaryMeta = (meta: ResolverMeta): meta is Extract<ResolverMeta, { kind: 'ternary' }> =>
  relationEqual(meta.kind, 'ternary');


const nullableResolutionKind = (): { readonly kind: 'nullable' } => ({ kind: 'nullable' });

const isScalarResolution = (resolution: SemanticResolution): resolution is ScalarSemanticResolution =>
  relationEqual(resolution.kind, 'scalar');

export function resolveTernary(meta: ResolverMeta, context: ResolutionContext, scope: ResolutionScope): SemanticResolution {
  const candidate = relationRefine(meta, isTernaryMeta);
  const resolved = relationOptionFold(candidate, () => indeterminate('Invalid ternary metadata'), value => resolveTernaryEvidence(value, context, scope));
  return resolved;
}

function resolveTernaryEvidence(
  meta: Extract<ResolverMeta, { kind: 'ternary' }>,
  context: ResolutionContext,
  scope: ResolutionScope,
): SemanticResolution {
  const condition = resolveInScope(context.kernel, meta.condition, scope);
  const truthy = resolveInScope(context.kernel, meta.truthy, scope);
  const falsy = resolveInScope(context.kernel, meta.falsy, scope);
  const trace: readonly SemanticTraceNode[] = [...condition.trace, ...truthy.trace, ...falsy.trace];
  const branch = resolvedBranch(truthy, falsy);
  return relationOptionFold(
    branch,
    () => indeterminate('Neither ternary branch has a resolved semantic value', trace),
    resolved => {
      const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: SemanticValueFactory.conditionExpression('condition'),
        branches: { kind: 'then_else', whenTrue: truthy.boundAst, whenFalse: falsy.boundAst },
        resultingType: semanticResolutionToBoundType(resolved),
      });
      return withNullableBranch(resolved, truthy, falsy, boundAst, trace);
    },
  );
}

function resolvedBranch(
  truthy: SemanticResolution,
  falsy: SemanticResolution,
) {
  const candidates: readonly SemanticCandidate<SemanticResolution>[] = [
    { id: 'truthy', value: truthy, requirements: [requirement('resolved', relationNotEqual(truthy.kind, 'indeterminate'))] },
    { id: 'falsy', value: falsy, requirements: [requirement('resolved', relationNotEqual(falsy.kind, 'indeterminate'))] },
  ];
  return solveCandidate(candidates);
}

function withNullableBranch(
  branch: SemanticResolution,
  truthy: SemanticResolution,
  falsy: SemanticResolution,
  boundAst: ReturnType<typeof BoundSemanticFactory.ternary>,
  trace: readonly SemanticTraceNode[],
): SemanticResolution {
  const scalarCandidate = relationRefine(branch, isScalarResolution);
  return relationOptionFold(
    scalarCandidate,
    () => copyWithBoundAst(branch, boundAst, trace),
    scalar => {
      const other = solveCandidate([
        { id: 'falsy', value: falsy, requirements: [requirement('branch-is-truthy', relationEqual(branch, truthy))] },
        { id: 'truthy', value: truthy, requirements: [requirement('branch-is-falsy', relationNotEqual(branch, truthy))] },
      ]);
      const otherValue = relationOptionFold(other, () => indeterminate('Missing ternary counterpart', trace), value => value);
      const nullability = solveCandidate([
        { id: 'nullable', value: nullableResolutionKind(), requirements: [requirement('other-indeterminate', relationEqual(otherValue.kind, 'indeterminate'))] },
        { id: 'existing', value: scalar.nullability, requirements: [requirement('other-resolved', relationNotEqual(otherValue.kind, 'indeterminate'))] },
      ]);
      const nullabilityValue = relationOptionFold(nullability, () => scalar.nullability, value => value);
      return SemanticResolutionFactory.scalar({
        ...scalar,
        nullability: nullabilityValue,
        boundAst,
        trace,
      });
    },
  );
}

function copyWithBoundAst(branch: SemanticResolution, boundAst: ReturnType<typeof BoundSemanticFactory.ternary>, trace: readonly SemanticTraceNode[]): SemanticResolution {
  return { ...branch, boundAst, trace };
}

function indeterminate(rule: string, trace: readonly SemanticTraceNode[] = []): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({
    status: 'indeterminate',
    confidence: 0,
    trace: [...trace, { source: 'TernaryResolver', rule, input: 'ternary', output: 'indeterminate' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  });
}
