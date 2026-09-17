import { describe, expect, expectTypeOf, it } from 'vitest';
import type { BoundProjectionFieldNode, BoundQueryProjectionNode } from '../boundAst';
import type { QueryProjectionSemanticResolution, SemanticResolution } from '../semanticResolution';
import type { ResponseFieldName } from '../semanticValues';
import type { SemanticType } from '../../../compiler/types/SemanticType';

describe('Phase 87.33 projection contract', () => {
  it('keeps query projection closed and typed', () => {
    expectTypeOf<QueryProjectionSemanticResolution['sourceModel']['kind']>().toEqualTypeOf<'model_name'>();
    expectTypeOf<QueryProjectionSemanticResolution['fields']>().toEqualTypeOf<readonly (readonly [ResponseFieldName, SemanticType])[]>();
    expectTypeOf<SemanticResolution['kind']>().toEqualTypeOf<'scalar' | 'model' | 'resource' | 'object' | 'query_projection' | 'unknown'>();
  });

  it('binds projection field access to source model and field', () => {
    expectTypeOf<BoundQueryProjectionNode['fields']>().toEqualTypeOf<QueryProjectionSemanticResolution['fields']>();
    expectTypeOf<BoundProjectionFieldNode['field']['kind']>().toEqualTypeOf<'response_field_name'>();
  });
});
