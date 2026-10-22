import { describe, it, expectTypeOf } from 'vitest';
import type {
  RequestTypeDerivationSemanticDecisionPremises,
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineAssemblerInterface,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationSemanticPipelineCompositionInterface['contract'];
type PremisesContract = RequestTypeDerivationSemanticDecisionPremises['contract'];
type AssemblyResult = ReturnType<RequestTypeDerivationSemanticPipelineAssemblerInterface['assemble']>;

describe('request type derivation assembly interface phase1597', () => {
  it('keeps the intended contract available even when coverage is incomplete', () => {
    expectTypeOf<PremisesContract>().toEqualTypeOf<Contract>();
  });

  it('requires the canonical preparation operation before reasoning', () => {
    expectTypeOf<Parameters<Composition['preparation']['prepare']>[0]>()
      .toEqualTypeOf<Parameters<Composition['reasoning']['infer']>[0]['input']>();
  });

  it('makes assembly success and contract mismatch rejection explicit', () => {
    expectTypeOf<AssemblyResult>().toEqualTypeOf<RequestTypeDerivationSemanticPipelineAssemblyResult>();
    expectTypeOf<AssemblyResult['kind']>().toEqualTypeOf<'assembled' | 'rejected'>();
  });
});
