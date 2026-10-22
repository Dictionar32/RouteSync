import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationInput,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeDerivationRuntimeExecutorInterface,
} from '../../../types/upstream/requestTypeDerivationInterface';

type NarrowInput = Omit<RequestTypeDerivationInput, 'routes'> & Readonly<{
  routes: readonly [RequestTypeDerivationInput['routes'][number]];
}>;
type Executor = RequestTypeDerivationRuntimeExecutorInterface<string, NarrowInput>;
type Result = RequestTypeDerivationRuntimeExecutionResult<string, NarrowInput>;
type BindingFailure = Extract<Result, { readonly kind: 'input_binding_failed' }>;

describe('runtime executor input contract phase1625', () => {
  it('preserves specialized input at the executor boundary', () => {
    expectTypeOf<Parameters<Executor['execute']>[0]>().toEqualTypeOf<NarrowInput>();
  });

  it('preserves specialized input on the input-binding failure witness', () => {
    expectTypeOf<BindingFailure['expectedInput']>().toEqualTypeOf<NarrowInput>();
    expectTypeOf<BindingFailure['proofInput']>().toEqualTypeOf<RequestTypeDerivationInput>();
  });
});
