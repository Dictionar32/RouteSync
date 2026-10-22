import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticReasoningInterface,
  RequestTypeDerivationProofVerificationInterface,
  RequestTypeDerivationSemanticDecisionPremises,
  RequestTypeDerivationSemanticInputPreparation,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type Inference = RequestTypeDerivationSemanticInferenceFor<Contract>;

describe('request type derivation inference contract phase1601', () => {
  it('binds the inferred input and judgment to one contract-bearing packet', () => {
    expectTypeOf<Inference['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<Inference['input']>().not.toBeAny();
    expectTypeOf<Inference['preparedInput']>().toEqualTypeOf<RequestTypeDerivationSemanticInputPreparation<Inference['input']>>();
    expectTypeOf<Inference['judgment']>().not.toBeAny();
  });

  it('makes verifier consume the exact inference packet instead of loose input/judgment arguments', () => {
    type Verifier = RequestTypeDerivationProofVerificationInterface<Contract>;
    expectTypeOf<Parameters<Verifier['verify']>>().toEqualTypeOf<[Inference]>();
  });

  it('makes reasoning produce the same contract-bound inference packet', () => {
    type Reasoning = RequestTypeDerivationSemanticReasoningInterface<Contract>;
    expectTypeOf<Parameters<Reasoning['infer']>>().toEqualTypeOf<[Inference['preparedInput']]>();
    expectTypeOf<ReturnType<Reasoning['infer']>>().toEqualTypeOf<Inference>();
  });

  it('uses the inference packet as the decision premise source', () => {
    type Premises = RequestTypeDerivationSemanticDecisionPremises<Contract>;
    expectTypeOf<Premises['inference']>().toEqualTypeOf<Inference>();
  });
});
