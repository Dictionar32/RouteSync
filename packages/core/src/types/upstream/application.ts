import type { SourceDiscovery, Sequence } from './collections';
import type { ControllerAction } from './controller';
import type { Expression, ResolvedExpression } from './expression';
import type { PropertyDefinition } from './property';
import type { ClassName, MethodName, SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { DeclaredType } from './typeVocabulary';

export type DtoDefinition = { readonly kind: 'dto'; readonly name: ClassName; readonly file: SourceFile; readonly properties: DtoProperties; readonly methods: DtoMethods; readonly source: SourceSpan };
export type DtoProperty = { readonly kind: 'dto_property'; readonly property: PropertyDefinition; readonly declared: DeclaredType; readonly source: SourceSpan };
export type DtoMethod = { readonly kind: 'dto_method'; readonly name: MethodName; readonly action: ControllerAction; readonly source: SourceSpan };
export type MiddlewareDefinition = { readonly kind: 'middleware'; readonly name: ClassName; readonly file: SourceFile; readonly handle: ControllerAction; readonly source: SourceSpan };
export type ProviderDefinition = { readonly kind: 'provider'; readonly name: ClassName; readonly file: SourceFile; readonly register: Expression; readonly boot: Expression; readonly source: SourceSpan };
export type AttributeDefinition = { readonly kind: 'attribute'; readonly name: ClassName; readonly file: SourceFile; readonly constructor: Expression; readonly source: SourceSpan };
export type MiddlewareAsts = { readonly kind: 'middleware_asts'; readonly items: SourceDiscovery<import('./ast').MiddlewareAst> };
export type ProviderAsts = { readonly kind: 'provider_asts'; readonly items: SourceDiscovery<import('./ast').ProviderAst> };
export type AttributeAsts = { readonly kind: 'attribute_asts'; readonly items: SourceDiscovery<import('./ast').AttributeAst> };

export type DtoProperties = { readonly kind: 'dto_properties'; readonly items: Sequence<DtoProperty> };
export type DtoMethods = { readonly kind: 'dto_methods'; readonly items: Sequence<DtoMethod> };
