/** Static Eloquent method semantic producer. */
import type { ResolverMeta, ResolutionContext } from '../../types';
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { ReferenceType } from '../../../compiler/types/SemanticType';
import { lookupEloquentMethod } from '../../EloquentRegistry';

export function resolveStaticMethodCall(
  meta: ResolverMeta,
  context: ResolutionContext,
  sourceName = 'EloquentMethodResolver',
): SemanticResolution {
  if (meta.kind !== 'static_method_call') return unknown(sourceName, 'Invalid static method metadata');

  const className = meta.className.value;
  const methodName = meta.name.value;
  const symbol = context.symbolTable.get(className);
  const rule = lookupEloquentMethod(methodName);

  if (!symbol) return unknown(sourceName, 'Static method target is not a verified model');
  if (!rule) return unknown(sourceName, `Eloquent method is not registered: ${methodName}`);

  const model = SemanticValueFactory.modelName(symbol.name);
  const method = SemanticValueFactory.methodName(methodName);
  const cardinality = rule.returns.kind === 'model'
    ? rule.returns.cardinality.kind === 'single'
      ? { kind: 'single' as const }
      : { kind: 'collection' as const }
    : { kind: 'single' as const };
  const semanticType = ReferenceType.model('', model.value);
  const boundAst = BoundSemanticFactory.methodCall({
    targetModel: { kind: 'model', name: model },
    methodName: method,
    returnType: semanticType,
    cardinality,
    nullability: { kind: 'non_nullable' },
  });

  return SemanticResolutionFactory.model({
    status: 'resolved',
    confidence: 100,
    trace: [{
      source: sourceName,
      rule: `Static Eloquent method ${model.value}::${method.value}`,
      input: method.value,
      output: `model ${model.value}`,
    }],
    boundAst,
    model,
    definition: symbol.node.semantic,
    cardinality: rule.returns.kind === 'model' ? toResolutionCardinality(rule.returns.cardinality) : cardinality,
  });
}

function toResolutionCardinality(cardinality: import('../../EloquentRegistry').EloquentCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

function unknown(source: string, rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown',
    confidence: 0,
    trace: [{ source, rule, input: '', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
  });
}
