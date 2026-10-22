import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationJudgment,
  RequestTypeDerivationSemanticPipelineDerivationResult,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Pipeline = RequestTypeDerivationSemanticPipelineInterface<Contract, Inference>;
type Assessment = RequestTypeDerivationSemanticAuthorityAssessmentFor<Contract, Inference>;

describe('request type derivation pipeline inference preservation phase1606', () => {
  it('preserves the pipeline inference parameter in its canonical derive result', () => {
    expectTypeOf<ReturnType<Pipeline['derive']>>()
      .toEqualTypeOf<RequestTypeDerivationSemanticPipelineDerivationResult<Contract, Inference>>();
    expectTypeOf<Extract<ReturnType<Pipeline['derive']>, { readonly kind: 'derivation_verified' }>['decision']['verificationBinding']['inference']>()
      .toEqualTypeOf<Inference>();
  });

  it('keeps the contract and inference binding visible at the pipeline boundary', () => {
    expectTypeOf<Extract<ReturnType<Pipeline['derive']>, { readonly kind: 'derivation_verified' }>['decision']['verificationBinding']['contract']>()
      .toEqualTypeOf<Contract>();
    expectTypeOf<Pipeline['derive']>().toBeFunction();
  });
});


type DerivedJudgment = Extract<RequestTypeDerivationJudgment, { readonly kind: 'derived' }>;
type DerivedInference = RequestTypeDerivationSemanticInferenceFor<Contract, Inference['input'], DerivedJudgment>;

describe('request type derivation inference judgment preservation', () => {
  it('preserves a specialized closed judgment through the inference interface', () => {
    expectTypeOf<DerivedInference['judgment']>().toEqualTypeOf<DerivedJudgment>();
    expectTypeOf<DerivedInference['input']>().toEqualTypeOf<Inference['input']>();
  });
});
