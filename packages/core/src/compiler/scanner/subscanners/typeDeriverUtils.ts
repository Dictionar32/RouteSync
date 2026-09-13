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
 * Eliminates 6x duplicated .includes('int') / .includes('decimal') checking across the compiler.
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
        typeStr.includes('numeric')
    ) {
        return PrimitiveKind.NUMBER;
    }

    if (typeStr === 'boolean' || typeStr === 'bool') {
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

/**
 * Authoritative resolution of resource/domain name for a route.
 * Canonical SSOT is pre-resolved on route.domain at Origin Boundary.
 */
export function resolveRouteDomain(route: ParsedRoute): string {
    return route.domain || ScannedRouteDescriptor.resolveDomain(route);
}
