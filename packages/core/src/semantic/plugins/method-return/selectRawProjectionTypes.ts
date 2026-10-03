import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType, primitiveType } from '../../../compiler/types/SemanticType';
import type { SemanticType } from '../../../compiler/types/SemanticType';
import type { ModelSemanticDefinition } from '../../../types/upstream/model';
import { relationAll, relationAny, relationEqual, relationResolve } from '../../../semantic/kernel/semanticRelations';

export function aggregateType(
  aggregate: 'avg' | 'count' | 'sum' | 'min' | 'max',
  source: { readonly kind: 'column'; readonly column: import('../../../types/domain/semanticValues').ColumnName } | { readonly kind: 'rows' },
  model: ModelSemanticDefinition,
): SemanticType {
  return relationResolve(relationAny([relationEqual(aggregate, 'count'), relationEqual(aggregate, 'avg'), relationEqual(aggregate, 'sum')]),
    () => primitiveType(PrimitiveKind.NUMBER),
    () => relationResolve(relationEqual(source.kind, 'rows'),
      () => primitiveType(PrimitiveKind.NUMBER),
      () => {
        const property = model.surface.byName.column(SemanticValueFactory.propertyName(source.column.value.value));
        return relationResolve(relationEqual(property.kind, 'found'), () => property.value.semanticType, () => primitiveType(PrimitiveKind.INDETERMINATE));
      }));
}

