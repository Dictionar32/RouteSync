/**
 * Canonical upstream semantic authority for route security capability.
 *
 * Middleware semantics are resolved once here. Downstream consumers receive
 * the closed result and must not classify middleware again.
 */
import type { TruthValue } from './valueObjects';
import { truthValue, numberValue, stringValue } from './valueObjects';
import { SecuritySchemeKind, RoutePolicyKind, createRouteSecurityDescriptor, type RouteSecurityDescriptor, type RoutePolicyDescriptor, type RouteRateLimit } from './route';
import type { RouteMiddleware } from './route';
import type { LaravelRouteAuthorizationSemanticJudgment } from './routeAuthorizationSemanticJudgmentInterface';
import type { MiddlewareName } from './names';
import { createAbilityName, createPropertyName, type GuardName, type AbilityName } from './names';

/** Complete, closed semantic result handed to runtime consumers.
 *
 * This is a judgment, not an intermediate candidate: all security, auth,
 * policy, and rate-limit fields have been resolved by the upstream authority.
 */
export interface RouteSecurityJudgment {
  readonly kind: 'route_security_judgment';
  readonly authority: 'upstream';
  readonly contractVersion: 'route_security.v2';
  readonly closed: true;
  readonly security: RouteSecurityDescriptor;
  readonly auth: TruthValue;
  readonly policies: Sequence<RoutePolicyDescriptor>;
  readonly rateLimit: RouteRateLimit;
}

/** Compatibility name retained for existing consumers; it denotes the full judgment. */
export type RouteSecurityResolution = RouteSecurityJudgment;

/** Typed request ADT for the route-security authority. Inputs travel as one contract value. */
export interface RouteSecurityAuthorityInput {
  readonly kind: 'route_security_authority_input';
  readonly middleware: RouteMiddlewares;
  readonly authorization: LaravelRouteAuthorizationSemanticJudgment;
}

/** Executable algebra: implementations must resolve the typed request, not reinterpret positional arguments. */
export interface RouteSecurityAuthorityAlgebraInterface {
  readonly resolve: (input: RouteSecurityAuthorityInput) => RouteSecurityResolution;
}

/** Closed upstream contract consumed by scanner/runtime adapters. */
export interface RouteSecurityAuthorityContractInterface extends RouteSecurityAuthorityAlgebraInterface {
  readonly authority: 'upstream';
  readonly contractVersion: 'route_security.v2';
  readonly closed: true;
}

export interface RouteSecurityAuthorityInterface extends RouteSecurityAuthorityContractInterface {}

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });
const sequenceSingleton = <T>(value: T): Sequence<T> => ({ kind: 'cons', head: value, tail: emptySequence<T>() });
const sequenceConcat = <T>(left: Sequence<T>, right: Sequence<T>): Sequence<T> =>
  relationVariantFold(left, 'cons', () => right, candidate => ({ kind: 'cons', head: candidate.head, tail: sequenceConcat(candidate.tail, right) }));
const sequenceFromArray = <T>(items: readonly T[]): Sequence<T> =>
  relationFoldRight(items, emptySequence<T>(), (item, tail) => ({ kind: 'cons', head: item, tail }));
const sequenceMapText = <U>(items: readonly string[], project: (item: string) => U): Sequence<U> =>
  relationFoldRight(items, emptySequence<U>(), (item, tail) => ({ kind: 'cons', head: project(item), tail }));
const guardName = (value: string): GuardName => Object.freeze({ kind: 'guard_name', value: stringValue.create(value) });
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
  const abilityPrefix = relationAny([relationTextStartsWith(lower, 'ability:'), relationTextStartsWith(lower, 'abilities:')]);
  const rolePrefix = relationAny([relationTextStartsWith(lower, 'role:'), relationTextStartsWith(lower, 'roles:')]);
  const admin = relationAny([relationEqual(lower, 'admin'), relationEqual(lower, 'superadmin')]);
  const colon = relationTextFind(trimmed, ':');
  const payload = relationGate(relationEqual(colon, -1), () => trimmed, () => relationTextSlice(trimmed, colon + 1));
  const abilityItems = relationTextFields(payload, ',');
  const normalizedAbilities = sequenceMapText(abilityItems, item => abilityName(relationNormalizeWhitespace(item)));
  const normalizedRoles = sequenceMapText(abilityItems, item => abilityName(`role:${relationNormalizeWhitespace(item)}`));
  return relationGate(
    abilityPrefix,
    () => Object.freeze({ ...state, abilities: sequenceConcat(state.abilities, normalizedAbilities) }),
    () => relationGate(
      rolePrefix,
      () => Object.freeze({ ...state, abilities: sequenceConcat(state.abilities, normalizedRoles) }),
      () => relationGate(admin, () => Object.freeze({ ...state, abilities: sequenceConcat(state.abilities, sequenceSingleton(abilityName(`role:${lower}`))) }), () => state),
    ),
  );
};

/** Authentication classification consumes only the canonical upstream judgment's evidence. */
const authorizationSecurityState = (state: SecurityClassificationState, middleware: MiddlewareName): SecurityClassificationState => {
  const lower = relationTextLower(relationNormalizeWhitespace(middleware.value.value));
  const authSanctum = relationEqual(lower, 'auth:sanctum');
  const authBearer = relationAny([relationEqual(lower, 'auth:api'), relationEqual(lower, 'auth:bearer')]);
  return relationGate(
    authSanctum,
    () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Sanctum, guards: sequenceConcat(state.guards, sequenceSingleton(guardName('sanctum'))) }),
    () => relationGate(
      authBearer,
      () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Bearer, guards: sequenceConcat(state.guards, sequenceSingleton(guardName('api'))) }),
      () => Object.freeze({ ...state, isProtected: truthValue(true), scheme: SecuritySchemeKind.Cookie, guards: sequenceConcat(state.guards, sequenceSingleton(guardName('web'))) }),
    ),
  );
};

const classifySecurity = (middleware: RouteMiddlewares, authorization: LaravelRouteAuthorizationSemanticJudgment): RouteSecurityDescriptor => {
  const classifySequence = (items: Sequence<RouteMiddleware>, state: SecurityClassificationState): SecurityClassificationState =>
    relationVariantFold(items, 'cons', () => state, candidate => classifySequence(candidate.tail, middlewareSecurityState(state, candidate.head)));
  const middlewareState = classifySequence(middleware.items, initialSecurityClassificationState);
  const state = relationVariantFold(
    authorization,
    'laravel_route_authorization_middleware_present',
    judgment => relationFoldRight(judgment.middleware, middlewareState, (evidence, current) => authorizationSecurityState(current, evidence)),
    () => middlewareState,
  );
  return createRouteSecurityDescriptor(state.isProtected, state.scheme, state.guards, state.abilities);
};

const gatePolicy = (ability: string): RoutePolicyDescriptor => Object.freeze({ ability: abilityName(ability), modelParameter: { kind: 'none' }, kind: RoutePolicyKind.Gate });
const abilityPolicy = (ability: string, modelParameter: string): RoutePolicyDescriptor => Object.freeze({ ability: abilityName(ability), modelParameter: createPropertyName(modelParameter), kind: RoutePolicyKind.AbilityModel });

const policyForMiddleware = (middleware: string): Readonly<{ policies: Sequence<RoutePolicyDescriptor>; rateLimit: RouteRateLimit }> => {
  const trimmed = relationNormalizeWhitespace(middleware);
  const can = relationGate(relationEqual(relationTextStartsWith(trimmed, 'can:'), true), () => relationTextSlice(trimmed, 4), () => '');
  const role = relationGate(relationEqual(relationTextStartsWith(trimmed, 'role:'), true), () => relationTextSlice(trimmed, 5), () => '');
  const admin = relationAny([relationEqual(trimmed, 'admin'), relationEqual(trimmed, 'superadmin')]);
  const throttle = relationGate(relationTextStartsWith(relationTextLower(trimmed), 'throttle:'), () => relationTextSlice(trimmed, 9), () => '');
  const canParts = relationTextFields(can, ',');
  const canPart = (index: number): string => relationOptionFold(relationAt(canParts, index), () => '', value => value);
  const ability = relationNormalizeWhitespace(canPart(0));
  const modelParameter = relationNormalizeWhitespace(canPart(1));
  const canPolicy = relationGate(relationAll([can.length > 0, ability.length > 0]), () => sequenceSingleton(relationGate(modelParameter.length > 0, () => abilityPolicy(ability, modelParameter), () => gatePolicy(ability))), () => emptySequence<RoutePolicyDescriptor>());
  const rolePolicies = relationGate(role.length > 0, () => sequenceFromArray(relationProject(relationProject(relationTextFields(role, ','), value => relationNormalizeWhitespace(value)), value => gatePolicy(`role:${value}`))), () => emptySequence<RoutePolicyDescriptor>());
  const adminPolicy = relationGate(admin, () => sequenceSingleton(gatePolicy(`role:${trimmed}`)), () => emptySequence<RoutePolicyDescriptor>());
  const throttleValue = relationTextFields(throttle, ',');
  const throttlePart = (index: number, fallback: string): string => relationOptionFold(relationAt(throttleValue, index), () => fallback, value => value);
  const maxAttempts = numberValue(relationTextNumber(throttlePart(0, ''), 0));
  const decayMinutes = numberValue(relationTextNumber(throttlePart(1, '1'), 1));
  const rateLimit = relationGate(relationAll([throttle.length > 0, relationEqual(relationTextNumber(throttlePart(0, ''), -1) >= 0, true)]), () => Object.freeze({ kind: 'fixed' as const, limit: Object.freeze({ kind: 'fixed' as const, maxAttempts, decayMinutes }) }), () => ({ kind: 'none' as const }));
  return Object.freeze({ policies: sequenceConcat(sequenceConcat(canPolicy, rolePolicies), adminPolicy), rateLimit });
};

const middlewareValues = (items: Sequence<RouteMiddleware>, output: readonly string[] = []): readonly string[] =>
  relationVariantFold(items, 'cons', () => output, candidate => middlewareValues(candidate.tail, [...output, candidate.head.name.value.value]));

const resolveRouteSecurity = (input: RouteSecurityAuthorityInput): RouteSecurityResolution => {
  const middleware = input.middleware;
  const authorizationProtected = relationEqual(input.authorization.kind, 'laravel_route_authorization_middleware_present');
  const security = classifySecurity(middleware, input.authorization);
  const values = middlewareValues(middleware.items);
  const resolved = values.reduce((acc, value) => {
    const current = policyForMiddleware(value);
    return Object.freeze({
      policies: sequenceConcat(acc.policies, current.policies),
      rateLimit: current.rateLimit.kind !== 'none' ? current.rateLimit : acc.rateLimit,
    });
  }, { policies: emptySequence<RoutePolicyDescriptor>(), rateLimit: { kind: 'none' as const } });
  return Object.freeze({
    kind: 'route_security_judgment' as const,
    authority: 'upstream' as const,
    contractVersion: 'route_security.v2' as const,
    closed: true as const,
    security,
    auth: truthValue(relationAny([authorizationProtected, security.isProtected.value])),
    policies: resolved.policies,
    rateLimit: resolved.rateLimit,
  });
};

/**
 * Compose authority metadata around the canonical security reasoning algebra.
 * Runtime consumers execute this contract; the wrapper does not classify middleware.
 */
export interface RouteSecurityAuthorityFactoryInterface {
  readonly kind: 'route_security_authority_factory';
  readonly contractVersion: 'route_security.v2';
  readonly create: (
    algebra: RouteSecurityAuthorityAlgebraInterface,
  ) => RouteSecurityAuthorityInterface;
}

const createRouteSecurityAuthorityImpl = (
  algebra: RouteSecurityAuthorityAlgebraInterface,
): RouteSecurityAuthorityInterface => Object.freeze({
  authority: 'upstream' as const,
  contractVersion: 'route_security.v2' as const,
  closed: true as const,
  resolve: (input: RouteSecurityAuthorityInput): RouteSecurityResolution => algebra.resolve(input),
});

/** Canonical production algebra; security and policy reasoning lives here. */
export const routeSecurityAuthorityAlgebra: RouteSecurityAuthorityAlgebraInterface = Object.freeze({
  resolve: resolveRouteSecurity,
});

/** Factory is an explicit runtime operation contract, not a standalone exported function. */
export const routeSecurityAuthorityFactory: RouteSecurityAuthorityFactoryInterface = Object.freeze({
  kind: 'route_security_authority_factory',
  contractVersion: 'route_security.v2',
  create: createRouteSecurityAuthorityImpl,
});

/** Runtime-facing closed authority, bound once to the canonical algebra. */
export const routeSecurityAuthority: RouteSecurityAuthorityInterface =
  routeSecurityAuthorityFactory.create(routeSecurityAuthorityAlgebra);
