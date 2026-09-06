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
import {
    toCamelCase,
    toPascalCase,
    ResourceNamingConvention
} from "../../../utils/resource-naming";

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
 * Encapsulates the 10-tier fallback hierarchy into a clean deterministic function.
 */
export function resolveRouteDomain(route: ParsedRoute): string {
    let rawDomain = route.resourceName;
    if (rawDomain) {
        rawDomain = ResourceNamingConvention.stripSuffix(rawDomain);
    }
    if (!rawDomain && (route.path === '/register' || route.actionName?.endsWith('register'))) {
        rawDomain = 'Register';
    }
    if (!rawDomain && route.name) {
        const nameParts = route.name.split('.');
        rawDomain = nameParts.length > 1
            ? nameParts.slice(0, -1).map((p, i) => i === 0 ? toCamelCase(p) : toPascalCase(p)).join('')
            : route.name;
    }
    const rawSegments = (route.path || '').replace(/^\//, '').split('/')
        .filter(segment => segment && segment !== 'api' && segment !== 'v1' && !segment.startsWith('{') && !segment.startsWith(':'));
    if (!rawDomain && rawSegments.length > 1) {
        const camelSegments = rawSegments.map((seg, idx) => {
            const clean = toCamelCase(seg);
            return idx === 0 ? clean : toPascalCase(clean);
        });
        rawDomain = camelSegments.join('');
    }
    if (!rawDomain && (route as any).domain) {
        rawDomain = (route as any).domain;
    }
    const routeAction = (route as any).action || route.actionName;
    if (!rawDomain && routeAction) {
        const ctrlMatch = String(routeAction).match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
        if (ctrlMatch) {
            rawDomain = ctrlMatch[1];
        }
    }
    if (!rawDomain && (route as any).schema?.formTypeName) {
        rawDomain = (route as any).schema.formTypeName.replace(/Form$/, '');
    }
    if (!rawDomain && (route as any).schema?.resourceName) {
        rawDomain = ResourceNamingConvention.stripSuffix((route as any).schema.resourceName);
    }
    if (!rawDomain && route.groupName) {
        rawDomain = route.groupName;
    }
    if (!rawDomain && rawSegments.length > 0) {
        const camelSegments = rawSegments.map((seg, idx) => {
            const clean = toCamelCase(seg);
            return idx === 0 ? clean : toPascalCase(clean);
        });
        rawDomain = camelSegments.join('');
    }
    if (!rawDomain) {
        rawDomain = 'App';
    }

    return rawDomain;
}
