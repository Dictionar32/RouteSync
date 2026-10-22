import { describe, it, expectTypeOf } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticDecisionInterface,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationSemanticPipelineCompositionInterface['contract'];
type DecisionCandidate = ReturnType<RequestTypeDerivationSemanticDecisionInterface<Contract>['decide']>;
type AuthorityCandidate = Parameters<RequestTypeDerivationSemanticAuthorityInterface<Contract>['evaluate']>[1];

describe('request type derivation candidate contract binding phase1598', () => {
  it('binds the decision output to the same contract family as the premises', () => {
    expectTypeOf<DecisionCandidate>().toEqualTypeOf<RequestTypeDerivationSemanticAuthorityCandidateFor<Contract>>();
    expectTypeOf<DecisionCandidate['contract']>().toEqualTypeOf<Contract>();
    expectTypeOf<DecisionCandidate['proof']>().toMatchTypeOf<object>();
  });

  it('requires authority evaluation to consume the contract-bound candidate envelope', () => {
    expectTypeOf<AuthorityCandidate>().toEqualTypeOf<DecisionCandidate>();
    expectTypeOf<AuthorityCandidate['contract']>().toMatchTypeOf<RequestTypeDerivationContract>();
  });
});
