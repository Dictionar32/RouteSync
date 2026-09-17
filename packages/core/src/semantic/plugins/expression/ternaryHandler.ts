import type { SemanticResolution, SemanticTraceNode } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../types';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';

export function resolveTernary(
  meta: ResolverMeta,
  context: ResolutionContext,
  currentModel?: ModelNode,
): SemanticResolution {
  if (meta.kind !== 'ternary') return unknown('Invalid ternary metadata');

  const condition = context.kernel.resolve(meta.condition, currentModel);
  const truthy = context.kernel.resolve(meta.truthy, currentModel);
  const falsy = context.kernel.resolve(meta.falsy, currentModel);
  const trace: readonly SemanticTraceNode[] = [
    ...condition.trace,
    ...truthy.trace,
    ...falsy.trace,
  ];
  const branch = resolvedBranch(truthy, falsy);
  if (branch === null) return unknown('Neither ternary branch has a resolved semantic value', trace);

  const boundAst = BoundSemanticFactory.ternary({
    conditionExpression: SemanticValueFactory.conditionExpression('condition'),
    truthy: truthy.boundAst,
    falsy: falsy.boundAst,
    resultingType: semanticResolutionToBoundType(branch),
  });
  return withNullableBranch(branch, truthy, falsy, boundAst, trace);
}

function resolvedBranch(
  truthy: SemanticResolution,
  falsy: SemanticResolution,
): SemanticResolution | null {
  if (truthy.kind !== 'unknown') return truthy;
  if (falsy.kind !== 'unknown') return falsy;
  return null;
}

function withNullableBranch(
  branch: SemanticResolution,
  truthy: SemanticResolution,
  falsy: SemanticResolution,
  boundAst: ReturnType<typeof BoundSemanticFactory.ternary>,
  trace: readonly SemanticTraceNode[],
): SemanticResolution {
  if (branch.kind !== 'scalar') return copyWithBoundAst(branch, boundAst, trace);
  const other = branch === truthy ? falsy : truthy;
  const nullability = other.kind === 'unknown'
    ? { kind: 'nullable' as const }
    : branch.nullability;
  return SemanticResolutionFactory.scalar({
    ...branch,
    nullability,
    boundAst,
    trace,
  });
}

function copyWithBoundAst(
  branch: SemanticResolution,
  boundAst: ReturnType<typeof BoundSemanticFactory.ternary>,
  trace: readonly SemanticTraceNode[],
): SemanticResolution {
  return { ...branch, boundAst, trace };
}

function unknown(rule: string, trace: readonly SemanticTraceNode[] = []): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown',
    confidence: 0,
    trace: [...trace, { source: 'TernaryResolver', rule, input: 'ternary', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  });
}
