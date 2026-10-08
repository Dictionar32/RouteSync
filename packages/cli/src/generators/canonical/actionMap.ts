/**
 * actionMap.ts
 *
 * Legacy compatibility vocabulary only. Semantic action classification belongs
 * to the upstream route-capability authority; active generator pipelines must
 * consume route.actionName / closed capability instead of these helpers.
 *
 * @deprecated Do not use this module for route classification or generation.
 * @module cli/generators/canonical/actionMap
 */

export const CANONICAL_ACTION_MAP = {
    'post': 'Create',
    'put': 'Update',
    'patch': 'Update',
    'delete': 'Delete',
    'get': 'Get',
} as const;

export type ActionType = typeof CANONICAL_ACTION_MAP[keyof typeof CANONICAL_ACTION_MAP];

export const ACTION_TO_HTTP_METHODS: Record<ActionType, string[]> = {
    'Create': ['POST'],
    'Update': ['PUT', 'PATCH'],
    'Delete': ['DELETE'],
    'Get': ['GET'],
};

export const HOOK_ACTION_MAP = {
    'Create': 'create',
    'Update': 'update',
    'Delete': 'delete',
    'Get': 'read',
} as const;

export const HTTP_METHOD_SAFETY = {
    'GET': { isRead: true, isMutation: false },
    'HEAD': { isRead: true, isMutation: false },
    'POST': { isRead: false, isMutation: true },
    'PUT': { isRead: false, isMutation: true },
    'PATCH': { isRead: false, isMutation: true },
    'DELETE': { isRead: false, isMutation: true },
} as const;

export function isValidHttpMethod(method: string): method is keyof typeof CANONICAL_ACTION_MAP {
    return method.toLowerCase() in CANONICAL_ACTION_MAP;
}

/** @deprecated Compatibility helper only; never use in active compiler/generator flows. */
export function getActionFromMethod(method: string): ActionType {
    const normalized = method.toLowerCase() as keyof typeof CANONICAL_ACTION_MAP;
    return CANONICAL_ACTION_MAP[normalized] || 'Get';
}

/** @deprecated Compatibility helper only; consume the closed upstream hook/CRUD capability. */
export function isMutationAction(action: ActionType): boolean {
    return action !== 'Get' && (action as string) !== 'Read';
}
