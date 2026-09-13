/**
 * domainExtractor.ts
 *
 * Extracts route domain names (raw and bare domain).
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedRoute } from "../../../../types/route";
import { toPascalCase } from "../../../../utils/resource-naming";
import { resolveRouteDomain } from "../typeDeriverUtils";

export interface RouteDomainInfo {
    readonly rawDomain: string;
    readonly bareDomain: string;
}

export function extractRouteDomain(route: ParsedRoute): RouteDomainInfo {
    const rawDomain = (() => {
        if (route.path === '/register' || (route.action && route.action.endsWith('@register'))) {
            return 'Register';
        }
        const rawSegments = (route.path || '')
            .replace(/^\//, '')
            .split('/')
            .filter(s => s && s !== 'api' && s !== 'v1' && !s.startsWith('{') && !s.startsWith(':'));
        if (rawSegments.length > 1) {
            return rawSegments.map(s => toPascalCase(s)).join('');
        }
        const ctrlName = (route as any).controllerName ||
            (route.action && route.action.includes('Controller')
                ? route.action.split('@')[0].split('\\').pop()?.replace(/Controller$/, '')
                : null);
        if (ctrlName && route.domain && ctrlName.toLowerCase().startsWith(route.domain.toLowerCase()) && ctrlName.length > route.domain.length) {
            return ctrlName;
        }
        return route.domain || ctrlName || resolveRouteDomain(route);
    })();

    const bareDomain = rawDomain.replace(/Resource$/, '').toLowerCase();

    return { rawDomain, bareDomain };
}
