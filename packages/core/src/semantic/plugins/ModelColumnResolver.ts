import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { typeExpressionToSemanticType } from '../../compiler/domain/common/typeExpressionSemanticType';
import type { ModelColumnFact } from '../../types/upstream/modelSourceFacts';
import { modelSemanticPropertyLookup, type ModelSemanticColumn } from '../../types/upstream/model';
import { matchLookup } from '../../types/upstream/collections';
import { relationFirst, relationFirstOption, relationOptionFold, relationRefine, relationSequenceToArray } from '../kernel/relationalSequence';
import { relationEqual, relationGate } from '../kernel/semanticRelations';
import type { ModelNode } from '../modelNodes';

const isColumn = (property: import('../../types/upstream/model').ModelSemanticProperty): property is ModelSemanticColumn => relationEqual(property.kind, 'column');
const isAccessor = (property: import('../../types/upstream/model').ModelSemanticProperty): property is import('../../types/upstream/model').ModelSemanticAccessor => relationEqual(property.kind, 'accessor');

const indeterminate = (message: string): SemanticResolution => SemanticResolutionFactory.indeterminate({
  status: 'indeterminate', confidence: 0,
  trace: [{ source: 'ModelColumnResolver', rule: message, input: '', output: 'indeterminate' }],
  boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
});

const resolveColumn = (model: ModelNode, name: string, column: ModelSemanticColumn, fact: ModelColumnFact): SemanticResolution => {
  const semanticType = typeExpressionToSemanticType(column.semanticType);
  const castType: import('../../types/domain/semanticValues').BoundCastType = relationGate(
    relationEqual(fact.type.kind, 'casted'),
    () => ({ kind: 'cast', type: SemanticValueFactory.castTypeName((fact.type as Extract<ModelColumnFact['type'], { kind: 'casted' }>).cast.kind) }),
    () => ({ kind: 'no_cast' }),
  );
  const boundAst = BoundSemanticFactory.modelColumn({
    model: SemanticValueFactory.modelName(model.definition.semantic.identity.name.value.value),
    column: SemanticValueFactory.columnName(name),
    dbType: fact.databaseType,
    castType,
    semanticType,
  });
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: 100,
    trace: [{ source: 'ModelColumnResolver', rule: 'Upstream model semantic surface lookup', input: `${model.definition.semantic.identity.name.value.value}.${name}`, output: semanticType.kind }],
    boundAst, semanticType, nullability: fact.nullability,
  });
};

const resolveModelColumn = (model: ModelNode, meta: Extract<ResolverMeta, { kind: 'model_column' }>, context: ResolutionContext): SemanticResolution =>
  matchLookup(
    modelSemanticPropertyLookup(model.definition.semantic.surface.byName, SemanticValueFactory.propertyName(meta.column.value.value)),
    {
      missing: () => indeterminate(`Property ${meta.column.value.value} not found on model ${model.definition.semantic.identity.name.value.value}`),
      found: ({ value: property }) => relationOptionFold(
        relationRefine(property, isColumn),
        () => relationOptionFold(
          relationRefine(property, isAccessor),
          () => indeterminate(`Property ${meta.column.value.value} is not a column or accessor on model ${model.definition.semantic.identity.name.value.value}`),
          () => resolveInScope(
            context.kernel,
            { kind: 'model_accessor', model: SemanticValueFactory.modelName(model.definition.semantic.identity.name.value.value), column: SemanticValueFactory.columnName(meta.column.value.value) },
            modelScope(model),
          ),
        ),
        column => relationOptionFold(
          relationFirstOption(relationSequenceToArray(model.definition.semantic.columnFacts.items), fact => relationEqual(fact.column.value.value, meta.column.value.value)),
          () => indeterminate(`Column fact ${meta.column.value.value} not found on model ${model.definition.semantic.identity.name.value.value}`),
          fact => resolveColumn(model, meta.column.value.value, column, fact),
        ),
      ),
    },
  );

export const ModelColumnResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationEqual(meta.kind, 'model_column'),
  resolve: (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => relationOptionFold(
    relationRefine(meta, (value): value is Extract<ResolverMeta, { kind: 'model_column' }> => relationEqual(value.kind, 'model_column')),
    () => indeterminate('Unsupported model-column metadata'),
    value => relationOptionFold(
      relationFirst(context.models, model => relationEqual(model.definition.semantic.identity.name.value.value, value.model.value.value)),
      () => indeterminate(`Model ${value.model.value.value} not found in manifest`),
      model => resolveModelColumn(model, value, context),
    ),
  ),
});
