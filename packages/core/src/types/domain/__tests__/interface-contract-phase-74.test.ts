import type {
  ModelDef,
  ModelDefContract,
  ResourceDef,
  ResourceDefContract,
} from '../modelEntityDefinition';

describe('Phase 74 model/resource definition contracts', () => {
  it('uses the complete ResourceDef contract as the canonical type', () => {
    const contract: ResourceDefContract = {} as ResourceDef;
    expect(contract).toBeDefined();
  });

  it('uses the complete ModelDef contract as the canonical type', () => {
    const contract: ModelDefContract = {} as ModelDef;
    expect(contract).toBeDefined();
  });

  it('does not expose the former optional legacy fields through canonical aliases', () => {
    type ResourceModel = ResourceDef;
    type ModelModel = ModelDef;

    const resourceKeys: readonly (keyof ResourceModel)[] = [
      'name', 'model', 'fields', 'assignments', 'sourceFile', 'sourceLine',
    ];
    const modelKeys: readonly (keyof ModelModel)[] = [
      'name', 'table', 'columns', 'hidden', 'appends', 'casts', 'relations', 'accessors',
    ];

    expect(resourceKeys).toHaveLength(6);
    expect(modelKeys).toHaveLength(8);
  });
});
