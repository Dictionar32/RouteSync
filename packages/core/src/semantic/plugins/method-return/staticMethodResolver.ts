/** Static Eloquent method semantic producer. */
import type { ResolverMeta, ResolutionContext } from '../../types';
import type { SemanticResolution, ResolutionCardinality } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { ReferenceType } from '../../../types/domain/semanticType';
import { lookupEloquentMethodRelation, type EloquentCardinality, type EloquentReturn } from '../../EloquentRegistry';
import { matchLookup } from '../../../types/upstream/collections';
import { relationFirst, relationOptionFold, relationRefine, relationResolve } from '../../kernel/relationalSequence';
import { relationEqual } from '../../kernel/semanticRelations';

type StaticMethodMeta = Extract<ResolverMeta, { kind: 'static_method_call' }>;
type BoundCardinality = Readonly<{ kind: 'single' } | { kind: 'collection' }>;
const isStaticMethod = (value: ResolverMeta): value is StaticMethodMeta => relationEqual(value.kind, 'static_method_call');
const isModelReturn = (value: EloquentReturn): value is Extract<EloquentReturn, { kind: 'model' }> => relationEqual(value.kind, 'model');
const isSingleCardinality = (value: EloquentCardinality): value is Extract<EloquentCardinality, { kind: 'single' }> => relationEqual(value.kind, 'single');
const isCollectionCardinality = (value: EloquentCardinality): value is Extract<EloquentCardinality, { kind: 'collection' }> => relationEqual(value.kind, 'collection');

export function resolveStaticMethodCall(meta: ResolverMeta, context: ResolutionContext, sourceName = 'EloquentMethodResolver'): SemanticResolution {
  return relationOptionFold(
    relationRefine(meta, isStaticMethod),
    () => indeterminate(sourceName, 'Invalid static method metadata'),
    value => {
      const className = value.className.value;
      const methodName = value.name.value;
      return matchLookup(context.symbolTable.lookup(className), {
        missing: () => indeterminate(sourceName, 'Static method target is not a verified model'),
        found: symbolLookup => matchLookup(lookupEloquentMethodRelation(methodName), {
          missing: () => indeterminate(sourceName, `Eloquent method is not registered: ${methodName}`),
          found: ruleLookup => {
            const symbol = symbolLookup.value;
            const rule = ruleLookup.value;
            const model = SemanticValueFactory.modelName(symbol.name);
            const method = SemanticValueFactory.methodName(methodName);
            const boundCardinality: BoundCardinality = relationOptionFold(
              relationRefine(rule.returns, isModelReturn),
              () => ({ kind: 'single' }),
              item => relationResolve<BoundCardinality>(relationEqual(item.cardinality.kind, 'single'), () => ({ kind: 'single' }), () => ({ kind: 'collection' })),
            );
            const semanticType = ReferenceType.model('', model.value.value);
            const boundAst = BoundSemanticFactory.methodCall({
              targetModel: { kind: 'model', name: model },
              methodName: method,
              returnType: semanticType,
              cardinality: boundCardinality,
              nullability: { kind: 'non_nullable' },
            });
            return SemanticResolutionFactory.model({
              status: 'resolved', confidence: 100,
              trace: [{ source: sourceName, rule: `Static Eloquent method ${model.value.value}::${method.value.value}`, input: method.value.value, output: `model ${model.value.value}` }],
              boundAst, model, definition: symbol.node.definition,
              cardinality: relationOptionFold(
                relationRefine(rule.returns, isModelReturn),
                () => ({ kind: 'single' }),
                item => toResolutionCardinality(item.cardinality),
              ),
            });
          },
        }),
      });
    },
  );
}

function toResolutionCardinality(cardinality: EloquentCardinality): ResolutionCardinality {
  return relationResolve<ResolutionCardinality>(
    relationEqual(cardinality.kind, 'single'),
    () => ({ kind: 'single' }),
    () => relationResolve<ResolutionCardinality>(relationEqual(cardinality.kind, 'collection'), () => ({ kind: 'collection' }), () => ({ kind: 'paginated_collection' })),
  );
}

function indeterminate(source: string, rule: string): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({
    status: 'indeterminate', confidence: 0,
    trace: [{ source, rule, input: '', output: 'indeterminate' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
  });
}
