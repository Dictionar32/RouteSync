import type { RouteSemanticFlow } from '@routesync/core';
import type { CompilerIR } from './semanticTypes';
import type { SemanticResolutionContext } from './SemanticResolutionContext';

export function countResponsesByGroup(context: SemanticResolutionContext, ir: CompilerIR): void {
    for (const route of context.routes) {
        const groupName = deriveGroupName(route);
        const existing = ir.responseCountByGroup.get(groupName) ?? 0;
        ir.responseCountByGroup.set(groupName, existing + 1);
    }
}

export function deriveGroupName(route: RouteSemanticFlow): string {
    return route.identity.domain.group.value.value;
}
