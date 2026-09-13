/**
 * routeSecurity.ts
 *
 * Scanned Route Policy and Rate Limit Descriptors.
 *
 * @module core/compiler/scanner/descriptors/route/routeSecurity
 */

import {
    RoutePolicyDescriptor,
    RoutePolicyKind,
    RateLimitDescriptor
} from "../../../../types/route";

export interface ScannedRoutePolicyParams {
    readonly ability: string;
    readonly modelParameter: string | null;
    readonly kind: RoutePolicyKind;
}

/**
 * Reusable Constructor: Scanned Route Policy Descriptor.
 */
export class ScannedRoutePolicyDescriptor implements RoutePolicyDescriptor {
    public readonly kind: RoutePolicyKind;
    public readonly ability: string;
    public readonly modelParameter: string | null;

    constructor(params: ScannedRoutePolicyParams) {
        this.ability = params.ability;
        this.modelParameter = params.modelParameter;
        this.kind = params.kind;
        Object.freeze(this);
    }

    public static abilityModel(ability: string, modelParameter: string): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter,
            kind: RoutePolicyKind.AbilityModel
        });
    }

    public static gate(ability: string): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter: null,
            kind: RoutePolicyKind.Gate
        });
    }

    public static custom(ability: string, modelParameter: string | null = null): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter,
            kind: RoutePolicyKind.Custom
        });
    }

    public static create({
        ability,
        modelParameter = null,
        kind
    }: {
        readonly ability: string;
        readonly modelParameter?: string | null;
        readonly kind?: RoutePolicyKind;
    }): ScannedRoutePolicyDescriptor {
        const resolvedModelParam = (modelParameter !== undefined && modelParameter !== null) ? modelParameter : null;
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter: resolvedModelParam,
            kind: kind !== undefined ? kind : (resolvedModelParam ? RoutePolicyKind.AbilityModel : RoutePolicyKind.Gate)
        });
    }
}

export interface ScannedRateLimitParams {
    readonly maxAttempts: number;
    readonly decayMinutes: number;
}

/**
 * Reusable Constructor: Scanned Rate Limit Descriptor.
 */
export class ScannedRateLimitDescriptor implements RateLimitDescriptor {
    public readonly maxAttempts: number;
    public readonly decayMinutes: number;

    constructor({ maxAttempts, decayMinutes }: ScannedRateLimitParams) {
        this.maxAttempts = maxAttempts;
        this.decayMinutes = decayMinutes;
        Object.freeze(this);
    }

    public static none(): ScannedRateLimitDescriptor {
        return new ScannedRateLimitDescriptor({ maxAttempts: 0, decayMinutes: 0 });
    }

    public static create(
        maxAttemptsOrOptions: number | { readonly maxAttempts: number; readonly decayMinutes?: number },
        decayMinutesArg: number = 1
    ): ScannedRateLimitDescriptor {
        const isObj = typeof maxAttemptsOrOptions === "object";
        const maxAttempts = isObj ? maxAttemptsOrOptions.maxAttempts : maxAttemptsOrOptions;
        const decay = isObj
            ? (maxAttemptsOrOptions.decayMinutes !== undefined ? maxAttemptsOrOptions.decayMinutes : 1)
            : decayMinutesArg;
        return new ScannedRateLimitDescriptor({ maxAttempts, decayMinutes: decay });
    }
}
