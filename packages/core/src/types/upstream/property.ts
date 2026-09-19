import type { ColumnName, PropertyName, RelationName } from './names';
import type { Presence } from './primitiveVocabulary';
import type { Properties } from './collections';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';

export type PropertyOrigin =
  | { readonly kind: 'column'; readonly column: ColumnName }
  | { readonly kind: 'relation'; readonly relation: RelationName }
  | { readonly kind: 'computed' };

export type PropertyDefinition = {
  readonly kind: 'property';
  readonly name: PropertyName;
  readonly type: TypeExpression;
  readonly presence: Presence;
  readonly origin: PropertyOrigin;
  readonly source: SourceSpan;
};

export type PropertySurface = {
  readonly kind: 'property_surface';
  readonly properties: Properties;
};
