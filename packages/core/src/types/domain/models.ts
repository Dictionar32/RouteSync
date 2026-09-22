import type { ParsedColumn } from './databaseColumns';
import type { EloquentRelationType, RelationForeignKey, ModelAccessorComputation } from './eloquentTypes';
import type { ModelKeySemanticType, ModelKeyType } from './modelContracts';
import type { ColumnName, ModelName, PropertyName, RelationName, TableName } from './semanticValues';
import type { DatabaseColumnType, Nullability } from './modelContracts';
import type { MethodName } from './semanticValues';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { Lookup } from '../upstream/collections';

export type {
  ModelPropertyMultiplicity,
  ModelPropertyTraversalMeaning,
  ModelSemanticProperty,
  ModelSemanticColumn,
  ModelSemanticAccessor,
  ModelSemanticRelation,
  ModelSemanticSurface,
  ModelSemanticDefinition,
  ModelPropertyAccessFact
} from '../upstream/model';
export {
  ModelSemanticPropertyIndex,
  ModelSemanticRelationIndex
} from '../upstream/model';

/** Canonical model aggregate. Semantic meaning is the domain SSOT; scanner facts stay behind source. */
export interface ParsedModel {
  readonly semantic: ModelSemanticDefinition;
  readonly source: {
    readonly columns: readonly ParsedColumn[];
    readonly columnFacts: readonly import('../upstream/modelSourceFacts').ModelColumnFact[];
    readonly casts: readonly import('./eloquentTypes').ParsedCast[];
  };
}
