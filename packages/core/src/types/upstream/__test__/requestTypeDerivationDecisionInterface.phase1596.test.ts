import { describe, it, expectTypeOf } from 'vitest';
import type {
  RequestTypeDerivationSemanticDecisionInterface,
  RequestTypeDerivationSemanticDecisionPremises,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '../requestTypeDerivationInterface';

type CompositionDecision = RequestTypeDerivationSemanticPipelineCompositionInterface['decision'];
type DecisionInput = Parameters<RequestTypeDerivationSemanticDecisionInterface['decide']>[0];

describe('request type derivation decision interface phase1596', () => {
  it('requires a semantic decision capability in pipeline composition', () => {
    expectTypeOf<CompositionDecision>().toEqualTypeOf<
      RequestTypeDerivationSemanticDecisionInterface
    >();
  });

  it('accepts one typed packet containing every decision premise', () => {
    expectTypeOf<DecisionInput>().toEqualTypeOf<
      RequestTypeDerivationSemanticDecisionPremises
    >();
  });
});
