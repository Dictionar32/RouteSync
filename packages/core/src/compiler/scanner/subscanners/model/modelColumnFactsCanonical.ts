import type { ModelColumnFact } from '../../../../types/upstream/modelSourceFacts';
import type { SourceSpan } from '../../../../types/upstream/provenance';

/**
 * Canonical boundary: receives already-correlated model column facts.
 * Column/cast correlation belongs to the scanner origin, not this transformer.
 */
export function buildModelColumnFacts(
    facts: readonly ModelColumnFact[],
    _span: SourceSpan
): readonly ModelColumnFact[] {
    return facts;
}
