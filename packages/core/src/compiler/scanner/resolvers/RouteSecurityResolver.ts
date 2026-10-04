import {
    relationAll,
    relationAny,
    relationEqual,
    relationNotEqual,
    relationGate,
    relationNormalizeWhitespace,
} from '../../../semantic/kernel/semanticRelations';
import { relationProject, relationVariantFold, relationFoldRight, relationTextSlice, relationTextStartsWith, relationTextLower, relationTextFields, relationAt, relationTextNumber, relationOptionFold } from '../../../semantic/kernel/relationalSequence';

import {
    RouteSecurityDescriptor,
    RouteSecurityClassifier,
    RoutePolicyDescriptor,
    RoutePolicyKind
} from "../../../types/route";
import type { RouteRateLimit } from "../../../types/upstream/route";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import type { TruthValue } from "../../../types/upstream/valueObjects";
import type { RouteMiddleware } from "../../../types/upstream/route";
import type { RouteMiddlewares, Sequence } from "../../../types/upstream/collections";
import { numberValue, truthValue } from "../../../types/upstream/valueObjects";

export interface RouteSecurityResolution {
    readonly security: RouteSecurityDescriptor;
    readonly auth: TruthValue;
    readonly policies: Sequence<RoutePolicyDescriptor>;
    readonly rateLimit: RouteRateLimit;
}

type MiddlewarePolicyResult = Readonly<{
    readonly policies: Sequence<RoutePolicyDescriptor>;
    readonly rateLimit: RouteRateLimit;
}>;

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });
const sequenceSingleton = <T>(value: T): Sequence<T> => ({ kind: 'cons', head: value, tail: emptySequence<T>() });
const sequenceConcat = <T>(left: Sequence<T>, right: Sequence<T>): Sequence<T> =>
    relationVariantFold(left, 'cons', () => right, candidate => ({ kind: 'cons', head: candidate.head, tail: sequenceConcat(candidate.tail, right) }));
const sequenceFromArray = <T>(items: readonly T[]): Sequence<T> =>
    relationFoldRight(items, emptySequence<T>(), (item, tail) => ({ kind: 'cons', head: item, tail }));

const gatePolicy = (ability: string): RoutePolicyDescriptor => Object.freeze({
    ability: SemanticValueFactory.abilityName(ability),
    modelParameter: Object.freeze({ kind: 'none' }),
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
        () => sequenceSingleton(relationGate(modelParameter.length > 0, () => abilityPolicy(ability, modelParameter), () => gatePolicy(ability))),
        () => emptySequence<RoutePolicyDescriptor>(),
    );

    const rolePolicies = relationGate(
        role.length > 0,
        () => sequenceFromArray(relationProject(
            relationProject(relationTextFields(role, ","), value => relationNormalizeWhitespace(value)),
            value => gatePolicy(`role:${value}`),
        )),
        () => emptySequence<RoutePolicyDescriptor>(),
    );

    const adminPolicy = relationGate(admin, () => sequenceSingleton(gatePolicy(`role:${trimmed}`)), () => emptySequence<RoutePolicyDescriptor>());

    const throttleValue = relationTextFields(throttle, ",");
    const throttlePart = (index: number, fallback: string): string =>
        relationOptionFold(relationAt(throttleValue, index), () => fallback, value => value);
    const maxAttempts = numberValue(relationTextNumber(throttlePart(0, ''), 0));
    const decayMinutes = numberValue(relationTextNumber(throttlePart(1, '1'), 1));
    const rateLimit = relationGate(
        relationAll([throttle.length > 0, relationEqual(relationTextNumber(throttlePart(0, ''), -1) >= 0, true)]),
        () => Object.freeze({ kind: 'fixed' as const, limit: Object.freeze({ kind: 'fixed' as const, maxAttempts, decayMinutes }) }),
        () => ({ kind: 'none' as const }),
    );

    return Object.freeze({
        policies: sequenceConcat(sequenceConcat(canPolicy, rolePolicies), adminPolicy),
        rateLimit,
    });
};

const resolveMiddleware = (
    middleware: readonly string[],
    index = 0,
    policies: Sequence<RoutePolicyDescriptor> = emptySequence<RoutePolicyDescriptor>(),
    rateLimit: RouteRateLimit = { kind: 'none' },
): MiddlewarePolicyResult =>
    relationGate(
        index >= middleware.length,
        () => Object.freeze({ policies, rateLimit }),
        () => {
            const current = policyForMiddleware(middleware[index]);
            const nextPolicies = sequenceConcat(policies, current.policies);
            const nextRateLimit = relationGate(relationNotEqual(current.rateLimit.kind, 'none'), () => current.rateLimit, () => rateLimit);
            return resolveMiddleware(middleware, index + 1, nextPolicies, nextRateLimit);
        },
    );

const middlewareValues = (items: Sequence<RouteMiddleware>, output: readonly string[] = []): readonly string[] =>
    relationVariantFold(
        items,
        'cons',
        () => output,
        candidate => middlewareValues(candidate.tail, [...output, candidate.head.name.value.value]),
    );

const resolveRouteSecurity = (middleware: RouteMiddlewares, auth: TruthValue = truthValue(false)): RouteSecurityResolution => {
        const middlewareValuesResult = middlewareValues(middleware.items);
        const securityDesc = RouteSecurityClassifier.classify(middleware);
        const resolved = resolveMiddleware(middlewareValuesResult);
        const resolvedAuth = truthValue(relationAny([auth.value, securityDesc.isProtected.value]));

        return Object.freeze({
            security: securityDesc,
            auth: resolvedAuth,
            policies: resolved.policies,
            rateLimit: resolved.rateLimit,
        });
}

export const RouteSecurityResolver = Object.freeze({ resolve: resolveRouteSecurity });
