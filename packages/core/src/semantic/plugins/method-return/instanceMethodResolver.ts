/** Resolves instance Eloquent methods from an already verified target. */
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../types';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType, ReferenceType } from '../../../compiler/types/SemanticType';
import { lookupEloquentMethod } from '../../EloquentRegistry';
import { resolveSelectRawProjection } from './selectRawProjection';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';

export function resolveInstanceMethodCall(meta: ResolverMeta, context: ResolutionContext, sourceName = 'EloquentMethodResolver'): SemanticResolution {
  if (meta.kind !== 'method_call') return unknown(sourceName, 'Invalid method metadata');

  const methodName = meta.name.value;
  const target = context.kernel.resolve(meta.target, context.contextModel);
  if (target.kind !== 'model' && target.kind !== 'query_projection') {
    return unknown(sourceName, 'Method target is not a verified model or query projection');
  }

  if (methodName === 'first' && target.kind === 'query_projection') {
    const semanticType = semanticResolutionToBoundType(target);
    const trace = [...target.trace, {
      source: sourceName,
      rule: 'Query projection preserved through first()',
      input: methodName,
      output: 'nullable single query projection',
    }];
    const boundAst = BoundSemanticFactory.queryProjection({
      sourceModel: target.sourceModel,
      fields: target.fields,
      cardinality: { kind: 'single' },
      nullability: { kind: 'nullable' },
    });
    return SemanticResolutionFactory.queryProjection({
      status: 'resolved',
      confidence: target.confidence,
      trace,
      boundAst,
      sourceModel: target.sourceModel,
      fields: target.fields,
      cardinality: { kind: 'single' },
      nullability: { kind: 'nullable' },
    });
  }

  if (methodName === 'selectRaw' && target.kind === 'model') {
    return resolveSelectRawProjection(meta, target.model, target.trace, target.confidence);
  }
  if (target.kind !== 'model') return unknown(sourceName, `Eloquent method ${methodName} is not defined for query projection`);

  const rule = lookupEloquentMethod(methodName);
  if (!rule) return unknown(sourceName, `Eloquent method is not registered: ${methodName}`);

  const model = target.model;
  const resolutionCardinality = rule.returns.kind === 'model'
    ? cardinalityFromEloquent(rule.returns.cardinality)
    : target.cardinality;
  const boundCardinality = toBoundResolutionCardinality(resolutionCardinality);
  const semanticType = resultType(rule.returns, model.value);
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
      cardinality: { kind: 'collection' },
    });
  }
  return unknown(sourceName, `Unsupported Eloquent return kind: ${rule.returns.kind}`);

}

function toBoundCardinality(cardinality: import('../../EloquentRegistry').EloquentCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

function toBoundResolutionCardinality(cardinality: import('../../../types/domain/semanticResolution').ResolutionCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

function cardinalityFromEloquent(cardinality: import('../../EloquentRegistry').EloquentCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

function resultType(returnValue: import('../../EloquentRegistry').EloquentReturn, modelName: string) {
  switch (returnValue.kind) {
    case 'number': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'boolean': return new PrimitiveType(PrimitiveKind.BOOLEAN);
    case 'model': return new ReferenceType('', modelName);
    case 'builder': return new ReferenceType('', modelName);
    case 'array': return new PrimitiveType(PrimitiveKind.UNKNOWN);
  }
}

function scalar(trace: SemanticResolution['trace'], boundAst: SemanticResolution['boundAst'], semanticType: PrimitiveType, confidence: number): SemanticResolution {
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence, trace, boundAst, semanticType, nullability: { kind: 'non_nullable' },
  });
}

function unknown(source: string, rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source, rule, input: '', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
  });
}
