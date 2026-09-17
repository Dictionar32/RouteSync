import { describe, expectTypeOf, it } from 'vitest';
import type { SemanticType } from '../../../compiler/types/SemanticType';
import type { EloquentRelationType } from '../eloquentTypes';
import type { Nullability } from '../modelContracts';
import type { ColumnName, ModelName, RelationName } from '../semanticValues';
import type { ModelFieldEntry, ModelFieldInfo, ModelRelationEntry, ModelRelationInfo } from '../semanticCollections';

describe('Phase 66 semantic collection contracts', () => {
  it('qualifies model field semantics', () => {
    expectTypeOf<ModelFieldInfo['type']>().toEqualTypeOf<SemanticType>();
    expectTypeOf<ModelFieldInfo['nullability']>().toEqualTypeOf<Nullability>();
    expectTypeOf<ModelFieldEntry['column']>().toEqualTypeOf<ColumnName>();
  });

  it('qualifies model relation semantics', () => {
    expectTypeOf<ModelRelationInfo['type']>().toEqualTypeOf<EloquentRelationType>();
    expectTypeOf<ModelRelationInfo['model']>().toEqualTypeOf<ModelName>();
    expectTypeOf<ModelRelationEntry['relationName']>().toEqualTypeOf<RelationName>();
  });
});
