/**
 * typeDeriverUtils.ts
 *
 * Centralized Domain Utilities for TypeDeriver Subsystem.
 * Eliminates repetitive string heuristics and unifies domain name resolution.
 *
 * @module core/compiler/scanner/subscanners/typeDeriverUtils
 */

import { ParsedRoute } from "../../../types/route";
import { PrimitiveKind } from "../../types/SemanticType";
import { ScannedRouteDescriptor } from "../descriptors/routeDescriptors";

/**
 * Authoritative inference of PrimitiveKind from raw type strings or descriptors.
 * Eliminates duplicated .includes('int') / .includes('decimal') checking across the compiler.
 */
export function resolvePrimitiveKind(
    rawType: unknown,
    fallback: PrimitiveKind = PrimitiveKind.STRING
): PrimitiveKind {
    if (rawType === undefined || rawType === null) {
        return fallback;
    }

    const typeStr = String(rawType).trim().toLowerCase();

    if (typeStr === 'unknown') {
        return PrimitiveKind.UNKNOWN;
    }

    if (
        typeStr === 'number' ||
        typeStr === 'int' ||
        typeStr === 'integer' ||
        typeStr === 'float' ||
        typeStr === 'double' ||
        typeStr === 'real' ||
        typeStr.includes('int') ||
        typeStr.includes('decimal') ||
        typeStr.includes('float') ||
        typeStr.includes('numeric') ||
        typeStr.includes('digits')
    ) {
        return PrimitiveKind.NUMBER;
    }

    if (
        typeStr === 'boolean' ||
        typeStr === 'bool' ||
        typeStr.includes('accepted') ||
        typeStr.includes('declined')
    ) {
        return PrimitiveKind.BOOLEAN;
    }

    if (
        typeStr === 'datetime' ||
        typeStr === 'date' ||
        typeStr === 'timestamp'
    ) {
        return PrimitiveKind.DATETIME;
    }

    if (typeStr === 'file' || typeStr === 'image') {
        return PrimitiveKind.FILE;
    }

    return fallback;
}

export type RouteDomainInput = {
    readonly domain?: string;
    readonly resourceName?: string;
    readonly controllerName?: string;
    readonly path?: string;
    readonly actionName?: string;
    readonly name?: string;
};

/**
 * Authoritative resolution of resource/domain name for a route.
 * Canonical SSOT is pre-resolved on route.domain at Origin Boundary.
 */
export function resolveRouteDomain(route: RouteDomainInput): string {
    return route.domain || ScannedRouteDescriptor.resolveDomain(route);
}

