import { expectTypeOf, describe, it } from 'vitest';
import type { CompleteLaravelSourceModel, SourceModelCatalog } from '../highLevelSourceModel';
import { semanticContractCatalogFromSourceCatalog } from '../highLevelSourceModel';
import type { LaravelSemanticContractCatalog } from '../highLevelContracts';

describe('phase 20 upstream semantic contract ownership', () => {
  it('exposes the plural catalog as the canonical semantic boundary', () => {
    expectTypeOf<CompleteLaravelSourceModel['contracts']>().toEqualTypeOf<LaravelSemanticContractCatalog>();
    expectTypeOf(semanticContractCatalogFromSourceCatalog).parameter(0).toEqualTypeOf<SourceModelCatalog>();
    expectTypeOf(semanticContractCatalogFromSourceCatalog).returns.toEqualTypeOf<LaravelSemanticContractCatalog>();
  });
});
