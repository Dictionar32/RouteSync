import { describe, expectTypeOf, it } from 'vitest';
import type { Sequence } from '../collections';
import type { ResponseHighLevelContract, LaravelSemanticContractCatalog } from '../highLevelContracts';
import type { ResponseOutcomeSurface } from '../highLevelContracts';
import type { ResponseDefinition } from '../response';

describe('upstream interface elevation phase 28', () => {
  it('makes response flow a canonical upstream interface', () => {
    expectTypeOf<ResponseHighLevelContract>().toExtend<ResponseOutcomeSurface>();
    expectTypeOf<ResponseHighLevelContract>().toExtend<ResponseDefinition>();
    expectTypeOf<LaravelSemanticContractCatalog['responses']>()
      .toEqualTypeOf<Sequence<ResponseHighLevelContract>>();
  });
});
