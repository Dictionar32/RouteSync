/**
 * RouteSecurityResolver.ts
 *
 * First-Class Domain Model: Resolves route security, policies, and rate limits
 * from declared middleware and explicit auth flags at Origin Boundary.
 *
 * @module core/compiler/scanner/resolvers/RouteSecurityResolver
 */

import {
    RouteSecurityDescriptor,
    RouteSecurityClassifier,
    RoutePolicyDescriptor,
    RoutePolicyKind,
    RateLimitDescriptor
} from "../../../types/route";

export interface RouteSecurityResolution {
    readonly security: RouteSecurityDescriptor;
    readonly auth: boolean;
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RateLimitDescriptor | null;
}

export class RouteSecurityResolver {
    /**
     * Resolves security classification, authorization status, policies, and rate limits.
     * Evaluated once at Origin Boundary; downstream components consume guaranteed subcontracts.
     */
    public static resolve(middleware: readonly string[], auth: boolean = false): RouteSecurityResolution {
        const securityDesc = RouteSecurityClassifier.classify(middleware);
        const resolvedAuth = auth || securityDesc.isProtected;
        const policies: RoutePolicyDescriptor[] = [];
        let rateLimit: RateLimitDescriptor | null = null;

        for (const m of middleware) {
            const trimmed = m.trim();
            if (trimmed.startsWith("can:")) {
                const parts = trimmed.slice(4).split(",");
                const ability = parts[0]?.trim() || "";
                const secondPart = parts[1]?.trim();
                const modelParameter = secondPart && secondPart.length > 0 ? secondPart : null;
                policies.push(Object.freeze({
                    ability,
                    modelParameter,
                    kind: modelParameter ? RoutePolicyKind.AbilityModel : RoutePolicyKind.Gate
                }));
            } else if (trimmed.startsWith("role:")) {
                const roles = trimmed.slice(5).split(",").map(r => r.trim()).filter(Boolean);
                for (const role of roles) {
                    policies.push(Object.freeze({
                        ability: `role:${role}`,
                        modelParameter: null,
                        kind: RoutePolicyKind.Gate
                    }));
                }
            } else if (trimmed === "admin" || trimmed === "superadmin") {
                policies.push(Object.freeze({
                    ability: `role:${trimmed}`,
                    modelParameter: null,
                    kind: RoutePolicyKind.Gate
                }));
            } else if (trimmed.toLowerCase().startsWith("throttle:")) {
                const parts = trimmed.slice(9).split(",");
                const maxAttempts = parseInt(parts[0], 10);
                const decayMinutes = parts[1] ? parseFloat(parts[1]) : 1;
                if (!isNaN(maxAttempts)) {
                    rateLimit = Object.freeze({ maxAttempts, decayMinutes });
                }
            }
        }

        return Object.freeze({
            security: securityDesc,
            auth: resolvedAuth,
            policies: Object.freeze(policies),
            rateLimit
        });
    }
}
