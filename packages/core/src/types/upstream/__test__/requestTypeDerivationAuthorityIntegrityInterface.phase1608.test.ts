import { describe, expectTypeOf, it } from 'vitest';
import { createRequestTypeDerivationSemanticAuthorityIntegrity } from '../../../compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationContractEquivalenceInterface,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationSemanticAuthorityIntegrityResult,
  RequestTypeDerivationInput,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type BaseInference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type SpecializedInference = BaseInference & Readonly<{ readonly provenance: 'phase1608' }>;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, SpecializedInference>;
type Verification = RequestTypeDerivationSemanticVerificationFor<Contract, SpecializedInference>;
type Integrity = RequestTypeDerivationSemanticAuthorityIntegrityInterface<Contract, SpecializedInference>;

describe('request type derivation authority integrity interface phase1611', () => {
  it('exposes a concrete validator with the closed interface contract', () => {
    expectTypeOf(createRequestTypeDerivationSemanticAuthorityIntegrity)
      .parameter(0)
      .toMatchTypeOf<{ readonly contract: Contract; readonly contractEquivalence: RequestTypeDerivationContractEquivalenceInterface<Contract> }>();
  });
  it('binds integrity validation to the exact invocation input and verifier envelope', () => {
    expectTypeOf<Parameters<Integrity['validate']>[0]>().toEqualTypeOf<RequestTypeDerivationInput>();
    expectTypeOf<Parameters<Integrity['validate']>[1]>().toEqualTypeOf<Candidate>();
    expectTypeOf<Parameters<Integrity['validate']>[2]>().toEqualTypeOf<Verification>();
  });

  it('requires one explicit contract-equivalence policy for all contract witnesses', () => {
    expectTypeOf<Integrity['contractEquivalence']>()
      .toEqualTypeOf<RequestTypeDerivationContractEquivalenceInterface<Contract>>();
    expectTypeOf<Parameters<Integrity['contractEquivalence']['equivalent']>>()
      .toEqualTypeOf<[Contract, Contract]>();
    expectTypeOf<ReturnType<Integrity['contractEquivalence']['equivalent']>>()
      .toEqualTypeOf<boolean>();
  });

  it('returns a closed valid-or-invalid integrity result without widening inference', () => {
    expectTypeOf<ReturnType<Integrity['validate']>>()
      .toEqualTypeOf<RequestTypeDerivationSemanticAuthorityIntegrityResult<Contract, SpecializedInference>>();
    expectTypeOf<Extract<ReturnType<Integrity['validate']>, { readonly kind: 'integrity_valid' }>['candidate']>()
      .toEqualTypeOf<Candidate>();
    expectTypeOf<Extract<ReturnType<Integrity['validate']>, { readonly kind: 'integrity_invalid' }>['violations'][number]>()
      .toEqualTypeOf<
        | 'authority_contract_mismatch'
        | 'verification_contract_mismatch'
        | 'inference_packet_mismatch'
        | 'source_input_mismatch'
        | 'judgment_mismatch'
        | 'verification_result_mismatch'
      >();
  });
});
