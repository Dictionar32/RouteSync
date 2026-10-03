/**
 * Pure upstream semantic middleware resolver.
 *
 * This boundary deliberately receives ADTs only. PHP AST decoding and route
 * declaration extraction belong in the adapter immediately upstream.
 */
import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import { createMiddlewareName, stringValue } from '../../../../types/upstream/names';
import { middlewareReferenceKey } from './routeMiddlewareIdentity';
import { middlewareScopeApplicability } from './routeMiddlewareKnowledgeCatalog';
import { cardinalityOf } from '../../../../types/upstream/presence';
import type {
  RouteMiddlewareContract,
  RouteMiddlewareExclusionContract,
  RouteMiddlewareFlow,
  RouteMiddlewareReference,
  RouteMiddlewareScope,
} from '../../../../types/upstream/routeMiddleware';

export interface ControllerMiddlewareDeclaration {
  readonly middleware: MiddlewareName | RouteMiddlewareReference;
  readonly scope: RouteMiddlewareScope;
}

export interface ControllerMiddlewareExclusionDeclaration {
  readonly middleware: MiddlewareName | RouteMiddlewareReference;
  readonly scope: RouteMiddlewareScope;
}

export interface RouteMiddlewareSemanticInput {
  readonly action: import('../../../../types/upstream/presence').Presence<ActionName>;
  readonly groupMiddleware: readonly (MiddlewareName | RouteMiddlewareReference)[];
  readonly routeMiddleware: readonly (MiddlewareName | RouteMiddlewareReference)[];
  readonly classMiddleware: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareDeclaration)[]>;
  readonly methodMiddleware: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareDeclaration)[]>;
  readonly classExclusions: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[]>;
  readonly methodExclusions: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[]>;
}

export function resolveRouteMiddlewareFlow(
  input: RouteMiddlewareSemanticInput,
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

  appendControllerMiddleware(middleware, input.classMiddleware, 'controller_class');
  appendControllerMiddleware(middleware, input.methodMiddleware, 'controller_method');
  appendControllerExclusions(exclusions, input.classExclusions, 'controller_class');
  appendControllerExclusions(exclusions, input.methodExclusions, 'controller_method');

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
  action: import('../../../../types/upstream/presence').Presence<ActionName>,
): RouteMiddlewareContract[] {
  return middleware
    .filter(candidate => middlewareCandidateApplies(candidate, exclusions, action))
    .map(item => Object.freeze(item));
}

function scopeApplies(scope: RouteMiddlewareScope, action: import('../../../../types/upstream/presence').Presence<ActionName>): boolean {
  return middlewareScopeApplicability(scope, action);
}

function middlewareCandidateApplies(
  candidate: RouteMiddlewareContract,
  exclusions: readonly RouteMiddlewareExclusionContract[],
  action: import('../../../../types/upstream/presence').Presence<ActionName>,
): boolean {
  const applicable = scopeApplies(candidate.scope, action);
  const excluded = exclusions.some(exclusion =>
    scopeApplies(exclusion.scope, action) &&
    middlewareReferenceEquals(candidate.middleware, exclusion.middleware),
  );
  return applicable && !excluded;
}

function middlewareReferenceEquals(
  left: RouteMiddlewareReference,
  right: RouteMiddlewareReference,
): boolean {
  return middlewareReferenceKey(left) === middlewareReferenceKey(right);
}

export function normalizeMiddlewareReference(
  declaration: MiddlewareName | RouteMiddlewareReference,
): RouteMiddlewareReference {
  const declarationKind = Object.freeze({
    true: 'reference' as const,
    false: 'name' as const,
  })[String(typeof declaration === 'object' && 'name' in declaration) as 'true' | 'false'];
  const declarationHandlers = Object.freeze({
    reference: (value: RouteMiddlewareReference) => value,
    name: (value: MiddlewareName) => normalizeMiddlewareName(value),
  });
  return declarationHandlers[declarationKind](declaration as never);
}

function normalizeMiddlewareName(declaration: MiddlewareName): RouteMiddlewareReference {
  const [name, ...parameterGroups] = declaration.value.value.split(':');
  const parameterText = parameterGroups.join(':');
  const parameterParts = parameterText.split(',');
  const parameterHandlers = Object.freeze({
    empty: () => Object.freeze([] as const),
    non_empty: (value: readonly string[]) => Object.freeze(value.map(stringValue)),
  });

  return Object.freeze({
    name: createMiddlewareName(name),
    parameters: parameterHandlers[cardinalityOf(parameterGroups)](parameterParts),
  });
}

function normalizeControllerMiddlewareDeclaration(
  declaration: MiddlewareName | ControllerMiddlewareDeclaration,
): ControllerMiddlewareDeclaration {
  const kind = Object.freeze({
    true: 'declaration' as const,
    false: 'name' as const,
  })[String(typeof declaration === 'object' && 'middleware' in declaration) as 'true' | 'false'];
  const handlers = Object.freeze({
    declaration: (value: ControllerMiddlewareDeclaration) => value,
    name: (value: MiddlewareName) => Object.freeze({ middleware: value, scope: { kind: 'all' as const } }),
  });
  return handlers[kind](declaration as never);
}

function normalizeControllerMiddlewareExclusionDeclaration(
  declaration: MiddlewareName | ControllerMiddlewareExclusionDeclaration,
): ControllerMiddlewareExclusionDeclaration {
  const kind = Object.freeze({
    true: 'declaration' as const,
    false: 'name' as const,
  })[String(typeof declaration === 'object' && 'middleware' in declaration) as 'true' | 'false'];
  const handlers = Object.freeze({
    declaration: (value: ControllerMiddlewareExclusionDeclaration) => value,
    name: (value: MiddlewareName) => Object.freeze({ middleware: value, scope: { kind: 'all' as const } }),
  });
  return handlers[kind](declaration as never);
}

function appendControllerMiddleware(
  target: RouteMiddlewareContract[],
  declarations: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareDeclaration)[]>,
  source: 'controller_class' | 'controller_method',
): void {
  const handlers = Object.freeze({
    absent: (output: RouteMiddlewareContract[]) => output,
    present: (value: Extract<typeof declarations, { kind: 'present' }>) => {
      for (const declaration of value.value) {
        const item = normalizeControllerMiddlewareDeclaration(declaration);
        target.push(Object.freeze({
          middleware: normalizeMiddlewareReference(item.middleware),
          source: { kind: source },
          scope: item.scope,
        }));
      }
      return target;
    },
  });
  handlers[declarations.kind](declarations as never);
}

function appendControllerExclusions(
  target: RouteMiddlewareExclusionContract[],
  declarations: import('../../../../types/upstream/presence').Presence<readonly (MiddlewareName | ControllerMiddlewareExclusionDeclaration)[]>,
  source: 'controller_class' | 'controller_method',
): void {
  const handlers = Object.freeze({
    absent: (output: RouteMiddlewareExclusionContract[]) => output,
    present: (value: Extract<typeof declarations, { kind: 'present' }>) => {
      for (const declaration of value.value) {
        const item = normalizeControllerMiddlewareExclusionDeclaration(declaration);
        target.push(Object.freeze({
          middleware: normalizeMiddlewareReference(item.middleware),
          source: { kind: source },
          scope: item.scope,
        }));
      }
      return target;
    },
  });
  handlers[declarations.kind](declarations as never);
}

