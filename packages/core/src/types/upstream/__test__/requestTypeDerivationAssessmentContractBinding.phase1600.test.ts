import { describe, it, expectTypeOf } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticPipelineDerivationResult,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeAuthorityCoverageEvidenceFor,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Assessment = RequestTypeDerivationSemanticAuthorityAssessmentFor<Contract>;

describe('request type derivation assessment contract binding phase1600', () => {
  it('preserves contract-bound coverage in every assessment decision', () => {
    type Decision = Assessment['decision'];
    expectTypeOf<Decision['premises']['coverage']>()
      .toMatchTypeOf<RequestTypeAuthorityCoverageEvidenceFor<Contract>>();
  });

  it('keeps pipeline output bound to its contract family', () => {
    type Pipeline = RequestTypeDerivationSemanticPipelineInterface<Contract>;
    expectTypeOf<ReturnType<Pipeline['derive']>>()
      .toEqualTypeOf<RequestTypeDerivationSemanticPipelineDerivationResult<Contract>>();
    expectTypeOf<Extract<ReturnType<Pipeline['derive']>, { readonly kind: 'integrity_rejected' }>['integrity']['kind']>()
      .toEqualTypeOf<'integrity_invalid'>();
  });

  it('keeps authority output bound to the candidate contract family', () => {
    type Authority = RequestTypeDerivationSemanticAuthorityInterface<Contract>;
    type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract>;
    expectTypeOf<ReturnType<Authority['evaluate']>>()
      .toEqualTypeOf<Assessment>();
    expectTypeOf<Parameters<Authority['evaluate']>[1]>()
      .toEqualTypeOf<Candidate>();
  });
});
