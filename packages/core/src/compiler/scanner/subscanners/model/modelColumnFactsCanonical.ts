import type { ModelColumnFact } from '../../../../types/upstream/modelSourceFacts';

/**
 * Canonical boundary: receives already-correlated model column facts.
 * Column/cast correlation belongs to the scanner origin, not this transformer.
 */
export function buildModelColumnFacts(
    facts: readonly ModelColumnFact[]
): readonly ModelColumnFact[] {
    return facts;
}
