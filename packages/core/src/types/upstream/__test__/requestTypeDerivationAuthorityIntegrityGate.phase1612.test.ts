import { describe, expectTypeOf, it } from 'vitest';
import { createRequestTypeDerivationAuthorityIntegrityGate } from '../../../compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrityGate';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationInput,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
} from '../requestTypeDerivationInterface';
import type { RequestTypeDerivationAuthorityIntegrityGateResult } from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Candidate = RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, Inference>;
type Verification = RequestTypeDerivationSemanticVerificationFor<Contract, Inference>;
type Authority = RequestTypeDerivationSemanticAuthorityInterface<Contract, Inference>;
type Integrity = RequestTypeDerivationSemanticAuthorityIntegrityInterface<Contract, Inference>;
type GateResult = RequestTypeDerivationAuthorityIntegrityGateResult<Contract, Inference>;
type Factory = typeof createRequestTypeDerivationAuthorityIntegrityGate<Contract, Inference>;
type Gate = ReturnType<Factory>;

describe('request type derivation authority integrity gate phase1612', () => {
  it('requires authority and integrity capabilities from the same contract family', () => {
    expectTypeOf<Parameters<Factory>[0]>().toEqualTypeOf<Authority>();
    expectTypeOf<Parameters<Factory>[1]>().toEqualTypeOf<Integrity>();
  });

  it('requires the original invocation input, candidate and verifier envelope', () => {
    type Evaluate = Parameters<Gate['evaluate']>;
    expectTypeOf<Evaluate[0]>().toEqualTypeOf<RequestTypeDerivationInput>();
    expectTypeOf<Evaluate[1]>().toEqualTypeOf<Candidate>();
    expectTypeOf<Evaluate[2]>().toEqualTypeOf<Verification>();
  });

  it('has a closed result that either rejects integrity or returns authority assessment', () => {
    type Evaluate = ReturnType<Gate['evaluate']>;
    expectTypeOf<Evaluate>().toEqualTypeOf<GateResult>();
    expectTypeOf<Extract<Evaluate, { readonly kind: 'integrity_rejected' }>['integrity']['kind']>()
      .toEqualTypeOf<'integrity_invalid'>();
    expectTypeOf<Extract<Evaluate, { readonly kind: 'authority_evaluated' }>['assessment']>()
      .toEqualTypeOf<ReturnType<Authority['evaluate']>>();
  });
});
