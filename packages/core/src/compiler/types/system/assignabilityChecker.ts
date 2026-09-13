/**
 * assignabilityChecker.ts
 *
 * Implements assignability relation, allowing assignment to union member types.
 *
 * @module compiler/types/system
 */

import { SemanticType } from '../SemanticType';

export function checkAssignable(
    source: SemanticType,
    target: SemanticType,
    isSubtype: (s: SemanticType, t: SemanticType) => boolean
): boolean {
    // Subtyping implies assignability
    if (isSubtype(source, target)) {
        return true;
    }

    // Union target: check if assignable to any member
    if (target.kind === 'union') {
        return Array.from(target.members.values()).some(
            member => checkAssignable(source, member, isSubtype)
        );
    }

    return false;
}
