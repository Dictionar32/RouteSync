import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
  RequestTypeDerivationProofVerificationInterface,
  RequestTypeDerivationSemanticDecisionPremises,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type Verification = RequestTypeDerivationSemanticVerificationFor<Contract, Inference>;

describe('request type derivation verification binding phase1602', () => {
  it('keeps the exact inference packet inside the verification envelope', () => {
    expectTypeOf<Verification['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<Verification['inference']>().toEqualTypeOf<Inference>();
    expectTypeOf<Verification['result']>().not.toBeAny();
  });

  it('returns an inference-bound envelope from the verifier boundary', () => {
    type Verifier = RequestTypeDerivationProofVerificationInterface<Contract>;
    type Result = ReturnType<Verifier['verify']>;
    expectTypeOf<Result['inference']>().toEqualTypeOf<Inference>();
  });

  it('requires decision premises to carry verification bound to their inference', () => {
    type Premises = RequestTypeDerivationSemanticDecisionPremises<Contract, Inference>;
    expectTypeOf<Premises['inference']>().toEqualTypeOf<Inference>();
    expectTypeOf<Premises['verification']>().toEqualTypeOf<Verification>();
  });
});
