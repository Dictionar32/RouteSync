import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveInScope } from '../kernel/resolveInScope';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { semanticResolutionToBoundType } from '../semanticResolutionToBoundType';

export class ConditionalWrapperResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return meta.kind === 'method_call' && ['whenLoaded', 'when', 'mergeWhen'].includes(meta.name.value);
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'method_call') return unsupported(meta.kind);
    if (meta.args.length >= 2) return resolveValue(meta, context);
    if (meta.name.value === 'whenLoaded' && meta.args.length === 1) return resolveRelation(meta, context);
    return unsupported(`Conditional wrapper ${meta.name.value} has insufficient arguments`);
  }
}

function resolveValue(meta: Extract<ResolverMeta, { kind: 'method_call' }>, context: ResolutionContext): SemanticResolution {
  const target = resolveInScope(context.kernel, meta.args[1].value, context.scope);
  const boundAst = BoundSemanticFactory.conditional({
    wrapper: meta.name.value as 'whenLoaded' | 'when' | 'mergeWhen',
    conditionExpression: SemanticValueFactory.conditionExpression(meta.name.value),
    target: target.boundAst,
    relationModel: target.kind === 'model'
      ? { kind: 'model', name: target.model }
      : { kind: 'unbound' },
    semanticType: semanticResolutionToBoundType(target),
    isOptional: true,
  });
  return { ...target, boundAst };
}

function resolveRelation(
  meta: Extract<ResolverMeta, { kind: 'method_call' }>,
  context: ResolutionContext,
): SemanticResolution {
  const relationName = relationArgument(meta);
  if (context.scope.kind !== 'model') return unsupported('whenLoaded relation has no model context');
  const model = context.scope.model;
  const relationKey = SemanticValueFactory.propertyName(relationName);
  const property = model.semantic.surface.byName.get(relationKey);
  if (property === undefined || property.kind !== 'relation') {
    return unsupported(`Relation ${relationName} is not declared on ${model.name.value}`);
  }

  const targetModel = property.targetModel;
  const targetSymbol = context.symbolTable.get(targetModel.value);
  if (targetSymbol === undefined) return unsupported(`Relation target ${targetModel.value} is not a verified model`);
  const cardinality = property.multiplicity;
  const definition = targetSymbol.node.semantic;
  const relationNode = BoundSemanticFactory.relation({
    sourceModel: model.name,
    relationName: SemanticValueFactory.relationName(relationName),
    relationType: property.type,
    targetModel,
    cardinality,
    nullability: { kind: 'nullable' },
  });
  return SemanticResolutionFactory.model({
    status: 'resolved', confidence: 100,
    model: targetModel, definition, cardinality,
    boundAst: BoundSemanticFactory.conditional({
      wrapper: 'whenLoaded',
      conditionExpression: SemanticValueFactory.conditionExpression(`whenLoaded('${relationName}')`),
      target: relationNode,
      relationModel: { kind: 'model', name: targetModel },
      semanticType: semanticResolutionToBoundType(SemanticResolutionFactory.model({
        status: 'resolved', confidence: 100, model: targetModel, definition, cardinality,
        boundAst: relationNode, trace: [],
      })),
      isOptional: true,
    }),
    trace: [{ source: 'ConditionalWrapperResolver', rule: 'Relation shorthand lookup', input: relationName, output: targetModel.value }],
  });
}

function relationArgument(meta: Extract<ResolverMeta, { kind: 'method_call' }>): string {
  const first = meta.args[0].value;
  if (first.kind === 'literal' && typeof first.value === 'string') return first.value;
  if (first.kind === 'variable') return first.name.value;
  return 'relation';
}

function unsupported(rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source: 'ConditionalWrapperResolver', rule, input: 'conditional', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  });
}
