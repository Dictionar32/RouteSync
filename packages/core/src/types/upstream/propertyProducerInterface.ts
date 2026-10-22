import type { PropertyAst, PropertyDeclaration } from './property';
import type { SourceSpan } from './provenance';
import type { ClassName, ColumnName, ModelName, RelationName } from './names';

/** Semantic owner for a parsed Laravel/PHP property declaration. */
export type PropertyProducerContext =
  | { readonly kind: 'model_attribute'; readonly model: ModelName; readonly column: ColumnName }
  | { readonly kind: 'relation_attribute'; readonly model: ModelName; readonly relation: RelationName }
  | { readonly kind: 'class_property'; readonly owner: ClassName; readonly declaration: PropertyDeclaration };

export interface PropertyProducerInput<PropertyEvidence extends object> {
  readonly property: PropertyEvidence;
  readonly context: PropertyProducerContext;
  readonly source: SourceSpan;
}

export interface PropertyProducerInterface<PropertyEvidence extends object> {
  readonly produce: (input: PropertyProducerInput<PropertyEvidence>) => PropertyAst;
}
