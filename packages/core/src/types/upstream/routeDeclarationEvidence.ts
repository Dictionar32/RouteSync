import type { SourceSpan } from './provenance';

/**
 * Layer-neutral route declaration evidence.
 *
 * Scanner ASTs are producers of this evidence; upstream owns only the semantic
 * shape needed by route construction and preservation. Concrete PHP AST types
 * must not become dependencies of the upstream contract layer.
 */
export type RouteDeclarationTokenEvidence = Readonly<{
  readonly type: string;
  readonly value: string;
  readonly line: number;
  readonly startOffset: number;
  readonly endOffset: number;
}>;

export type RouteDeclarationTargetEvidence = Readonly<{
  readonly kind: 'controller_action' | 'controller_invokable' | 'closure' | 'unsupported';
  readonly controller?: string;
  readonly action?: string;
  readonly returns?: readonly unknown[];
  readonly reason?: string;
}>;

export type RouteDeclarationConstraintEvidence = Readonly<{
  readonly method: string;
  readonly parameter: string;
  readonly argument: unknown;
}>;

export type RouteDeclarationEvidence = Readonly<{
  readonly method: string;
  readonly targetMethods: readonly string[];
  readonly path: string;
  readonly target: RouteDeclarationTargetEvidence;
  readonly bindings: readonly unknown[];
  readonly prefix: readonly string[];
  readonly middleware: readonly string[];
  readonly routeMiddleware: readonly string[];
  readonly resourceMiddleware: readonly { readonly middleware: readonly string[]; readonly scope: { readonly kind: 'all' | 'only' | 'except'; readonly actions: readonly string[] } }[];
  readonly resourceMiddlewareExclusions: readonly { readonly middleware: readonly string[]; readonly scope: { readonly kind: 'all' | 'only' | 'except'; readonly actions: readonly string[] } }[];
  readonly groupNamePrefix: readonly string[];
  readonly groupController?: string;
  readonly groupDomain?: string;
  readonly groupBindingScope: 'default' | 'scoped' | 'without_scoped';
  readonly missingHandler: boolean;
  readonly withTrashed: boolean;
  readonly routeConstraints: readonly RouteDeclarationConstraintEvidence[];
  readonly groupConstraints: readonly RouteDeclarationConstraintEvidence[];
  readonly source: RouteDeclarationTokenEvidence;
  readonly end: RouteDeclarationTokenEvidence;
  readonly span?: SourceSpan;
}>;
