import type { SemanticResolution, QueryProjectionSemanticResolution, ModelSemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolverMeta } from '../../types';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';
import { lookupEloquentMethod } from '../../EloquentRegistry';
import { resolveSelectRawProjection } from './selectRawProjection';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';
import { cardinalityFromEloquent, toBoundResolutionCardinality, resultType, scalar, unknown, resolveFirstQueryProjection } from './instanceMethodSupport';

export function resolveVerifiedInstanceMethod(
  meta: Extract<ResolverMeta, { kind: 'method_call' }>,
  target: ModelSemanticResolution | QueryProjectionSemanticResolution,
  methodName: string,
  sourceName: string,
): SemanticResolution {
  if (methodName === 'first' && target.kind === 'query_projection') {
    return resolveFirstQueryProjection(target, methodName, sourceName);
  }

  if (methodName === 'selectRaw' && target.kind === 'model') {
    return resolveSelectRawProjection(meta, target.model, target.definition, target.trace, target.confidence);
  }
  if (target.kind !== 'model') return unknown(sourceName, `Eloquent method ${methodName} is not defined for query projection`);

  const rule = lookupEloquentMethod(methodName);
  if (!rule) return unknown(sourceName, `Eloquent method is not registered: ${methodName}`);

  const model = target.model;
  const resolutionCardinality = rule.returns.kind === 'model'
    ? cardinalityFromEloquent(rule.returns.cardinality)
    : target.cardinality;
  const boundCardinality = toBoundResolutionCardinality(resolutionCardinality);
  const semanticType = resultType(rule.returns, model.value.value);
  const boundAst = BoundSemanticFactory.methodCall({
    targetModel: { kind: 'model', name: model },
    methodName: SemanticValueFactory.methodName(methodName),
    returnType: semanticType,
    cardinality: boundCardinality,
    nullability: { kind: 'non_nullable' },
  });

  const trace = [
    ...target.trace,
    {
      source: sourceName,
      rule: `Eloquent method registry: ${methodName} -> ${rule.returns.kind}`,
      input: methodName,
      output: rule.returns.kind,
    },
  ];

  if (rule.returns.kind === 'builder') {
    return SemanticResolutionFactory.model({
      status: 'resolved',
      confidence: target.confidence,
      trace,
      boundAst,
      model,
      definition: target.definition,
      cardinality: target.cardinality,
    });
  }

  if (rule.returns.kind === 'model') {
    return SemanticResolutionFactory.model({
      status: 'resolved',
      confidence: target.confidence,
      trace,
      boundAst,
      model,
      definition: target.definition,
      cardinality: resolutionCardinality,
    });
  }

  if (rule.returns.kind === 'number') {
    return scalar(trace, boundAst, new PrimitiveType(PrimitiveKind.NUMBER), target.confidence);
  }
  if (rule.returns.kind === 'boolean') {
    return scalar(trace, boundAst, new PrimitiveType(PrimitiveKind.BOOLEAN), target.confidence);
  }
  if (rule.returns.kind === 'array' && rule.returns.element.kind === 'model') {
    return SemanticResolutionFactory.model({
      status: 'resolved',
      confidence: target.confidence,
      trace,
      boundAst,
      model,
      definition: target.definition,
      cardinality: { kind: 'collection' },
    });
  }
  return unknown(sourceName, `Unsupported Eloquent return kind: ${rule.returns.kind}`);

}
