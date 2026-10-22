import type { SemanticType } from '../domain/semanticType';
import type { TypeExpression } from './typeVocabulary';

/**
 * Explicit contract for projecting a closed domain semantic type into the
 * upstream TypeExpression vocabulary. The implementation must consume the
 * domain visitor instead of reclassifying semantic variants locally.
 */
export interface SemanticTypeCanonicalizerInterface {
    (value: SemanticType): TypeExpression;
}
