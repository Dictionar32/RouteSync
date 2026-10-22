import type { MethodName } from './names';
import type { SourceSpan } from './provenance';

/** One method declaration bound to its exact source span and parser-owned payload. */
export interface PhpClassMethodDeclarationEvidence<TMethod> {
  readonly name: MethodName;
  readonly source: SourceSpan;
  readonly value: TMethod;
}

/**
 * Closed evidence that the parser has enumerated every method declaration for a class.
 * Constructor selection must not infer `missing` from a partial method list.
 */
export type PhpClassMethodDeclarationInventory<TMethod> =
  | Readonly<{
      readonly kind: 'php_class_method_declaration_inventory_complete';
      readonly classSource: SourceSpan;
      readonly declarations: readonly PhpClassMethodDeclarationEvidence<TMethod>[];
    }>
  | Readonly<{
      readonly kind: 'php_class_method_declaration_inventory_blocked';
      readonly classSource: SourceSpan;
      readonly blockers: readonly PhpClassMethodDeclarationInventoryBlocker[];
    }>;

export type PhpClassMethodDeclarationInventoryBlocker =
  | Readonly<{
      readonly kind: 'php_class_method_declaration_enumeration_incomplete';
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'php_class_method_declaration_parse_blocked';
      readonly source: SourceSpan;
    }>;

export type PhpClassConstructorSelection<TMethod> =
  | Readonly<{ readonly kind: 'php_class_constructor_selected'; readonly method: PhpClassMethodDeclarationEvidence<TMethod> }>
  | Readonly<{ readonly kind: 'php_class_constructor_missing'; readonly classSource: SourceSpan }>
  | Readonly<{ readonly kind: 'php_class_constructor_ambiguous'; readonly classSource: SourceSpan; readonly candidates: readonly SourceSpan[] }>
  | Readonly<{ readonly kind: 'php_class_constructor_selection_blocked'; readonly classSource: SourceSpan; readonly blockers: readonly PhpClassMethodDeclarationInventoryBlocker[] }>;

/**
 * Upstream ownership of PHP constructor declaration selection. Only a closed
 * method inventory can justify selected/missing/ambiguous; incomplete evidence
 * remains blocked and is never reclassified as a missing constructor.
 */
export interface PhpClassConstructorSelectionAuthorityInterface {
  readonly kind: 'php_class_constructor_selection_authority';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly select: <TMethod>(inventory: PhpClassMethodDeclarationInventory<TMethod>) => PhpClassConstructorSelection<TMethod>;
}
