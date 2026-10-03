import { describe, expectTypeOf, it } from 'vitest';
import type { ResourceSerializationContract } from '../resource';
import type { ResponseContract } from '../response';

describe('upstream interface elevation phase 24', () => {
  it('keeps resource serialization and response contracts as interfaces', () => {
    expectTypeOf<ResourceSerializationContract>().toMatchObjectType<{
      readonly kind: 'resource_serialization_contract';
      readonly representation: ResourceSerializationContract['representation'];
      readonly framework: ResourceSerializationContract['framework'];
    }>();
    expectTypeOf<ResponseContract>().toMatchObjectType<{
      readonly kind: 'response_contract';
      readonly definition: ResponseContract['definition'];
    }>();
  });
});
