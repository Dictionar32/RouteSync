import {
    relationAll,
    relationAny,
    relationEqual,
    relationNotEqual,
    relationGate,
    relationNormalizeWhitespace,
} from '../../../semantic/kernel/semanticRelations';
import { relationProject, relationTextSlice, relationTextStartsWith, relationTextLower, relationTextFields, relationAt, relationTextNumber, relationOptionFold } from '../../../semantic/kernel/relationalSequence';

import {
    RouteSecurityDescriptor,
    RouteSecurityClassifier,
    RoutePolicyDescriptor,
    RoutePolicyKind
} from "../../../types/route";
import type { RouteRateLimit } from "../../../types/upstream/route";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import type { PropertyName } from "../../../types/upstream/names";

export interface RouteSecurityResolution {
    readonly security: RouteSecurityDescriptor;
    readonly auth: boolean;
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RouteRateLimit;
}

type MiddlewarePolicyResult = Readonly<{
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RouteRateLimit;
}>;

const gatePolicy = (ability: string): RoutePolicyDescriptor => Object.freeze({
    ability: SemanticValueFactory.abilityName(ability),
    modelParameter: { kind: 'none' as const },
    kind: RoutePolicyKind.Gate,
});

const abilityPolicy = (ability: string, modelParameter: string): RoutePolicyDescriptor => Object.freeze({
    ability: SemanticValueFactory.abilityName(ability),
    modelParameter: SemanticValueFactory.propertyName(modelParameter),
    kind: RoutePolicyKind.AbilityModel,
});

const policyForMiddleware = (middleware: string): MiddlewarePolicyResult => {
    const trimmed = relationNormalizeWhitespace(middleware);
    const can = relationGate(relationEqual(relationTextStartsWith(trimmed, "can:"), true), () => relationTextSlice(trimmed, 4), () => '');
    const role = relationGate(relationEqual(relationTextStartsWith(trimmed, "role:"), true), () => relationTextSlice(trimmed, 5), () => '');
    const admin = relationAny([relationEqual(trimmed, "admin"), relationEqual(trimmed, "superadmin")]);
    const throttle = relationGate(relationTextStartsWith(relationTextLower(trimmed), "throttle:"), () => relationTextSlice(trimmed, 9), () => '');

    const canParts = relationTextFields(can, ",");
    const canPart = (index: number): string =>
        relationOptionFold(relationAt(canParts, index), () => '', value => value);
    const ability = relationNormalizeWhitespace(canPart(0));
    const modelParameter = relationNormalizeWhitespace(canPart(1));

    const canPolicy = relationGate(
        relationAll([can.length > 0, ability.length > 0]),
        () => [relationGate(modelParameter.length > 0, () => abilityPolicy(ability, modelParameter), () => gatePolicy(ability))],
        () => [],
    );

    const rolePolicies = relationGate(
        role.length > 0,
        () => relationProject(
            relationProject(relationTextFields(role, ","), value => relationNormalizeWhitespace(value)),
            value => gatePolicy(`role:${value}`),
        ),
        () => [],
    );

    const adminPolicy = relationGate(admin, () => [gatePolicy(`role:${trimmed}`)], () => []);

    const throttleValue = relationTextFields(throttle, ",");
    const throttlePart = (index: number, fallback: string): string =>
        relationOptionFold(relationAt(throttleValue, index), () => fallback, value => value);
    const maxAttempts = relationTextNumber(throttlePart(0, ''), 0);
    const decayMinutes = relationTextNumber(throttlePart(1, '1'), 1);
    const rateLimit = relationGate(
        relationAll([throttle.length > 0, relationEqual(relationTextNumber(throttlePart(0, ''), -1) >= 0, true)]),
        () => Object.freeze({ kind: 'fixed' as const, limit: Object.freeze({ kind: 'fixed' as const, maxAttempts, decayMinutes }) }),
        () => ({ kind: 'none' as const }),
    );

    return Object.freeze({
        policies: Object.freeze([...canPolicy, ...rolePolicies, ...adminPolicy]),
        rateLimit,
    });
};

const resolveMiddleware = (
    middleware: readonly string[],
    index = 0,
    policies: readonly RoutePolicyDescriptor[] = [],
    rateLimit: RouteRateLimit = { kind: 'none' },
): MiddlewarePolicyResult =>
    relationGate(
        index >= middleware.length,
        () => Object.freeze({ policies: Object.freeze(policies), rateLimit }),
        () => {
            const current = policyForMiddleware(middleware[index]);
            const nextPolicies = [...policies, ...current.policies];
            const nextRateLimit = relationGate(relationNotEqual(current.rateLimit.kind, 'none'), () => current.rateLimit, () => rateLimit);
            return resolveMiddleware(middleware, index + 1, nextPolicies, nextRateLimit);
        },
    );

const resolveRouteSecurity = (middleware: readonly PropertyName[], auth: boolean = false): RouteSecurityResolution => {
        const middlewareValues = relationProject(middleware, value => value.value.value);
        const securityDesc = RouteSecurityClassifier.classify(middlewareValues);
        const resolved = resolveMiddleware(middlewareValues);
        const resolvedAuth = relationAny([auth, securityDesc.isProtected]);

        return Object.freeze({
            security: securityDesc,
            auth: resolvedAuth,
            policies: resolved.policies,
            rateLimit: resolved.rateLimit,
        });
}

export const RouteSecurityResolver = Object.freeze({ resolve: resolveRouteSecurity });
