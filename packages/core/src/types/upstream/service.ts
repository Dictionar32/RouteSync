import type { Sequence } from './collections';
import type { ActionName, ClassName, SourceFile } from './names';
import type { DeclaredType } from './typeVocabulary';
import type { Expression, ResolvedExpression } from './expression';
import type { ControllerStatements, ServiceParameters } from './collections';
import type { SourceSpan } from './provenance';

export type ServiceResult =
  | { readonly kind: 'expression'; readonly expression: ResolvedExpression }
  | { readonly kind: 'void' };

export type ServiceMethod = {
  readonly kind: 'service_method';
  readonly name: ActionName;
  readonly parameters: ServiceParameters;
  readonly body: ControllerStatements;
  readonly result: ServiceResult;
  readonly source: SourceSpan;
};

export type ServiceParameter = {
  readonly kind: 'service_parameter';
  readonly name: import('./names').VariableName;
  readonly type: DeclaredType;
  readonly source: SourceSpan;
};

export type ServiceDefinition = {
  readonly kind: 'service_definition';
  readonly name: ClassName;
  readonly file: SourceFile;
  readonly methods: ServiceMethods;
  readonly source: SourceSpan;
};

export type ServiceMethods = {
  readonly kind: 'service_methods';
  readonly items: Sequence<ServiceMethod>;
};
