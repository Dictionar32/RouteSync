import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityProofFor,
  RequestTypeDerivationSemanticVerificationBindingFor,
  RequestTypeDerivationVerification,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Binding = RequestTypeDerivationSemanticVerificationBindingFor<Contract, Inference>;
type Proof = RequestTypeDerivationSemanticAuthorityProofFor<Contract, Inference>;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, Inference>;

describe('request type derivation authority verification binding phase1604', () => {
  it('keeps the verification result canonical in decision premises', () => {
    expectTypeOf<keyof Binding>().toEqualTypeOf<'contract' | 'inference'>();
    expectTypeOf<Proof['verificationBinding']>().toEqualTypeOf<Binding>();
    expectTypeOf<Proof['premises']['verification']>().not.toBeAny();
    expectTypeOf<Proof['verificationBinding']>().not.toHaveProperty('result');
  });

  it('retains contract and inference correlation at the candidate boundary', () => {
    expectTypeOf<Candidate['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<Candidate['proof']['verificationBinding']['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<Candidate['proof']['verificationBinding']['inference']>().toEqualTypeOf<Inference>();
  });

  it('does not substitute the correlation witness for the verification outcome', () => {
    expectTypeOf<Proof['premises']['verification']>().toMatchTypeOf<RequestTypeDerivationVerification>();
  });
});
