/**
 * actionMap.ts
 *
 * Canonical HTTP method → semantic action mappings and helpers.
 *
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

export function getActionFromMethod(method: string): ActionType {
    const normalized = method.toLowerCase() as keyof typeof CANONICAL_ACTION_MAP;
    return CANONICAL_ACTION_MAP[normalized] || 'Get';
}

export function isMutationAction(action: ActionType): boolean {
    return action !== 'Get' && (action as string) !== 'Read';
}
