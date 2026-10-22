import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticInferenceFor,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, Inference>;
type Assessment = RequestTypeDerivationSemanticAuthorityAssessmentFor<Contract, Inference>;
type Authority = RequestTypeDerivationSemanticAuthorityInterface<Contract>;

describe('request type derivation authority inference preservation phase1605', () => {
  it('preserves the inference parameter through every assessment branch', () => {
    expectTypeOf<Assessment['decision']['verificationBinding']['inference']>()
      .toEqualTypeOf<Inference>();
    expectTypeOf<Assessment['decision']['verificationBinding']['contract']>()
      .toEqualTypeOf<Contract>();
  });

  it('accepts only a candidate whose contract and inference family are bound together', () => {
    expectTypeOf<Candidate['proof']['verificationBinding']['inference']>()
      .toEqualTypeOf<Inference>();
    expectTypeOf<Authority['evaluate']>().toBeFunction();
  });
});
