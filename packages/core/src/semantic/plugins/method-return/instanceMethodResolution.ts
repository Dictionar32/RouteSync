import type { SemanticResolution, QueryProjectionSemanticResolution, ModelSemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolverMeta } from '../../types';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, type PrimitiveType, primitiveType } from '../../../types/domain/semanticType';
import { lookupEloquentMethodRelation, type EloquentReturn } from '../../EloquentRegistry';
import { resolveSelectRawProjection } from './selectRawProjection';
import { cardinalityFromEloquent, toBoundResolutionCardinality, resultType, scalar, indeterminate, resolveFirstQueryProjection } from './instanceMethodSupport';
import { relationFirst, relationOptionFold, relationRefine, relationResolve } from '../../kernel/relationalSequence';
import { relationAny, relationEqual } from '../../kernel/semanticRelations';
import { matchLookup } from '../../../types/upstream/collections';

type Target = ModelSemanticResolution | QueryProjectionSemanticResolution;
const isModel = (target: Target): target is ModelSemanticResolution => relationEqual(target.kind, 'model');
const isQueryProjection = (target: Target): target is QueryProjectionSemanticResolution => relationEqual(target.kind, 'query_projection');
const isModelReturn = (value: EloquentReturn): value is Extract<EloquentReturn, { kind: 'model' }> => relationEqual(value.kind, 'model');
const isArrayReturn = (value: EloquentReturn): value is Extract<EloquentReturn, { kind: 'array' }> => relationEqual(value.kind, 'array');

const returnHandlers = (
  target: ModelSemanticResolution,
  rule: EloquentReturn,
  trace: SemanticResolution['trace'],
  boundAst: SemanticResolution['boundAst'],
  resolutionCardinality: ReturnType<typeof cardinalityFromEloquent>,
  confidence: number,
  sourceName: string,
): SemanticResolution => {
  const model = target.model;
  const handlers = {
    builder: () => SemanticResolutionFactory.model({ status: 'resolved', confidence, trace, boundAst, model, definition: target.definition, cardinality: target.cardinality }),
    model: () => SemanticResolutionFactory.model({ status: 'resolved', confidence, trace, boundAst, model, definition: target.definition, cardinality: resolutionCardinality }),
    number: () => scalar(trace, boundAst, primitiveType(PrimitiveKind.NUMBER), confidence),
    boolean: () => scalar(trace, boundAst, primitiveType(PrimitiveKind.BOOLEAN), confidence),
  };
  return relationOptionFold(relationRefine(rule, isArrayReturn),
    () => relationOptionFold(relationRefine(rule, isModelReturn),
      () => handlers[rule.kind](),
      () => handlers.model()),
    arrayRule => relationResolve(relationEqual(arrayRule.element.kind, 'model'),
      () => SemanticResolutionFactory.model({ status: 'resolved', confidence, trace, boundAst, model, definition: target.definition, cardinality: { kind: 'collection' } }),
      () => indeterminate(sourceName, `Unsupported Eloquent return kind: ${arrayRule.kind}`)));
};

export function resolveVerifiedInstanceMethod(meta: Extract<ResolverMeta, { kind: 'method_call' }>, target: Target, methodName: string, sourceName: string): SemanticResolution {
  const specialFirst = relationResolve(relationEqual(methodName, 'first'),
    () => relationOptionFold(relationRefine(target, isQueryProjection), () => indeterminate(sourceName, 'Invalid query projection target'), value => resolveFirstQueryProjection(value, methodName, sourceName)),
    () => indeterminate(sourceName, 'No special method rule'));
  const specialSelectRaw = relationResolve(relationEqual(methodName, 'selectRaw'),
    () => relationOptionFold(relationRefine(target, isModel), () => indeterminate(sourceName, 'Invalid model target'), value => resolveSelectRawProjection(meta, value.model, value.definition, value.trace, value.confidence)),
    () => indeterminate(sourceName, 'No special method rule'));
  const special = relationFirst([specialFirst, specialSelectRaw], value => relationAny([relationEqual(value.boundAst.kind, 'bound_query_projection'), relationEqual(value.boundAst.kind, 'bound_model_column')]));;
  return relationOptionFold(special,
    () => relationOptionFold(relationRefine(target, isModel),
      () => indeterminate(sourceName, `Eloquent method ${methodName} is not defined for query projection`),
      modelTarget => matchLookup(lookupEloquentMethodRelation(methodName), {
        missing: () => indeterminate(sourceName, `Eloquent method is not registered: ${methodName}`),
        found: ruleLookup => {
          const rule = ruleLookup.value;
          const resolutionCardinality = relationOptionFold(relationRefine(rule.returns, isModelReturn), () => modelTarget.cardinality, value => cardinalityFromEloquent(value.cardinality));
          const boundCardinality = toBoundResolutionCardinality(resolutionCardinality);
          const semanticType = resultType(rule.returns, modelTarget.model.value.value);
          const boundAst = BoundSemanticFactory.methodCall({
            targetModel: { kind: 'model', name: modelTarget.model }, methodName: SemanticValueFactory.methodName(methodName),
            returnType: semanticType, cardinality: boundCardinality, nullability: { kind: 'non_nullable' },
          });
          const trace = [...modelTarget.trace, { source: sourceName, rule: `Eloquent method registry: ${methodName} -> ${rule.returns.kind}`, input: methodName, output: rule.returns.kind }];
          return returnHandlers(modelTarget, rule.returns, trace, boundAst, resolutionCardinality, modelTarget.confidence, sourceName);
        },
      }),
    ),
    value => value,
  );
}
