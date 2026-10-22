import type { ModelColumnFact } from '../../../../types/upstream/modelSourceFacts';

/**
 * Canonical boundary: receives already-correlated model column facts.
 * Column/cast correlation belongs to the scanner origin, not this transformer.
 */
export interface BuildModelColumnFactsInterface {
    (facts: readonly ModelColumnFact[]): readonly ModelColumnFact[];
}

export const buildModelColumnFacts: BuildModelColumnFactsInterface = (facts) => facts;
