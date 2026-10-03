import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CompleteLaravelSourceModel, SourceModelCatalog } from '../highLevelSourceModel';
import { semanticContractCatalogFromSourceCatalog } from '../highLevelSourceModel';
import type { LaravelSemanticContractCatalog } from '../highLevelContracts';

describe('upstream interface elevation phase 21', () => {
  it('exposes only the canonical semantic contract boundary from the complete source model', () => {
    expectTypeOf<CompleteLaravelSourceModel['contracts']>().toEqualTypeOf<LaravelSemanticContractCatalog>();
    expectTypeOf(semanticContractCatalogFromSourceCatalog)
      .parameter(0)
      .toEqualTypeOf<SourceModelCatalog>();
  });

  it('keeps the AST/ADT catalog as an internal construction input', () => {
    const keys = Object.keys({
      kind: 'complete_laravel_source_model',
      identity: {} as CompleteLaravelSourceModel['identity'],
      contracts: {} as CompleteLaravelSourceModel['contracts'],
    });

    expect(keys).toEqual(['kind', 'identity', 'contracts']);
    expect(keys).not.toContain('catalog');
    expect(keys).not.toContain('references');
  });
});
