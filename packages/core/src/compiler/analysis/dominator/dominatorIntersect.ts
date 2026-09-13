/**
 * dominatorIntersect.ts
 *
 * Intersection (common dominator) computation for two blocks in a CFG.
 *
 * @module core/compiler/analysis/dominator
 */

/**
 * Find intersection (common dominator) of two blocks along the dominator tree.
 *
 * @param b1 - First block ID
 * @param b2 - Second block ID
 * @param rpo - Reverse postorder sequence
 * @param idoms - Immediate dominators map
 * @returns Common dominator block ID
 */
export function intersectDominators(
    b1: number,
    b2: number,
    rpo: readonly number[],
    idoms: ReadonlyMap<number, number>
): number {
    let finger1 = b1;
    let finger2 = b2;
    const rpoIndex = new Map<number, number>(rpo.map((id, idx) => [id, idx]));

    // Walk up dominator tree until common ancestor is reached
    while (finger1 !== finger2) {
        const idx1 = rpoIndex.get(finger1) ?? -1;
        const idx2 = rpoIndex.get(finger2) ?? -1;

        if (idx1 > idx2) {
            finger1 = idoms.get(finger1)!;
        } else {
            finger2 = idoms.get(finger2)!;
        }
    }

    return finger1;
}
