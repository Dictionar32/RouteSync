import type { Assignment } from './assignment';
import type { Expression } from './expression';
import type { ActionName, ControllerName, DomainTypeName, ExceptionName, ModelName, RequestName, ResourceName, TableName, VariableName } from './names';
import type { ResponseContract } from './response';
import type { SourceSpan } from './provenance';
import type { CatchHandlers, ControllerStatements, Sequence } from './collections';
import type { ResourceReference } from './semanticReferences';
import type { HttpStatusCode } from './valueObjects';

export type RequestBinding = { readonly kind: 'bound_request'; readonly name: RequestName } | { readonly kind: 'no_request' };
export type CatchHandler = { readonly kind: 'catch_handler'; readonly variable: VariableName; readonly exception: ExceptionName; readonly body: ControllerStatements; readonly source: SourceSpan };
export type ConditionalBranches = { readonly kind: 'then_only'; readonly whenTrue: ControllerStatements } | { readonly kind: 'then_else'; readonly whenTrue: ControllerStatements; readonly whenFalse: ControllerStatements };
export type ControllerStatement = { readonly kind: 'assignment'; readonly value: Assignment; readonly source: SourceSpan } | { readonly kind: 'expression'; readonly value: Expression; readonly source: SourceSpan } | { readonly kind: 'return'; readonly expression: Expression; readonly response: ResponseContract; readonly source: SourceSpan } | { readonly kind: 'conditional'; readonly condition: Expression; readonly branches: ConditionalBranches; readonly source: SourceSpan } | { readonly kind: 'for_each'; readonly iterable: Expression; readonly variable: VariableName; readonly body: ControllerStatements; readonly source: SourceSpan } | { readonly kind: 'transaction'; readonly body: ControllerStatements; readonly source: SourceSpan } | { readonly kind: 'try'; readonly body: ControllerStatements; readonly catches: CatchHandlers; readonly source: SourceSpan } | { readonly kind: 'throw'; readonly error: Expression; readonly source: SourceSpan } | { readonly kind: 'abort'; readonly status: HttpStatusCode; readonly message: Expression; readonly source: SourceSpan };

export type ControllerModelOrigin =
  | { readonly kind: 'model_class'; readonly name: ModelName }
  | { readonly kind: 'table'; readonly name: TableName };

export type ControllerVariableOrigin =
  | { readonly kind: 'parameter' }
  | { readonly kind: 'assignment'; readonly statementIndex: number }
  | { readonly kind: 'foreach'; readonly statementIndex: number }
  | { readonly kind: 'catch'; readonly statementIndex: number }
  | { readonly kind: 'external' };

export type ControllerDefinitionAvailability =
  | { readonly kind: 'definite' }
  | { readonly kind: 'branch_conditional'; readonly branchPath: Sequence<number> }
  | { readonly kind: 'loop_conditional'; readonly branchPath: Sequence<number> }
  | { readonly kind: 'catch_conditional'; readonly branchPath: Sequence<number> };

export type ControllerVariableSemantic =
  | { readonly kind: 'model_origin'; readonly origin: ControllerModelOrigin }
  | { readonly kind: 'request_origin'; readonly name: RequestName }
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'external' };

export type ControllerExpressionOrigin =
  | { readonly kind: 'model'; readonly model: ControllerModelOrigin }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ControllerModelOrigin }
  | { readonly kind: 'request'; readonly name: RequestName }
  | { readonly kind: 'parameter' }
  | { readonly kind: 'value' };

export interface ControllerExpressionFact {
  readonly expression: Expression;
  readonly origin: ControllerExpressionOrigin;
  readonly source: SourceSpan;
}

export interface ControllerVariableDefinition {
  readonly variable: VariableName;
  readonly origin: ControllerVariableOrigin;
  readonly expression: Expression;
  readonly semantic: ControllerVariableSemantic;
  readonly availability: ControllerDefinitionAvailability;
  readonly source: SourceSpan;
}

export interface ControllerVariableBinding {
  readonly variable: VariableName;
  readonly definitions: Sequence<ControllerVariableDefinition>;
}

export interface ControllerResourceBinding {
  readonly resource: ResourceReference;
  readonly model: ControllerModelOrigin;
  readonly source: SourceSpan;
}

export type ControllerReturnSemantic =
  | { readonly kind: 'absent' }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ControllerModelOrigin; readonly expression: Expression }
  | { readonly kind: 'model'; readonly model: ControllerModelOrigin; readonly expression: Expression }
  | { readonly kind: 'expression'; readonly expression: Expression };

export interface ControllerSemanticDataflow {
  readonly variables: Sequence<ControllerVariableBinding>;
  readonly resources: Sequence<ControllerResourceBinding>;
  readonly returned: ControllerReturnSemantic;
}

export type ControllerAction = {
  readonly kind: 'controller_action';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly domain: DomainTypeName;
  readonly request: RequestBinding;
  readonly statements: ControllerStatements;
  readonly response: ResponseContract;
  readonly semantic: ControllerSemanticDataflow;
  readonly source: SourceSpan;
};
