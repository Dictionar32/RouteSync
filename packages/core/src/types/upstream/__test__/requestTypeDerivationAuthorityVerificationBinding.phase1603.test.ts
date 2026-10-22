import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityProofFor,
  RequestTypeDerivationSemanticVerificationFor,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Verification = RequestTypeDerivationSemanticVerificationFor<Contract, Inference>;
type Proof = RequestTypeDerivationSemanticAuthorityProofFor<Contract, Inference>;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, Inference>;

describe('request type derivation authority verification binding phase1603', () => {
  it('retains inference-bound verification in the authority proof', () => {
    expectTypeOf<Proof['verificationBinding']>().toEqualTypeOf<Verification>();
    expectTypeOf<Proof['verificationBinding']['inference']>().toEqualTypeOf<Inference>();
    expectTypeOf<Candidate['proof']>().toEqualTypeOf<Proof>();
  });

  it('keeps the contract and inference parameters visible at the candidate boundary', () => {
    expectTypeOf<Candidate['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<Candidate['proof']['verificationBinding']['contract']>().toEqualTypeOf<Contract>();
  });
});
