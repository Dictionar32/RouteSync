/**
 * RouteDomainResolver.ts
 *
 * First-Class Domain Model: Canonical Domain Resolution at Origin Boundary.
 * Replaces heuristic procedural branching with structured domain resolution stages.
 *
 * @module core/compiler/scanner/resolvers/RouteDomainResolver
 */

import { toCamelCase, toPascalCase, ResourceNamingConvention } from "../../../utils/resource-naming";

export interface RouteDomainResolutionContext {
    readonly domain?: string | null;
    readonly resourceName?: string | null;
    readonly controllerName?: string | null;
    readonly path?: string | null;
    readonly actionName?: string | null;
}

export class RouteDomainResolver {
    /**
     * Resolves the canonical domain name deterministically from context.
     * Evaluated once at Origin Boundary; downstream components consume guaranteed non-nullable domain.
     */
    public static resolve(context: RouteDomainResolutionContext): string {
        const explicitDomain = context.domain;
        if (explicitDomain && explicitDomain.length > 0) {
            return explicitDomain;
        }

        const controllerName = context.controllerName;
        if (controllerName && controllerName.length > 0) {
            return controllerName.replace(/Controller$/, "");
        }

        const resourceName = context.resourceName;
        if (resourceName && resourceName.length > 0) {
            return ResourceNamingConvention.stripSuffix(resourceName);
        }

        const path = context.path ? context.path : "";
        const actionName = context.actionName ? context.actionName : "";
        if (path === "/register" || actionName.endsWith("register")) {
            return "Register";
        }

        const rawSegments = path.replace(/^\/+/, "").split("/")
            .filter(s => s.length > 0 && s !== "api" && !/^v\d+$/i.test(s) && !s.startsWith("{") && !s.startsWith(":"));
        if (rawSegments.length > 0) {
            return rawSegments.map((seg, idx) => idx === 0 ? toCamelCase(seg) : toPascalCase(toCamelCase(seg))).join("");
        }

        if (actionName.length > 0) {
            const ctrlMatch = actionName.match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
            if (ctrlMatch && ctrlMatch[1]) {
                return ctrlMatch[1];
            }
        }

        return "App";
    }
}
