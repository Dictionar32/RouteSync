import type { CrudRole } from "./lifecycle";
import { SemanticValueFactory } from "./semanticValues";
import { relationGate, relationFoldRight, relationVariantFold, relationTextFind, relationTextFields, relationTextLower, relationTextSlice, relationTextStartsWith } from "../../semantic/kernel/relationalSequence";
import { relationAny, relationEqual, relationNormalizeWhitespace } from "../../semantic/kernel/semanticRelations";
import type { TruthValue } from "../upstream/valueObjects";
import { truthValue, stringValue } from "../upstream/valueObjects";
import {
  SecuritySchemeKind,
  RoutePolicyKind,
  createRouteSecurityDescriptor,
  type RouteSecurityDescriptor,
  type RoutePolicyDescriptor,
} from "../upstream/route";
import type { RouteMiddlewares, Sequence } from "../upstream/collections";
import type { RouteMiddleware } from "../upstream/route";
import { createAbilityName, type GuardName, type AbilityName } from "../upstream/names";

export { SecuritySchemeKind, RoutePolicyKind, createRouteSecurityDescriptor } from "../upstream/route";
export type { RouteSecurityDescriptor, RoutePolicyDescriptor } from "../upstream/route";

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });


const sequenceAppend = <T>(sequence: Sequence<T>, item: T): Sequence<T> =>
  relationVariantFold(sequence, 'cons', () => ({ kind: 'cons', head: item, tail: emptySequence<T>() }), candidate => ({ kind: 'cons', head: candidate.head, tail: sequenceAppend(candidate.tail, item) }));


const sequenceMapText = <U>(items: readonly string[], project: (item: string) => U): Sequence<U> =>
  relationFoldRight(items, emptySequence<U>(), (item, tail) => ({ kind: 'cons', head: project(item), tail }));

const guardName = (value: string): GuardName => Object.freeze({ kind: 'guard_name', value: stringValue(value) });
const abilityName = (value: string): AbilityName => createAbilityName(value);

interface SecurityClassificationState {
  readonly isProtected: TruthValue;
  readonly scheme: SecuritySchemeKind;
  readonly guards: Sequence<GuardName>;
  readonly abilities: Sequence<AbilityName>;
}

const initialSecurityClassificationState: SecurityClassificationState = Object.freeze({
  isProtected: truthValue(false),
  scheme: SecuritySchemeKind.Public,
  guards: emptySequence<GuardName>(),
  abilities: emptySequence<AbilityName>(),
});

const middlewareSecurityState = (state: SecurityClassificationState, middleware: RouteMiddleware): SecurityClassificationState => {
  const trimmed = relationNormalizeWhitespace(middleware.name.value.value);
  const lower = relationTextLower(trimmed);
  const authSanctum = relationEqual(lower, 'auth:sanctum');
  const authBearer = relationAny([relationEqual(lower, 'auth:api'), relationEqual(lower, 'auth:bearer')]);
  const authCookie = relationAny([relationEqual(lower, 'auth'), relationTextStartsWith(lower, 'auth:')]);
  const abilityPrefix = relationAny([relationTextStartsWith(lower, 'ability:'), relationTextStartsWith(lower, 'abilities:')]);
  const rolePrefix = relationAny([relationTextStartsWith(lower, 'role:'), relationTextStartsWith(lower, 'roles:')]);
  const admin = relationAny([relationEqual(lower, 'admin'), relationEqual(lower, 'superadmin')]);
  const colon = relationTextFind(trimmed, ':');
  const payload = relationGate(relationEqual(colon, -1), () => trimmed, () => relationTextSlice(trimmed, colon + 1));
  const abilityItems = relationTextFields(payload, ',');
  const normalizedAbilities = sequenceMapText(abilityItems, item => abilityName(relationNormalizeWhitespace(item)));
  const normalizedRoles = sequenceMapText(abilityItems, item => abilityName(`role:${relationNormalizeWhitespace(item)}`));
  const authState = relationGate(
    authSanctum,
    () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Sanctum, guards: sequenceAppend(state.guards, guardName('sanctum')) }),
    () => relationGate(
      authBearer,
      () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Bearer, guards: sequenceAppend(state.guards, guardName('api')) }),
      () => relationGate(
        authCookie,
        () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Cookie, guards: sequenceAppend(state.guards, guardName('web')) }),
        () => relationGate(
          abilityPrefix,
          () => Object.freeze({ ...state, abilities: sequenceConcat(state.abilities, normalizedAbilities) }),
          () => relationGate(
            rolePrefix,
            () => Object.freeze({ ...state, abilities: sequenceConcat(state.abilities, normalizedRoles) }),
            () => relationGate(admin, () => Object.freeze({ ...state, abilities: sequenceAppend(state.abilities, abilityName(`role:${lower}`)) }), () => state),
          ),
        ),
      ),
    ),
  );
  return authState;
};

const sequenceConcat = <T>(left: Sequence<T>, right: Sequence<T>): Sequence<T> =>
  relationVariantFold(left, 'cons', () => right, candidate => ({ kind: 'cons', head: candidate.head, tail: sequenceConcat(candidate.tail, right) }));

export class RouteSecurityClassifier {
  public static classify(middleware: RouteMiddlewares): RouteSecurityDescriptor {
    const classifySequence = (items: Sequence<RouteMiddleware>, state: SecurityClassificationState): SecurityClassificationState =>
      relationVariantFold(items, 'cons', () => state, candidate => classifySequence(candidate.tail, middlewareSecurityState(state, candidate.head)));
    const state = classifySequence(middleware.items, initialSecurityClassificationState);
    return createRouteSecurityDescriptor(state.isProtected, state.scheme, state.guards, state.abilities);
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
    description: stringValue('Laravel Model Policy checking ability against a model parameter')
  },
  [RoutePolicyKind.Gate]: {
    kind: RoutePolicyKind.Gate,
    requiresModel: truthValue(false),
    description: stringValue('Laravel Gate authorization checking ability without model parameter')
  },
  [RoutePolicyKind.Custom]: {
    kind: RoutePolicyKind.Custom,
    requiresModel: truthValue(false),
    description: stringValue('Custom authorization policy or middleware rule')
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
