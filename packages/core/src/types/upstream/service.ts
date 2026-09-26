import type { ActionName, ClassName, SourceFile } from './names';
import type { DeclaredType } from './typeVocabulary';
import type { Expression, ResolvedExpression } from './expression';
import type { SourceStatements, ServiceParameters } from './collections';
import type { SourceSpan } from './provenance';
import type { Sequence } from './collections';
import type { ModelReference, ServiceReference } from './semanticReferences';
import type { SemanticValue } from './primitiveVocabulary';


export type ServiceReturnType =
  | { readonly kind: 'absent' }
  | { readonly kind: 'declared'; readonly type: DeclaredType };

export type ServiceParameterDefault =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: import('./expression').Expression };

export type ServiceResult =
  | { readonly kind: 'expressions'; readonly items: Sequence<ResolvedExpression> }
  | { readonly kind: 'void' };

export type ServiceMethodResultEntry = {
  readonly kind: 'service_method_result_entry';
  readonly method: ActionName;
  readonly result: SemanticValue;
};

export type ServiceMethodResultIndex = {
  readonly kind: 'service_method_result_index';
  readonly items: Sequence<ServiceMethodResultEntry>;
};

export type ServiceMethod = {
  readonly kind: 'service_method';
  readonly name: ActionName;
  readonly parameters: ServiceParameters;
  readonly declaredReturnType: ServiceReturnType;
  readonly body: SourceStatements;
  readonly result: ServiceResult;
  readonly source: SourceSpan;
};

export type ServiceParameter = {
  readonly kind: 'service_parameter';
  readonly name: import('./names').VariableName;
  readonly type: DeclaredType;
  readonly defaultValue: ServiceParameterDefault;
  readonly source: SourceSpan;
};

export type ServiceDependencyFact = {
  readonly kind: 'service_dependency_fact';
  readonly target: ClassName;
  readonly originMethod: ActionName;
  readonly source: SourceSpan;
};

export type ServiceDependencyFacts = {
  readonly kind: 'service_dependency_facts';
  readonly items: Sequence<ServiceDependencyFact>;
};

export type ResolvedServiceDependency = {
  readonly kind: 'resolved_service_dependency';
  readonly fact: ServiceDependencyFact;
  readonly target: ServiceDependencyTarget;
};

export type ServiceDependencyTarget =
  | ModelReference
  | ServiceReference
  | { readonly kind: 'class_reference'; readonly name: ClassName };

export type ResolvedServiceDependencies = {
  readonly kind: 'resolved_service_dependencies';
  readonly items: Sequence<ResolvedServiceDependency>;
};

export type ServiceDefinition = {
  readonly kind: 'service_definition';
  readonly name: ClassName;
  readonly file: SourceFile;
  readonly methods: ServiceMethods;
  readonly dependencies: ServiceDependencyFacts;
  readonly source: SourceSpan;
};

export type ServiceMethods = {
  readonly kind: 'service_methods';
  readonly items: Sequence<ServiceMethod>;
};
