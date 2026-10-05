import type { SourceDiscovery, Sequence } from './collections';
import type { ControllerAction } from './controller';
import type { Expression, ResolvedExpression, ExpressionArguments } from './expression';
import type { PropertyDefinition } from './property';
import type { ClassName, MethodName, SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { DeclaredType } from './typeVocabulary';

export type ExpressionArgumentsOption =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: ExpressionArguments };

export type DtoDefinition = { readonly kind: 'dto'; readonly name: ClassName; readonly file: SourceFile; readonly properties: DtoProperties; readonly methods: DtoMethods; readonly source: SourceSpan };
export type DtoProperty = { readonly kind: 'dto_property'; readonly property: PropertyDefinition; readonly declared: DeclaredType; readonly source: SourceSpan };
export type DtoMethod = { readonly kind: 'dto_method'; readonly name: MethodName; readonly action: ControllerAction; readonly source: SourceSpan };
export type MiddlewareDefinition = { readonly kind: 'middleware'; readonly name: ClassName; readonly file: SourceFile; readonly handle: ControllerAction; readonly source: SourceSpan };
export type ProviderContainerOperationName =
  | 'bind' | 'bind_if' | 'singleton' | 'singleton_if' | 'scoped' | 'scoped_if'
  | 'instance' | 'alias' | 'make' | 'make_with' | 'bound' | 'call' | 'tag' | 'tagged'
  | 'when' | 'needs' | 'give' | 'give_tagged' | 'give_config'
  | 'extend' | 'resolving' | 'after_resolving' | 'rebinding' | 'before_resolving'
  | 'after_resolving_attribute' | 'when_has_attribute';

/** Stable semantic operation contract; raw method names are normalized upstream. */
export interface ProviderContainerOperation {
  readonly kind: 'provider_container_operation';
  readonly name: ProviderContainerOperationName;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

/** Semantic registration contract; consumers never inspect raw container method calls. */
export interface ProviderContainerRegistration {
  readonly kind: 'provider_container_registration';
  readonly operation: Exclude<ProviderContainerOperationName, 'when' | 'needs' | 'give' | 'give_tagged' | 'give_config' | 'make' | 'make_with' | 'alias' | 'call' | 'bound' | 'extend' | 'resolving' | 'after_resolving' | 'rebinding' | 'before_resolving' | 'after_resolving_attribute' | 'when_has_attribute'>;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

export interface ProviderContainerBoundCheck {
  readonly kind: 'provider_container_bound_check';
  readonly target: ExpressionArguments;
  readonly source: SourceSpan;
}

export interface ProviderContainerTagging {
  readonly kind: 'provider_container_tagging';
  readonly services: ExpressionArguments;
  readonly tag: ExpressionArguments;
  readonly source: SourceSpan;
}

export interface ProviderContainerTaggedResolution {
  readonly kind: 'provider_container_tagged_resolution';
  readonly tag: ExpressionArguments;
  readonly source: SourceSpan;
}

export type ProviderContextualGive =
  | { readonly kind: 'implementation'; readonly arguments: ExpressionArguments }
  | { readonly kind: 'tagged'; readonly arguments: ExpressionArguments }
  | { readonly kind: 'config'; readonly arguments: ExpressionArguments };

/** Semantic representation of Laravel when()->needs()->give*() chains. */
/** Semantic container resolution contract; consumers never inspect raw make/makeWith arguments. */
export type ProviderContainerLifecycleOperation =
  | 'extend'
  | 'resolving'
  | 'after_resolving'
  | 'rebinding'
  | 'before_resolving'
  | 'after_resolving_attribute'
  | 'when_has_attribute';

/** Semantic lifecycle hook contract; callback wiring stays upstream. */
export interface ProviderContainerLifecycleHook {
  readonly kind: 'provider_container_lifecycle_hook';
  readonly operation: ProviderContainerLifecycleOperation;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

export interface ProviderContainerResolution {
  readonly kind: 'provider_container_resolution';
  readonly operation: 'make' | 'make_with';
  readonly target: ExpressionArguments;
  readonly parameters: ExpressionArgumentsOption;
  readonly source: SourceSpan;
}

/** Semantic alias registration contract. */
export interface ProviderContainerAlias {
  readonly kind: 'provider_container_alias';
  readonly target: ExpressionArguments;
  readonly alias: ExpressionArguments;
  readonly source: SourceSpan;
}

/** Semantic container invocation contract. */
export interface ProviderContainerInvocation {
  readonly kind: 'provider_container_invocation';
  readonly operation: 'call';
  readonly callable: ExpressionArguments;
  readonly parameters: ExpressionArgumentsOption;
  readonly source: SourceSpan;
}

export interface ProviderContextualBinding {
  readonly kind: 'provider_contextual_binding';
  readonly context: ExpressionArguments;
  readonly needs: ExpressionArguments;
  readonly give: ProviderContextualGive;
  readonly source: SourceSpan;
}

export type ProviderContainerBinding =
  | ProviderContainerRegistration
  | ProviderContainerLifecycleHook
  | ProviderContainerResolution
  | ProviderContainerAlias
  | ProviderContainerInvocation
  | ProviderContainerBoundCheck
  | ProviderContainerTagging
  | ProviderContainerTaggedResolution
  | ProviderContextualBinding;

export interface ProviderContainerBindings {
  readonly kind: 'provider_container_bindings';
  readonly items: Sequence<ProviderContainerBinding>;
}

export interface ProviderContainerOperations {
  readonly kind: 'provider_container_operations';
  readonly items: Sequence<ProviderContainerOperation>;
}
export interface ProviderBindingAttribute {
  readonly kind: 'provider_binding_attribute';
  readonly name: 'bind' | 'bind_when' | 'singleton' | 'scoped';
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

export interface ProviderBindingAttributes {
  readonly kind: 'provider_binding_attributes';
  readonly items: Sequence<ProviderBindingAttribute>;
}

export interface ProviderDefinition {
  readonly kind: 'provider';
  readonly name: ClassName;
  readonly file: SourceFile;
  readonly register: Expression;
  readonly boot: Expression;
  readonly bindings: ProviderContainerBindings;
  readonly bindingAttributes: ProviderBindingAttributes;
  readonly source: SourceSpan;
}
export interface AttributeDefinition {
  readonly kind: 'attribute';
  readonly name: ClassName;
  readonly file: SourceFile;
  readonly constructor: Expression;
  readonly contextual: boolean;
  readonly source: SourceSpan;
}
export type MiddlewareAsts = { readonly kind: 'middleware_asts'; readonly items: SourceDiscovery<import('./ast').MiddlewareAst> };
export type ProviderAsts = { readonly kind: 'provider_asts'; readonly items: SourceDiscovery<import('./ast').ProviderAst> };
export type AttributeAsts = { readonly kind: 'attribute_asts'; readonly items: SourceDiscovery<import('./ast').AttributeAst> };

export type DtoProperties = { readonly kind: 'dto_properties'; readonly items: Sequence<DtoProperty> };
export type DtoMethods = { readonly kind: 'dto_methods'; readonly items: Sequence<DtoMethod> };
