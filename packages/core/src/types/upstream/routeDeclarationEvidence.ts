import type { SourceSpan } from './provenance';
import type { ControllerReturnSemantic } from './controller';

/** Canonical Laravel declaration vocabulary belongs to the source-evidence contract. */
export type LaravelRouteMethodEvidence =
  | 'get' | 'post' | 'put' | 'patch' | 'delete'
  | 'options' | 'head' | 'query' | 'match' | 'any'
  | 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';

export type LaravelRouteTargetMethodEvidence = Exclude<
  LaravelRouteMethodEvidence,
  'resource' | 'apiResource' | 'singleton' | 'apiSingleton' | 'match' | 'any'
>;

export type RouteDeclarationTokenEvidence = Readonly<{
  readonly type: string;
  readonly value: string;
  readonly line: number;
  readonly startOffset: number;
  readonly endOffset: number;
}>;

export type RouteDeclarationResourceActionFilterEvidence =
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'only'; readonly actions: readonly string[] }>
  | Readonly<{ readonly kind: 'except'; readonly actions: readonly string[] }>;

/** Resource modifiers preserved as source evidence before route semantic judgment. */
export type RouteDeclarationResourceEvidence = Readonly<{
  readonly actionFilter: RouteDeclarationResourceActionFilterEvidence;
  readonly shallow: boolean;
  readonly scoped: boolean;
  readonly creatable: boolean;
  readonly destroyable: boolean;
}>;

/** Closed target evidence: each target kind carries only fields valid for that kind. */
export type RouteDeclarationTargetEvidence =
  | Readonly<{ readonly kind: 'controller_action'; readonly controller: string; readonly action: string }>
  | Readonly<{ readonly kind: 'controller_invokable'; readonly controller: string }>
  | Readonly<{ readonly kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic }>
  | Readonly<{ readonly kind: 'unsupported'; readonly reason: string }>;

export type RouteDeclarationBindingEvidence = Readonly<{
  readonly parameter: string;
  readonly customKey: string | { readonly kind: 'absent' };
}>;

export type RouteDeclarationConstraintMethodEvidence =
  | 'where'
  | 'whereNumber'
  | 'whereAlpha'
  | 'whereAlphaNumeric'
  | 'whereUuid'
  | 'whereUlid'
  | 'whereIn';

export type RouteDeclarationConstraintArgumentEvidence =
  | Readonly<{ readonly kind: 'pattern'; readonly value: string }>
  | Readonly<{ readonly kind: 'values'; readonly values: readonly string[] }>
  | Readonly<{ readonly kind: 'none' }>;

export type RouteDeclarationConstraintEvidence = Readonly<{
  readonly method: RouteDeclarationConstraintMethodEvidence;
  readonly parameter: string;
  readonly argument: RouteDeclarationConstraintArgumentEvidence;
}>;

export type RouteDeclarationResourceMiddlewareEvidence = Readonly<{
  readonly middleware: readonly string[];
  readonly scope: Readonly<{
    readonly kind: 'all' | 'only' | 'except';
    readonly actions: readonly string[];
  }>;
}>;

/**
 * Layer-neutral route declaration evidence.
 * Scanner ASTs produce this contract; upstream consumers do not depend on concrete PHP AST types.
 */
export type RouteDeclarationEvidence = Readonly<{
  readonly method: LaravelRouteMethodEvidence;
  readonly targetMethods: readonly LaravelRouteTargetMethodEvidence[];
  readonly path: string;
  readonly resource: RouteDeclarationResourceEvidence;
  readonly target: RouteDeclarationTargetEvidence;
  readonly bindings: readonly RouteDeclarationBindingEvidence[];
  readonly prefix: readonly string[];
  readonly middleware: readonly string[];
  readonly routeMiddleware: readonly string[];
  readonly resourceMiddleware: readonly RouteDeclarationResourceMiddlewareEvidence[];
  readonly resourceMiddlewareExclusions: readonly RouteDeclarationResourceMiddlewareEvidence[];
  readonly groupNamePrefix: readonly string[];
  readonly groupController: string | { readonly kind: 'absent' };
  readonly groupDomain: string | { readonly kind: 'absent' };
  readonly groupBindingScope: 'default' | 'scoped' | 'without_scoped';
  readonly missingHandler: boolean;
  readonly withTrashed: boolean;
  readonly routeConstraints: readonly RouteDeclarationConstraintEvidence[];
  readonly groupConstraints: readonly RouteDeclarationConstraintEvidence[];
  readonly source: RouteDeclarationTokenEvidence;
  readonly end: RouteDeclarationTokenEvidence;
  readonly span: SourceSpan;
}>;
