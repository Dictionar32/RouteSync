import { describe, it, expectTypeOf } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityProofFor,
  RequestTypeAuthorityCoverageEvidenceFor,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract>;
type Proof = RequestTypeDerivationSemanticAuthorityProofFor<Contract>;

describe('request type derivation proof contract binding phase1599', () => {
  it('keeps proof coverage under the candidate contract family', () => {
    expectTypeOf<Candidate['proof']>().toEqualTypeOf<Proof>();
    expectTypeOf<Candidate['proof']['premises']['coverage']>()
      .toEqualTypeOf<RequestTypeAuthorityCoverageEvidenceFor<Contract>>();
  });

  it('keeps the proof itself closed over the decision candidate type', () => {
    expectTypeOf<Proof>().toMatchTypeOf<object>();
    expectTypeOf<Candidate['contract']>().toEqualTypeOf<Contract>();
  });
});
