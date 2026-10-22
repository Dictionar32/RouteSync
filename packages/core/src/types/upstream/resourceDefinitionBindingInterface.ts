import type { ResourceAst } from './ast';
import type { ResourceName, VariableName, ClassName } from './names';
import type { SourceSpan } from './provenance';
import type { ResourceWrapping } from './resource';
import type { ModelReference } from './semanticReferences';

/** Input contract for binding one Resource AST from already-parsed source evidence. */
export interface ResourceDefinitionBindingInput<
  Entry extends object,
  Statement extends object,
  Method extends object,
  ModelSymbols extends object,
  KnowledgeDataFlow extends object,
> {
  readonly resourceName: ResourceName;
  readonly entries: readonly Entry[];
  readonly source: SourceSpan;
  readonly modelSymbolTable: ModelSymbols;
  readonly knowledgeDataFlow?: KnowledgeDataFlow;
  readonly assignments?: readonly Statement[];
  readonly method: Method;
  readonly baseClass: ClassName;
  readonly wrapping: ResourceWrapping;
  readonly requestParameter: VariableName;
  readonly documentationMixins: readonly ModelReference[];
}

/** Explicit operation contract for the legacy Resource AST binding entry point. */
export interface ResourceDefinitionBindingOperationInterface<Input extends object> {
  (input: Input): ResourceAst;
}
