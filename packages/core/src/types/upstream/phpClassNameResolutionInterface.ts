import type { ClassName } from './names';
import type { StringValue } from './valueObjects';

/** Canonical PHP class identity after applying the owning namespace region and class imports. */
export interface PhpQualifiedClassName {
  readonly kind: 'php_qualified_class_name';
  readonly value: StringValue;
}

export interface PhpQualifiedClassNameFactoryInterface {
  readonly kind: 'php_qualified_class_name_factory';
  readonly create: (value: string) => PhpQualifiedClassName;
}

export const phpQualifiedClassNameFactory: PhpQualifiedClassNameFactoryInterface = Object.freeze({
  kind: 'php_qualified_class_name_factory',
  create: (value: string): PhpQualifiedClassName => Object.freeze({
    kind: 'php_qualified_class_name',
    value: Object.freeze({ kind: 'string_value', value: value.replace(/^\\+/, '') }),
  }),
});

/** Class imports are distinct from function imports and retain their lexical source region. */
export interface PhpClassImportBinding {
  readonly kind: 'php_class_import_binding';
  readonly alias: ClassName;
  readonly target: PhpQualifiedClassName;
}

/** An unresolved class name is evidence of missing lexical context, never a short-name guess. */
export type PhpClassNameResolution =
  | Readonly<{
      readonly kind: 'php_class_name_resolved';
      readonly sourceName: ClassName;
      readonly qualifiedName: PhpQualifiedClassName;
      readonly rule: 'fully_qualified' | 'namespace_relative' | 'class_import' | 'current_namespace';
    }>
  | Readonly<{
      readonly kind: 'php_class_name_resolution_blocked';
      readonly sourceName: ClassName;
      readonly reason: 'class_import_inventory_incomplete' | 'malformed_class_name' | 'class_name_resolution_context_unavailable';
    }>;


/** Lexical class-name context shared by declaration inheritance and invocation analysis. */
export type PhpClassNameResolutionContext = Readonly<{
  readonly kind: 'php_class_name_resolution_context';
  readonly namespaceName: PhpQualifiedClassName;
  readonly classImports: readonly PhpClassImportBinding[];
  readonly importInventory: 'complete' | 'incomplete';
}>;

/** Typed evidence presented to the single PHP class-name resolution authority. */
export type PhpClassNameResolutionInput = Readonly<{
  readonly kind: 'php_class_name_resolution_input';
  readonly sourceName: ClassName;
  readonly context: PhpClassNameResolutionContext | Readonly<{ readonly kind: 'php_class_name_resolution_context_unavailable' }>;
}>;

/** The authority closes PHP lexical class-name resolution before scanner wiring. */
export interface PhpClassNameResolutionRuleInterface {
  readonly kind: 'php_class_name_resolution_rule';
  readonly contractVersion: 2;
  readonly judge: (input: PhpClassNameResolutionInput) => PhpClassNameResolution;
}
