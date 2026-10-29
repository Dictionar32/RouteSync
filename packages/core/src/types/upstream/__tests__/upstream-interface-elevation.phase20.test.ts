import { expect, expectTypeOf, describe, it } from 'vitest';
import type { CompleteLaravelSourceModel, SourceModelCatalog } from '../highLevelSourceModel';
import { modelSemanticNodeFromAst, semanticContractCatalogFromSourceCatalog } from '../highLevelSourceModel';
import type { LaravelSemanticContractCatalog } from '../highLevelContracts';

describe('phase 20 upstream semantic contract ownership', () => {
  it('exposes frozen object-style source-model operations with explicit ADT tags', () => {
    expect(Object.isFrozen(modelSemanticNodeFromAst)).toBe(true);
    expect(modelSemanticNodeFromAst.kind).toBe('model_semantic_node_from_ast_operation');
    expect(typeof modelSemanticNodeFromAst.project).toBe('function');
    expect(Object.isFrozen(semanticContractCatalogFromSourceCatalog)).toBe(true);
    expect(semanticContractCatalogFromSourceCatalog.kind).toBe('semantic_contract_catalog_from_source_catalog_operation');
    expect(typeof semanticContractCatalogFromSourceCatalog.project).toBe('function');
  });

  it('exposes the plural catalog as the canonical semantic boundary', () => {
    expectTypeOf<CompleteLaravelSourceModel['contracts']>().toEqualTypeOf<LaravelSemanticContractCatalog>();
    expectTypeOf(semanticContractCatalogFromSourceCatalog.project).parameter(0).toEqualTypeOf<SourceModelCatalog>();
    expectTypeOf(semanticContractCatalogFromSourceCatalog.project).returns.toEqualTypeOf<LaravelSemanticContractCatalog>();
  });
});
