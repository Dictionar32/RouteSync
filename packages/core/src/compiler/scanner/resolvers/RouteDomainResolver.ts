/**
 * RouteDomainResolver.ts
 *
 * First-Class Domain Model: Canonical Domain Resolution at Origin Boundary.
 * Replaces heuristic procedural branching with structured domain resolution stages.
 *
 * @module core/compiler/scanner/resolvers/RouteDomainResolver
 */

import { toCamelCase, toPascalCase, ResourceNamingConvention } from "../../../utils/resource-naming";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath } from "../../../types/upstream/names";

export interface RouteDomainResolutionContext {
    readonly domain?: DomainTypeName;
    readonly resourceName?: ResourceName;
    readonly controllerName?: ControllerName;
    readonly path?: RoutePath;
    readonly actionName?: ActionName;
}

export class RouteDomainResolver {
    /**
     * Resolves the canonical domain name deterministically from context.
     * Evaluated once at Origin Boundary; downstream components consume guaranteed non-nullable domain.
     */
    public static resolve(context: RouteDomainResolutionContext): DomainTypeName {
        if (context.domain) {
            const explicitDomain = context.domain.value.value;
            if (explicitDomain.length > 0) {
                return context.domain;
            }
        }

        const controllerName = context.controllerName?.value.value ?? "";
        if (controllerName.length > 0) {
            return SemanticValueFactory.domainName(controllerName.replace(/Controller$/, ""));
        }

        const resourceName = context.resourceName?.value.value ?? "";
        if (resourceName.length > 0) {
            return SemanticValueFactory.domainName(ResourceNamingConvention.stripSuffix(resourceName));
        }

        const path = context.path?.value.value ?? "";
        const actionName = context.actionName?.value.value ?? "";
        if (path === "/register" || actionName.endsWith("register")) {
            return SemanticValueFactory.domainName("Register");
        }

        const rawSegments = path.replace(/^\/+/, "").split("/")
            .filter(s => s.length > 0 && s !== "api" && !/^v\d+$/i.test(s) && !s.startsWith("{") && !s.startsWith(":"));
        if (rawSegments.length > 0) {
            return SemanticValueFactory.domainName(rawSegments.map((seg, idx) => idx === 0 ? toCamelCase(seg) : toPascalCase(toCamelCase(seg))).join(""));
        }

        if (actionName.length > 0) {
            const ctrlMatch = actionName.match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
            if (ctrlMatch && ctrlMatch[1]) {
                return SemanticValueFactory.domainName(ctrlMatch[1]);
            }
        }

        return SemanticValueFactory.domainName("App");
    }
}
