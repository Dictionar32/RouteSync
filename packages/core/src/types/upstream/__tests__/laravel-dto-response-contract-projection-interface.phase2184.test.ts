import { describe, expectTypeOf, it } from 'vitest';
import type { ResponseContract, ResponseContractField } from '../../domain/responseContracts';
import type {
  LaravelDtoResponseContractFieldProjection,
  LaravelDtoResponseContractProjectionContract,
  LaravelDtoResponseContractProjectionRuntimeExecutorInterface,
} from '../laravelDtoResponseContractProjectionInterface';

describe('Laravel DTO response-contract projection interface phase 2184', () => {
  it('reuses the canonical response field contract rather than restating field semantics', () => {
    expectTypeOf<LaravelDtoResponseContractFieldProjection['field']>()
      .toEqualTypeOf<ResponseContractField>();
    expectTypeOf<ResponseContract['fields'][number]>()
      .toEqualTypeOf<LaravelDtoResponseContractFieldProjection['field']>();
  });

  it('versions the strengthened contract and keeps executor execution contract-bound', () => {
    expectTypeOf<LaravelDtoResponseContractProjectionContract['contractVersion']>()
      .toEqualTypeOf<2>();
    expectTypeOf<LaravelDtoResponseContractProjectionRuntimeExecutorInterface['contractVersion']>()
      .toEqualTypeOf<2>();
  });
});
