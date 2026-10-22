import { describe, expectTypeOf, it } from 'vitest';
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationSemanticDecisionInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticPipelineAssemblerInterface,
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticReasoningInterface,
  RequestTypeDerivationProofVerificationInterface,
  RequestTypeDerivationSemanticVerificationFor,
  RequestTypeDerivationSemanticPipelineDerivationResult,
} from '../requestTypeDerivationInterface';

type Contract = RequestTypeDerivationContract;
type BaseInference = RequestTypeDerivationSemanticInferenceFor<Contract>;
type SpecializedInference = BaseInference & Readonly<{ readonly provenance: 'phase1607' }>;
type Reasoning = RequestTypeDerivationSemanticReasoningInterface<Contract, SpecializedInference>;
type Verifier = RequestTypeDerivationProofVerificationInterface<Contract, SpecializedInference>;
type Decision = RequestTypeDerivationSemanticDecisionInterface<Contract, SpecializedInference>;
type Authority = RequestTypeDerivationSemanticAuthorityInterface<Contract, SpecializedInference>;
type Integrity = RequestTypeDerivationSemanticAuthorityIntegrityInterface<Contract, SpecializedInference>;
type Composition = RequestTypeDerivationSemanticPipelineCompositionInterface<Contract, SpecializedInference>;
type Pipeline = RequestTypeDerivationSemanticPipelineInterface<Contract, SpecializedInference>;
type Assembler = RequestTypeDerivationSemanticPipelineAssemblerInterface<Contract, SpecializedInference>;
type Assessment = RequestTypeDerivationSemanticAuthorityAssessmentFor<Contract, SpecializedInference>;

describe('request type derivation capability inference closure phase1607', () => {
  it('preserves the specialized inference through reasoning and verification', () => {
    expectTypeOf<ReturnType<Reasoning['infer']>>().toEqualTypeOf<SpecializedInference>();
    expectTypeOf<ReturnType<Verifier['verify']>>().toEqualTypeOf<
      RequestTypeDerivationSemanticVerificationFor<Contract, SpecializedInference>
    >();
    expectTypeOf<Parameters<Verifier['verify']>[0]>().toEqualTypeOf<SpecializedInference>();
  });

  it('preserves one inference contract through decision and authority', () => {
    expectTypeOf<Parameters<Decision['decide']>[0]['inference']>()
      .toEqualTypeOf<SpecializedInference>();
    expectTypeOf<ReturnType<Decision['decide']>['proof']['verificationBinding']['inference']>()
      .toEqualTypeOf<SpecializedInference>();
    expectTypeOf<Parameters<Authority['evaluate']>[1]>()
      .toEqualTypeOf<RequestTypeDerivationSemanticAuthorityCandidateFor<Contract, SpecializedInference>>();
    expectTypeOf<ReturnType<Authority['evaluate']>>().toEqualTypeOf<Assessment>();
  });

  it('does not widen inference across composition, assembly, or the public pipeline', () => {
    expectTypeOf<Composition['reasoning']>().toEqualTypeOf<Reasoning>();
    expectTypeOf<Composition['verifier']>().toEqualTypeOf<Verifier>();
    expectTypeOf<Composition['decision']>().toEqualTypeOf<Decision>();
    expectTypeOf<Composition['authority']>().toEqualTypeOf<Authority>();
    expectTypeOf<Composition['integrity']>().toEqualTypeOf<Integrity>();
    expectTypeOf<ReturnType<Pipeline['derive']>>().toEqualTypeOf<
      RequestTypeDerivationSemanticPipelineDerivationResult<Contract, SpecializedInference>
    >();
    expectTypeOf<ReturnType<Assembler['assemble']>>().toEqualTypeOf<
      RequestTypeDerivationSemanticPipelineAssemblyResult<Contract, SpecializedInference>
    >();
  });
});
