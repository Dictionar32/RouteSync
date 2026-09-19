/**
 * Canonical model semantic contracts.
 *
 * Scanner facts stay in ParsedModel. Downstream receives only the semantic
 * model surface, so it does not need to reconstruct Eloquent meaning.
 */
import type { ModelSemanticDefinition as HighModelSemanticDefinition, ModelPropertyMultiplicity } from './models';
import type { ModelName, PropertyName, SourceFilePath, SourceLineNumber } from '../ir/nominalVocabulary';
import type { EloquentRelationCardinality, EloquentRelationType, RelationForeignKey, RelationTargetShape } from './eloquentTypes';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { FieldNode } from '../field';
import type { TypeExpression } from '../ir/nominalVocabulary';


/** Upstream column fact retained for resource/scanner compatibility. */
export interface ColumnDefinitionContract {
  readonly name: PropertyName;
  readonly type: import('../ir/nominalVocabulary').TypeExpression;
  readonly nullability: import('./modelContracts').Nullability;
}

export type ColumnDefinition = ColumnDefinitionContract;

/** Complete semantic relation contract. No legacy `kind`/`unknown` vocabulary. */
export interface ModelRelationDefinitionContract {
  readonly name: PropertyName;
  readonly type: EloquentRelationType;
  readonly targetModel: ModelName;
  readonly cardinality: EloquentRelationCardinality;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly targetShape: RelationTargetShape;
  readonly traversalTarget:
    | { readonly kind: 'model'; readonly model: ModelName }
    | { readonly kind: 'collection'; readonly model: ModelName };
  readonly foreignKey: RelationForeignKey;
  readonly semanticType: SemanticType;
}

export type ModelRelationDefinition = ModelRelationDefinitionContract;

/** Canonical high-level model contract. */
export type ModelSemanticDefinitionContract = HighModelSemanticDefinition;
export type ModelSemanticDefinition = ModelSemanticDefinitionContract;
export type ModelDefContract = ModelSemanticDefinitionContract;
export type ModelDef = ModelSemanticDefinitionContract;

/**
 * Upstream-only resource aggregate. It is deliberately not the canonical
 * model contract consumed by lowering.
 */
export interface ResourceDefContract {
  readonly name: ModelName;
  readonly model: ModelName;
  readonly fields: readonly (readonly [PropertyName, FieldNode])[];
  readonly assignments: readonly (readonly [PropertyName, TypeExpression])[];
  readonly sourceFile: SourceFilePath;
  readonly sourceLine: SourceLineNumber;
}

export type ResourceDef = ResourceDefContract;
