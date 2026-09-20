import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';
import type { SemanticType } from '../../../compiler/types/SemanticType';
import type { ModelSemanticDefinition } from '../../../types/domain/models';

export function aggregateType(
  aggregate: 'avg' | 'count' | 'sum' | 'min' | 'max',
  source: { readonly kind: 'column'; readonly column: import('../../../types/domain/semanticValues').ColumnName } | { readonly kind: 'rows' },
  model: ModelSemanticDefinition,
): SemanticType {
  if (aggregate === 'count' || aggregate === 'avg' || aggregate === 'sum') return new PrimitiveType(PrimitiveKind.NUMBER);
  if (source.kind === 'rows') return new PrimitiveType(PrimitiveKind.NUMBER);
  const property = model.surface.byName.column(SemanticValueFactory.propertyName(source.column.value.value));
  return property.kind === 'found' ? property.value.semanticType : new PrimitiveType(PrimitiveKind.UNKNOWN);
}

