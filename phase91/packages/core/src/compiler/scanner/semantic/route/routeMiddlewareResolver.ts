/**
 * Pure upstream semantic middleware resolver.
 *
 * This boundary deliberately receives ADTs only. PHP AST decoding and route
 * declaration extraction belong in the adapter immediately upstream.
 */
import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import { createMiddlewareName, stringValue } from '../../../../types/upstream/names';
import type {
  RouteMiddlewareContract,
  RouteMiddlewareExclusionContract,
  RouteMiddlewareFlow,
  RouteMiddlewareReference,
  RouteMiddlewareScope,
} from '../../../../types/upstream/routeMiddleware';

export interface ControllerMiddlewareDeclaration {
  readonly middleware: MiddlewareName | RouteMiddlewareReference;
  readonly only?: readonly ActionName[];
  readonly except?: readonly ActionName[];
}

export interface ControllerMiddlewareExclusionDeclaration {
  readonly middleware: MiddlewareName | RouteMiddlewareReference;
  readonly only?: readonly ActionName[];
  readonly except?: readonly ActionName[];
}

export interface RouteMiddlewareSemanticInput {
  /** Concrete route action used to apply controller only/except scopes upstream. */
  readonly action?: ActionName;
  readonly groupMiddleware: readonly (MiddlewareName | RouteMiddlewareReference)[];
  readonly routeMiddleware: readonly (MiddlewareName | RouteMiddlewareReference)[];
  readonly classMiddleware?: readonly (MiddlewareName | ControllerMiddlewareDeclaration)[];
  readonly methodMiddleware?: readonly (MiddlewareName | ControllerMiddlewareDeclaration)[];
  readonly classExclusions?: readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[];
  readonly methodExclusions?: readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[];
}

const emptyRouteMiddlewareInput: RouteMiddlewareSemanticInput = {
  groupMiddleware: [],
  routeMiddleware: [],
};

export function resolveRouteMiddlewareFlow(
  input: RouteMiddlewareSemanticInput = emptyRouteMiddlewareInput,
): RouteMiddlewareFlow {
  const middleware: RouteMiddlewareContract[] = [];
  const exclusions: RouteMiddlewareExclusionContract[] = [];

  for (const declaration of input.groupMiddleware) {
    middleware.push(Object.freeze({
      middleware: normalizeMiddlewareReference(declaration),
      source: { kind: 'route_group' as const },
      scope: { kind: 'all' as const },
    }));
  }

  for (const declaration of input.routeMiddleware) {
    middleware.push(Object.freeze({
      middleware: normalizeMiddlewareReference(declaration),
      source: { kind: 'route' as const },
      scope: { kind: 'all' as const },
    }));
  }

  appendControllerMiddleware(middleware, input.classMiddleware ?? [], 'controller_class');
  appendControllerMiddleware(middleware, input.methodMiddleware ?? [], 'controller_method');
  appendControllerExclusions(exclusions, input.classExclusions ?? [], 'controller_class');
  appendControllerExclusions(exclusions, input.methodExclusions ?? [], 'controller_method');

  const effectiveMiddleware = resolveEffectiveMiddleware(
    middleware,
    exclusions,
    input.action,
  );

  return Object.freeze({
    kind: 'route_middleware_flow' as const,
    middleware: Object.freeze(middleware),
    exclusions: Object.freeze(exclusions),
    effectiveMiddleware: Object.freeze(effectiveMiddleware),
  });
}

function resolveEffectiveMiddleware(
  middleware: readonly RouteMiddlewareContract[],
  exclusions: readonly RouteMiddlewareExclusionContract[],
  action?: ActionName,
): RouteMiddlewareContract[] {
  return middleware.filter((candidate) => {
    if (!scopeApplies(candidate.scope, action)) return false;

    return !exclusions.some((exclusion) =>
      scopeApplies(exclusion.scope, action) &&
      middlewareReferenceEquals(candidate.middleware, exclusion.middleware),
    );
  }).map((item) => Object.freeze(item));
}

function scopeApplies(
  scope: RouteMiddlewareScope,
  action?: ActionName,
): boolean {
  if (scope.kind === 'all') return true;
  if (!action) return false;

  const actionName = action.value.value;
  if (scope.kind === 'only') {
    return scope.actions.some(item => item.value.value === actionName);
  }

  return !scope.actions.some(item => item.value.value === actionName);
}

function middlewareReferenceEquals(
  left: RouteMiddlewareReference,
  right: RouteMiddlewareReference,
): boolean {
  if (left.name.value.value !== right.name.value.value) return false;
  if (left.parameters.length !== right.parameters.length) return false;

  return left.parameters.every(
    (parameter, index) => parameter.value === right.parameters[index]?.value,
  );
}

export function normalizeMiddlewareReference(
  declaration: MiddlewareName | RouteMiddlewareReference,
): RouteMiddlewareReference {
  if (typeof declaration === 'object' && 'name' in declaration) return declaration;

  const raw = declaration.value.value;
  const separator = raw.indexOf(':');
  if (separator < 0) {
    return Object.freeze({
      name: declaration,
      parameters: Object.freeze([]),
    });
  }

  const name = raw.slice(0, separator);
  const parameters = raw
    .slice(separator + 1)
    .split(',')
    .map(value => stringValue(value));

  return Object.freeze({
    name: createMiddlewareName(name),
    parameters: Object.freeze(parameters),
  });
}

function appendControllerMiddleware(
  target: RouteMiddlewareContract[],
  declarations: readonly (MiddlewareName | ControllerMiddlewareDeclaration)[],
  source: 'controller_class' | 'controller_method',
): void {
  for (const declaration of declarations) {
    const item = typeof declaration === 'object' && 'middleware' in declaration
      ? declaration
      : { middleware: declaration };

    target.push(Object.freeze({
      middleware: normalizeMiddlewareReference(item.middleware),
      source: { kind: source },
      scope: middlewareScope(item),
    }));
  }
}

function appendControllerExclusions(
  target: RouteMiddlewareExclusionContract[],
  declarations: readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[],
  source: 'controller_class' | 'controller_method',
): void {
  for (const declaration of declarations) {
    const item = typeof declaration === 'object' && 'middleware' in declaration
      ? declaration
      : { middleware: declaration };

    target.push(Object.freeze({
      middleware: normalizeMiddlewareReference(item.middleware),
      source: { kind: source },
      scope: middlewareScope(item),
    }));
  }
}

function middlewareScope(
  declaration: { readonly only?: readonly ActionName[]; readonly except?: readonly ActionName[] },
): RouteMiddlewareScope {
  if (declaration.only?.length) {
    return Object.freeze({ kind: 'only' as const, actions: Object.freeze([...declaration.only]) });
  }
  if (declaration.except?.length) {
    return Object.freeze({ kind: 'except' as const, actions: Object.freeze([...declaration.except]) });
  }
  return Object.freeze({ kind: 'all' as const });
}
