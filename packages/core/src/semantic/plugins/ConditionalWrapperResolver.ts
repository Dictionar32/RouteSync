import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveInScope } from '../kernel/resolveInScope';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { semanticResolutionToBoundType } from '../semanticResolutionToBoundType';
import { matchLookup } from '../../types/upstream/collections';
import { relationAll, relationEqual, relationResolve } from '../kernel/semanticRelations';
import { relationFirst, relationFirstOption, relationOptionFold, relationRefine, relationSome } from '../kernel/relationalSequence';

type ConditionalMeta = Extract<ResolverMeta, { kind: 'method_call' }>;
type ConditionalWrapper = 'whenLoaded' | 'when' | 'mergeWhen';

const conditionalWrappers: readonly ConditionalWrapper[] = ['whenLoaded', 'when', 'mergeWhen'];
const isConditionalMeta = (meta: ResolverMeta): meta is ConditionalMeta => relationEqual(meta.kind, 'method_call');
const isConditionalWrapper = (value: string): value is ConditionalWrapper => relationSome(conditionalWrappers, candidate => relationEqual(candidate, value));
const isStringLiteral = (value: ConditionalMeta['args'][number]['value']): value is Extract<ConditionalMeta['args'][number]['value'], { kind: 'literal'; value: string }> => relationAll([relationEqual(value.kind, 'literal'), relationEqual(typeof value.value, 'string')]);
const isVariableExpression = (value: ConditionalMeta['args'][number]['value']): value is Extract<ConditionalMeta['args'][number]['value'], { kind: 'variable' }> => relationEqual(value.kind, 'variable');

const canResolve = (meta: ResolverMeta): boolean => {
    return relationOptionFold(
      relationRefine(meta, isConditionalMeta),
      () => false,
      value => isConditionalWrapper(value.name.value),
    );
};

const resolve = (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => {
    return relationOptionFold(
      relationRefine(meta, isConditionalMeta),
      () => unsupported('Unsupported conditional metadata'),
      value => relationResolve(
        value.args.length >= 2,
        () => resolveValue(value, context),
        () => relationResolve(
          relationAll([relationEqual(value.name.value, 'whenLoaded'), relationEqual(value.args.length, 1)]),
          () => resolveRelation(value, context),
          () => unsupported(`Conditional wrapper ${value.name.value} has insufficient arguments`),
        ),
      ),
    );
};

export const ConditionalWrapperResolver: ResolverPlugin = Object.freeze({ canResolve, resolve });

function resolveValue(meta: ConditionalMeta, context: ResolutionContext): SemanticResolution {
  const target = resolveInScope(context.kernel, meta.args[1].value, context.scope);
  return relationOptionFold(
    relationRefine(meta.name.value, isConditionalWrapper),
    () => unsupported(`Unsupported conditional wrapper ${meta.name.value}`),
    wrapper => {
      const relationModel = relationResolve(
        relationEqual(target.kind, 'model'),
        () => ({ kind: 'model', name: target.model }),
        () => ({ kind: 'unbound' }),
      );
      return { ...target, boundAst: BoundSemanticFactory.conditional({
        wrapper,
        conditionExpression: SemanticValueFactory.conditionExpression(meta.name.value),
        target: target.boundAst,
        relationModel,
        semanticType: semanticResolutionToBoundType(target),
        availability: { kind: 'present_when_condition', condition: SemanticValueFactory.conditionExpression(meta.name.value) },
      }) };
    },
  );
}

function resolveRelation(meta: ConditionalMeta, context: ResolutionContext): SemanticResolution {
  const relationName = relationArgument(meta);
  return relationResolve(
    relationEqual(context.scope.kind, 'model'),
    () => {
      const model = context.scope.model;
      const relationKey = SemanticValueFactory.relationName(relationName);
      return matchLookup(model.definition.semantic.surface.relationsByName.lookup(relationKey), {
        missing: () => unsupported(`Relation ${relationName} is not declared on ${model.definition.identity.name.value}`),
        found: property => relationOptionFold(
          relationFirst(context.models, candidate => relationEqual(candidate.definition.identity.name.value, property.value.targetModel.value)),
          () => unsupported(`Relation target ${property.value.targetModel.value} is not a verified model`),
          targetModel => {
            const targetModelName = property.value.targetModel;
            const definition = targetModel.definition;
            const relationNode = BoundSemanticFactory.relation({
              sourceModel: model.definition.identity.name,
              relationName: SemanticValueFactory.relationName(relationName),
              relationType: property.value.type,
              targetModel: targetModelName,
              cardinality: property.value.multiplicity,
              nullability: { kind: 'nullable' },
              semanticType: property.value.semanticType,
            });
            return SemanticResolutionFactory.model({
              status: 'resolved', confidence: 100,
              model: targetModelName, definition, cardinality: property.value.multiplicity,
              boundAst: BoundSemanticFactory.conditional({
                wrapper: 'whenLoaded',
                conditionExpression: SemanticValueFactory.conditionExpression(`whenLoaded('${relationName}')`),
                target: relationNode,
                relationModel: { kind: 'model', name: targetModelName },
                availability: { kind: 'present_when_loaded', relation: relationKey },
                semanticType: property.value.semanticType,
              }),
              trace: [{ source: 'ConditionalWrapperResolver', rule: 'Relation shorthand lookup', input: relationName, output: targetModelName.value }],
            });
          }
        )
      });
    },
    () => unsupported('whenLoaded relation has no model context'),
  );
}

function relationArgument(meta: ConditionalMeta): string {
  return relationOptionFold(
    relationFirstOption(meta.args, () => true),
    () => 'relation',
    first => relationOptionFold(
      relationRefine(first.value, isStringLiteral),
      () => relationOptionFold(
        relationRefine(first.value, isVariableExpression),
        () => 'relation',
        variable => variable.name.value,
      ),
      literal => literal.value,
    ),
  );
}

function unsupported(rule: string): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({
    status: 'indeterminate', confidence: 0,
    trace: [{ source: 'ConditionalWrapperResolver', rule, input: 'conditional', output: 'indeterminate' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  });
}
