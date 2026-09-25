import type { Assignment } from './assignment';
import type { Expression } from './expression';
import type { ActionName, ClassName, ControllerName, ExceptionName, MethodName, ModelName, RequestName, ResourceName, TableName, VariableName } from './names';
import type { SourceSpan } from './provenance';
import type { CatchHandlers, SourceStatements, Sequence } from './collections';
import type { SourceConditionalBranches } from './sourceStatements';
import type { ModelReference, ResourceReference, ResponseReference } from './semanticReferences';
import type { ResponseResult } from './response';
import type { HttpStatusCode, StatementIndex, StatementPath } from './valueObjects';

export type RequestBinding = { readonly kind: 'bound_request'; readonly name: RequestName } | { readonly kind: 'no_request' };
export type ControllerResponse = { readonly kind: 'response_present'; readonly response: ResponseReference } | { readonly kind: 'response_absent' };

export type ControllerMethodVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ControllerParameterKind =
  | { readonly kind: 'request'; readonly request: RequestName }
  | { readonly kind: 'route_parameter'; readonly name: import('./names').RouteParameterName }
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'dependency'; readonly type: ClassName }
  | { readonly kind: 'value'; readonly variable: VariableName };

export interface ControllerParameter {
  readonly variable: VariableName;
  readonly kind: ControllerParameterKind;
  readonly source: SourceSpan;
}

export type ControllerDependency =
  | { readonly kind: 'constructor'; readonly type: ClassName }
  | { readonly kind: 'method'; readonly type: ClassName };

export type ControllerOperation =
  | { readonly kind: 'model_query'; readonly model: ModelName }
  | { readonly kind: 'model_write'; readonly model: ModelName }
  | { readonly kind: 'resource'; readonly resource: ResourceReference }
  | { readonly kind: 'request_validation'; readonly request: RequestName }
  | { readonly kind: 'response'; readonly response: ResponseReference }
  | { readonly kind: 'database_table'; readonly table: TableName }
  | { readonly kind: 'external_service'; readonly service: ClassName };

export type ControllerFailureContract =
  | { readonly kind: 'none' }
  | { readonly kind: 'http_abort'; readonly status: HttpStatusCode; readonly exception: ExceptionName };

export interface ControllerMethodContract {
  readonly visibility: ControllerMethodVisibility;
  readonly parameters: Sequence<ControllerParameter>;
  readonly dependencies: Sequence<ControllerDependency>;
  readonly operations: Sequence<ControllerOperation>;
  readonly failure: ControllerFailureContract;
  readonly source: SourceSpan;
}

export type ControllerModelOrigin =
  | { readonly kind: 'model_class'; readonly name: ModelName }
  | { readonly kind: 'table'; readonly name: TableName };

export type ControllerVariableOrigin =
  | { readonly kind: 'parameter' }
  | { readonly kind: 'assignment'; readonly statementIndex: StatementIndex }
  | { readonly kind: 'foreach'; readonly statementIndex: StatementIndex }
  | { readonly kind: 'catch'; readonly statementIndex: StatementIndex }
  | { readonly kind: 'external' };

export type ControllerDefinitionAvailability =
  | { readonly kind: 'definite' }
  | { readonly kind: 'branch_conditional'; readonly branchPath: StatementPath }
  | { readonly kind: 'loop_conditional'; readonly branchPath: StatementPath }
  | { readonly kind: 'catch_conditional'; readonly branchPath: StatementPath };

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
  readonly response: ResponseReference;
  readonly source: SourceSpan;
}

export type ControllerReturnSemantic =
  | { readonly kind: 'absent' }
  | { readonly kind: 'response'; readonly result: ResponseResult; readonly expression: Expression }
  | { readonly kind: 'branches'; readonly branches: Sequence<ControllerReturnSemantic>; readonly expression: Expression }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ControllerModelOrigin; readonly expression: Expression }
  | { readonly kind: 'model'; readonly model: ControllerModelOrigin; readonly expression: Expression }
  | { readonly kind: 'expression'; readonly expression: Expression };

export interface ControllerSemanticDataflow {
  readonly variables: Sequence<ControllerVariableBinding>;
  readonly resources: Sequence<ControllerResourceBinding>;
  readonly returned: ControllerReturnSemantic;
}

export type ControllerHelper = ControllerMethodContract & {
  readonly kind: 'controller_helper';
  readonly controller: ControllerName;
  readonly method: MethodName;
  readonly statements: SourceStatements;
};

export type ControllerAction = ControllerMethodContract & {
  readonly kind: 'controller_action';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly request: RequestBinding;
  readonly response: ControllerResponse;
  readonly statements: SourceStatements;
  readonly semantic: ControllerSemanticDataflow;
  readonly source: SourceSpan;
};

export type ControllerMethod = ControllerAction | ControllerHelper;
