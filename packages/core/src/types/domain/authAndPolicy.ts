import { SemanticValueFactory } from "./semanticValues";
import type { TruthValue } from "../upstream/valueObjects";
import { truthValue, stringValue } from "../upstream/valueObjects";
import {
  SecuritySchemeKind,
  RoutePolicyKind,
  type RouteSecurityDescriptor,
  type RoutePolicyDescriptor,
} from "../upstream/route";
import type { RouteMiddlewares } from "../upstream/collections";
import { routeSecurityAuthority } from "../upstream/routeSecurityAuthority";
import { createAbilityName } from "../upstream/names";

export { SecuritySchemeKind, RoutePolicyKind, createRouteSecurityDescriptor } from "../upstream/route";
export type { RouteSecurityDescriptor, RoutePolicyDescriptor } from "../upstream/route";

/**
 * Compatibility facade. Security reasoning is owned by the upstream authority;
 * this domain-facing class only projects its already-closed security descriptor.
 */
export class RouteSecurityClassifier {
  public static classify(middleware: RouteMiddlewares): RouteSecurityDescriptor {
    return routeSecurityAuthority.resolve({ kind: 'route_security_authority_input', middleware, authorization: { kind: 'laravel_route_authorization_middleware_absent', middleware: Object.freeze([]) } }).security;
  }
}

export type AuthorizationHeaderName =
  | { readonly kind: 'authorization'; readonly value: 'Authorization' }
  | { readonly kind: 'none' };

export interface SecuritySchemeSpecification<K extends SecuritySchemeKind = SecuritySchemeKind> {
  readonly scheme: K;
  readonly isProtected: boolean;
  readonly requiresAuthorizationHeader: boolean;
  readonly defaultHeaderName: AuthorizationHeaderName;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SecuritySchemeKind.
 */
export type SecuritySchemeRegistry = {
  readonly [K in SecuritySchemeKind]: SecuritySchemeSpecification<K>;
};

export const SECURITY_SCHEME_REGISTRY: SecuritySchemeRegistry = Object.freeze({
  [SecuritySchemeKind.Sanctum]: {
    scheme: SecuritySchemeKind.Sanctum,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: { kind: 'authorization', value: 'Authorization' },
  },
  [SecuritySchemeKind.Bearer]: {
    scheme: SecuritySchemeKind.Bearer,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: { kind: 'authorization', value: 'Authorization' },
  },
  [SecuritySchemeKind.Cookie]: {
    scheme: SecuritySchemeKind.Cookie,
    isProtected: true,
    requiresAuthorizationHeader: false,
    defaultHeaderName: { kind: 'none' },
  },
  [SecuritySchemeKind.Public]: {
    scheme: SecuritySchemeKind.Public,
    isProtected: false,
    requiresAuthorizationHeader: false,
    defaultHeaderName: { kind: 'none' },
  },
});

export interface RouteSecurityVisitor<R> {
  readonly sanctum: (security: RouteSecurityDescriptor) => R;
  readonly bearer: (security: RouteSecurityDescriptor) => R;
  readonly cookie: (security: RouteSecurityDescriptor) => R;
  readonly public: (security: RouteSecurityDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik skema keamanan RouteSecurityDescriptor dengan exhaustive type safety
 */
export function matchRouteSecurity<R>(
  security: RouteSecurityDescriptor,
  visitor: RouteSecurityVisitor<R>
): R {
  return visitor[security.scheme](security);
}


/**
 * RateLimitDescriptor
 *
 * Explicit Domain Model for Laravel Route Rate Limiting (throttle middleware).
 */
export interface RateLimitDescriptor {
  readonly maxAttempts: number;
  readonly decayMinutes: number;
}


/**
 * Route policy registry is metadata over the canonical upstream policy ADT.
 */
export interface RoutePolicyKindSpecification<K extends RoutePolicyKind = RoutePolicyKind> {
  readonly kind: K;
  readonly requiresModel: TruthValue;
  readonly description: import("../upstream/valueObjects").StringValue;
}

export type RoutePolicyKindRegistry = {
  readonly [K in RoutePolicyKind]: RoutePolicyKindSpecification<K>;
};

export const ROUTE_POLICY_REGISTRY: RoutePolicyKindRegistry = Object.freeze({
  [RoutePolicyKind.AbilityModel]: {
    kind: RoutePolicyKind.AbilityModel,
    requiresModel: truthValue(true),
    description: stringValue.create('Laravel Model Policy checking ability against a model parameter')
  },
  [RoutePolicyKind.Gate]: {
    kind: RoutePolicyKind.Gate,
    requiresModel: truthValue(false),
    description: stringValue.create('Laravel Gate authorization checking ability without model parameter')
  },
  [RoutePolicyKind.Custom]: {
    kind: RoutePolicyKind.Custom,
    requiresModel: truthValue(false),
    description: stringValue.create('Custom authorization policy or middleware rule')
  }
});

export const createRoutePolicyAbilityModel = (ability: string, modelParameter: string): RoutePolicyDescriptor => Object.freeze({ kind: RoutePolicyKind.AbilityModel, ability: createAbilityName(ability), modelParameter: SemanticValueFactory.propertyName(modelParameter) });
export const createRoutePolicyGate = (ability: string): RoutePolicyDescriptor => Object.freeze({ kind: RoutePolicyKind.Gate, ability: createAbilityName(ability), modelParameter: { kind: 'none' as const } });
export const createRoutePolicyCustom = (ability: string, modelParameter?: string): RoutePolicyDescriptor => {
  const model = relationGate(typeof modelParameter === 'string', () => ({ kind: 'parameter' as const, name: SemanticValueFactory.propertyName(modelParameter as string) }), () => ({ kind: 'none' as const }));
  return Object.freeze({ kind: RoutePolicyKind.Custom, ability: createAbilityName(ability), modelParameter: model });
};
export const createRoutePolicy = (input: { readonly ability: string; readonly modelParameter?: string; readonly kind?: RoutePolicyKind }): RoutePolicyDescriptor => {
  const kind = relationGate(Object.prototype.hasOwnProperty.call(input, 'kind'), () => input.kind as RoutePolicyKind, () => RoutePolicyKind.Gate);
  const variants = {
    [RoutePolicyKind.AbilityModel]: () => relationGate(typeof input.modelParameter === 'string', () => createRoutePolicyAbilityModel(input.ability, input.modelParameter as string), () => createRoutePolicyGate(input.ability)),
    [RoutePolicyKind.Gate]: () => createRoutePolicyGate(input.ability),
    [RoutePolicyKind.Custom]: () => createRoutePolicyCustom(input.ability, input.modelParameter)
  };
  return variants[kind]();
};
export const createRateLimit = (maxAttempts: number, decayMinutes: number = 1): RateLimitDescriptor => Object.freeze({ maxAttempts, decayMinutes });
export const noRateLimit = (): RateLimitDescriptor => Object.freeze({ maxAttempts: 0, decayMinutes: 0 });

export interface RoutePolicyVisitor<R> {
  readonly ability_model: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.AbilityModel }>) => R;
  readonly gate: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.Gate }>) => R;
  readonly custom: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.Custom }>) => R;
}

export function matchRoutePolicy<R>(policy: RoutePolicyDescriptor, visitor: RoutePolicyVisitor<R>): R {
  return visitor[policy.kind](policy as never);
}
