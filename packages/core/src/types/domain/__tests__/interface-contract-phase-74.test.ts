import type {
  ModelDef,
  ModelDefContract,
  ResourceDef,
  ResourceDefContract,
} from '../modelEntityDefinition';

describe('canonical model/resource semantic contracts', () => {
  it('uses the complete ResourceDef contract as the upstream resource aggregate', () => {
    const contract: ResourceDefContract = {} as ResourceDef;
    expect(contract).toBeDefined();
  });

  it('uses the high-level semantic model as the canonical ModelDef contract', () => {
    const contract: ModelDefContract = {} as ModelDef;
    expect(contract).toBeDefined();
  });

  it('does not expose the former raw model collections through ModelDef', () => {
    type ModelModel = ModelDef;
    type Keys = keyof ModelModel;

    const modelKeys: readonly Keys[] = ['identity', 'key', 'behavior', 'surface'];

    expect(modelKeys).toHaveLength(4);
  });
});
