import type { Assignment } from './assignment';
import type { ExpressionArguments, Expression, ExpressionArgument } from './expression';
import type { ActionName, ClassName, ControllerName, MethodName, ModelName, RequestName, ResourceName, TableName, VariableName, MiddlewareName } from './names';
import type { SourceSpan } from './provenance';
import type { CatchHandlers, SourceStatements, Sequence } from './collections';
import type { SourceConditionalBranches } from './sourceStatements';
import type { ModelReference, ResourceReference, ResponseReference } from './semanticReferences';
import type { ResponseCardinality, ResponseResult } from './response';
import type { HttpStatusCode, StatementIndex, StatementPath } from './valueObjects';
import type { SemanticDataflowInput } from './semanticDataflow';
import type { ControllerVariableSemanticJudgment } from './controllerVariableSemanticInterface';

export type RequestBinding = { readonly kind: 'bound_request'; readonly name: RequestName } | { readonly kind: 'no_request' };
/** A controller-action response-reference judgment, not proof that the PHP method emits an HTTP response. */
export type ControllerResponseReferenceJudgment =
  | { readonly kind: 'response_reference_declared'; readonly response: ResponseReference }
  | { readonly kind: 'response_reference_not_declared' };

/** Compatibility name for existing controller projection consumers. Prefer ControllerResponseReferenceJudgment in new contracts. */
export type ControllerResponse = ControllerResponseReferenceJudgment;

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

export type ControllerMethodAttributeScope =
  | { readonly kind: 'class' }
  | { readonly kind: 'method' };

export interface ControllerMethodAttribute {
  readonly kind: 'controller_method_attribute';
  readonly scope: ControllerMethodAttributeScope;
  readonly name: ClassName;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

export type ControllerPolicyScope = ControllerMethodAttributeScope;

export type ControllerMiddlewareOrigin =
  | { readonly kind: 'attribute' }
  | { readonly kind: 'has_middleware' };

export type ControllerPolicyActionScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'only'; readonly actions: Sequence<ActionName> }
  | { readonly kind: 'except'; readonly actions: Sequence<ActionName> }
  | { readonly kind: 'only_except'; readonly only: Sequence<ActionName>; readonly except: Sequence<ActionName> };

export type ControllerPolicyNamedScopeArgument = Extract<ExpressionArgument, { readonly kind: 'named' }>;

/** Typed evidence for policy scope that cannot be closed statically. */
export type ControllerPolicyActionScopeBlockReason =
  | Readonly<{ readonly kind: 'duplicate_only_argument'; readonly arguments: readonly ControllerPolicyNamedScopeArgument[] }>
  | Readonly<{ readonly kind: 'duplicate_except_argument'; readonly arguments: readonly ControllerPolicyNamedScopeArgument[] }>
  | Readonly<{ readonly kind: 'unsupported_only_expression'; readonly argument: ControllerPolicyNamedScopeArgument }>
  | Readonly<{ readonly kind: 'unsupported_except_expression'; readonly argument: ControllerPolicyNamedScopeArgument }>
  | Readonly<{ readonly kind: 'unsupported_action_array_entry'; readonly argument: ControllerPolicyNamedScopeArgument; readonly expression: Expression }>
  | Readonly<{ readonly kind: 'unsupported_unpacked_arguments'; readonly arguments: readonly Extract<ExpressionArgument, { readonly kind: 'unpacked' }>[] }>
  | Readonly<{ readonly kind: 'scope_argument_inventory_inconsistent'; readonly arguments: readonly ControllerPolicyNamedScopeArgument[] }>;

/** A scope is either resolved into the existing domain ADT or explicitly blocked. */
export type ControllerPolicyActionScopeJudgment =
  | ControllerPolicyActionScope
  | Readonly<{ readonly kind: 'blocked'; readonly reason: ControllerPolicyActionScopeBlockReason }>;

export interface ControllerMiddlewareRelation {
  readonly kind: 'controller_middleware_relation';
  readonly middleware: MiddlewareName | Expression;
  readonly origin: ControllerMiddlewareOrigin;
  readonly scope: ControllerPolicyScope;
  readonly actions: ControllerPolicyActionScopeJudgment;
  readonly exclusion: boolean;
  readonly source: SourceSpan;
}

export interface ControllerAuthorizationRelation {
  readonly kind: 'controller_authorization_relation';
  readonly scope: ControllerPolicyScope;
  /** Action applicability; class attributes are `all`, method attributes name their concrete action. */
  readonly actions: ControllerPolicyActionScopeJudgment;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
}

export type ControllerPolicyRelation = ControllerMiddlewareRelation | ControllerAuthorizationRelation;

export interface ControllerInheritanceRelation {
  readonly kind: 'controller_inheritance_relation';
  readonly child: ControllerName;
  readonly parent: ControllerName;
  readonly source: SourceSpan;
}

export type ControllerDependencyInjection =
  | { readonly kind: 'constructor' }
  | { readonly kind: 'method' };

/** Semantic resolution mechanism; route/model binding is deliberately a separate route contract. */
export type ControllerContextualAttributeName =
  | 'auth'
  | 'authenticated'
  | 'cache'
  | 'config'
  | 'context'
  | 'db'
  | 'database'
  | 'give'
  | 'log'
  | 'request_attribute'
  | 'route_parameter'
  | 'storage'
  | 'tag'
  | 'current_user';

export interface ControllerContextualAttribute {
  readonly kind: 'laravel_contextual_attribute';
  readonly name: ControllerContextualAttributeName;
  readonly arguments: ExpressionArguments;
}

export interface ControllerCustomContextualAttribute {
  readonly kind: 'custom_contextual_attribute';
  readonly name: ClassName;
  readonly arguments: ExpressionArguments;
}

export type ControllerResolvedContextualAttribute =
  | ControllerContextualAttribute
  | ControllerCustomContextualAttribute;

export type ControllerDependencyResolution =
  | { readonly kind: 'container' }
  | { readonly kind: 'contextual_attribute'; readonly attribute: ControllerResolvedContextualAttribute };

/** Semantic dependency contract exposed upstream; injection mode and resolution remain ADTs. */
export interface ControllerDependency {
  readonly kind: 'controller_dependency';
  readonly injection: ControllerDependencyInjection;
  readonly resolution: ControllerDependencyResolution;
  /** Semantic parameter identity; downstream never needs the PHP AST parameter. */
  readonly parameter: VariableName;
  readonly type: ClassName;
}

export type ControllerQueryInputRole = 'predicate' | 'key' | 'value' | 'mutation';

export interface ControllerQueryInput {
  readonly expression: Expression;
  readonly role: ControllerQueryInputRole;
}

export interface ControllerQueryEvidence {
  readonly kind: 'controller_query_evidence';
  readonly operation: 'model_query' | 'model_write';
  readonly model: ModelName;
  readonly inputs: Sequence<ControllerQueryInput>;
  readonly source: SourceSpan;
}

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
  | { readonly kind: 'http_abort'; readonly status: HttpStatusCode };

/**
 * Failure evidence is intentionally weaker than an exception identity: `abort(status)`
 * gives us a canonical HTTP failure status but does not prove an exception class.
 * ExceptionName must only be introduced when source evidence actually resolves one.
 */
export type ControllerFailureEvidence = ControllerFailureContract;

export interface ControllerMethodContract {
  /** Generic PHP attribute evidence; Laravel-specific meaning is projected by semantic relations. */
  readonly attributes: Sequence<ControllerMethodAttribute>;
  /** Declarative controller policy evidence; route middleware remains a separate route authority. */
  readonly policy: Sequence<ControllerPolicyRelation>;
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
  /** The closed semantic judgment owns the single canonical expression; no parallel expression slot exists. */
  readonly semanticResolution: ControllerVariableSemanticJudgment;
  readonly source: SourceSpan;
}

export interface ControllerVariableBinding {
  readonly variable: VariableName;
  /** Definitions retain source-occurrence order; consumers selecting the current binding use the final available definition. */
  readonly definitions: Sequence<ControllerVariableDefinition>;
}

/** Canonical scanner boundary for controller variable semantics; PHP AST descriptors remain evidence only. */
export interface ControllerSemanticVariableFlow {
  readonly variables: Sequence<ControllerVariableBinding>;
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
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ControllerModelOrigin; readonly cardinality: ResponseCardinality; readonly expression: Expression }
  | { readonly kind: 'model'; readonly model: ControllerModelOrigin; readonly expression: Expression }
  | { readonly kind: 'expression'; readonly expression: Expression };

export interface ControllerSemanticDataflow {
  /** Source-backed Eloquent query evidence retained for semantic dataflow projection. */
  readonly queries: Sequence<ControllerQueryEvidence>;
  /** Canonical dataflow input emitted by scanner evidence; analysis owns closure/authority. */
  readonly dataflow: SemanticDataflowInput;
  readonly variables: Sequence<ControllerVariableBinding>;
  readonly resources: Sequence<ControllerResourceBinding>;
  readonly returned: ControllerReturnSemantic;
}

/**
 * One source-correlated semantic projection shared by the action and method-contract views.
 * Consumers must reuse this value rather than independently recomputing action semantics.
 */
export interface ControllerMethodSemanticProjection {
  readonly kind: 'controller_method_semantic_projection';
  readonly controller: ControllerName;
  readonly source: SourceSpan;
  readonly responseReferenceJudgment: ControllerResponseReferenceJudgment;
  readonly semantic: ControllerSemanticDataflow;
}

export type ControllerHelper = ControllerMethodContract & {
  readonly kind: 'controller_helper';
  readonly controller: ControllerName;
  readonly method: MethodName;
  readonly statements: SourceStatements;
};

export interface ControllerAction {
  readonly kind: 'controller_action';
  readonly controller: ControllerName;
  readonly action: ActionName;
  /** Canonical controller policy evidence; route middleware is resolved separately. */
  readonly policy: Sequence<ControllerPolicyRelation>;
  /** Controller names contributing inherited policy evidence to this action. */
  readonly inheritedFrom: readonly ControllerName[];
  /** Canonical parameter semantics; PHP parameter AST remains scanner evidence. */
  readonly parameters: Sequence<ControllerParameter>;
  readonly request: RequestBinding;
  readonly response: ControllerResponseReferenceJudgment;
  /** Resolved method-level container dependencies; route/model bindings are excluded. */
  readonly dependencies: Sequence<ControllerDependency>;
  readonly statements: SourceStatements;
  readonly semantic: ControllerSemanticDataflow;
  readonly source: SourceSpan;
}

export type ControllerMethod = ControllerAction | ControllerHelper;
