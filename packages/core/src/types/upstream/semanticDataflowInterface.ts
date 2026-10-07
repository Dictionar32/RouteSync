/**
 * @deprecated Compatibility facade.
 *
 * Canonical semantic dataflow ADTs live in `semanticDataflow.ts`. This file
 * intentionally contains no second semantic authority.
 */
export type {
  SemanticDataflowEntityRole,
  SemanticDataflowRole,
  SemanticDataflowIdentity,
  SemanticDataflowIdentityKey,
  SemanticDataflowGuard,
  SemanticDataflowPath,
  SemanticDataflowFactLineage,
  SemanticDataflowFact,
  SemanticDataflowDerivation,
  SemanticDataflowInputFact,
  SemanticDataflowJudgment,
  SemanticDataflowOrigin,
  SemanticDataflowLineageProducer,
  SemanticDataflowLineage,
  SemanticDataflowInput,
  SemanticDataflowInterface,
} from './semanticDataflow';

export {
  semanticDataflowIdentityKey,
  semanticDataflowIdentityEqual,
  semanticDataflowFactWithLineage,
  semanticDataflowInterfaceFromJudgment,
} from './semanticDataflow';
