/**
 * Canonical model semantic surface.
 *
 * The former legacy parsed model aggregate aggregate is retired. Model AST construction remains
 * upstream; semantic consumers receive ModelSemanticDefinition directly.
 */
export type {
  ModelPropertyMultiplicity,
  ModelPropertyTraversalMeaning,
  ModelSemanticProperty,
  ModelSemanticColumn,
  ModelSemanticAccessor,
  ModelSemanticRelation,
  ModelSemanticSurface,
  ModelSemanticDefinition,
  ModelPropertyAccessFact,
} from '../upstream/model';

export {
  ModelSemanticPropertyIndex,
  ModelSemanticRelationIndex,
  modelSemanticPropertyIndexFrom,
  modelSemanticPropertyLookup,
  modelSemanticPropertyHas,
  modelSemanticRelationIndexFrom,
  modelSemanticRelationLookup,
} from '../upstream/model';
