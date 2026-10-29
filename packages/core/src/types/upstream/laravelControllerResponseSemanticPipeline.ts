import { laravelControllerAstProjectionSemanticAuthority } from './laravelControllerAstProjectionSemanticAuthority';
import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import { createClassName, createModelName, createPropertyName, createResponseTypeName } from './names';
import { phpClassNameResolutionAuthority } from './phpClassNameResolutionAuthority';
import { laravelControllerResponseDtoDeclarationResolutionAuthorityFactory } from './laravelControllerResponseDtoDeclarationResolutionAuthority';
import { laravelDtoTypeReferenceBindingAuthorityFactory } from './laravelDtoTypeReferenceBindingAuthority';
import { laravelDtoResponseContractProjectionAuthority } from './laravelDtoResponseContractProjectionAuthority';
import { createDomainAstJudgment } from './ast';
import type { ResponseDefinition, ResponseResult, ResponseStatus, ResponseTransport } from './response';
import type { TypeExpression, TypeExpressions, TypeParameter, TypeParameters, TypeProperty } from './typeVocabulary';
import type { SemanticValue } from './primitiveVocabulary';
import type { ModelReference, ResourceReference } from './semanticReferences';
import type { ResourceDefinition, ResourceField } from './resource';
import type { ControllerReturnSemantic, ControllerModelOrigin } from './controller';
import type { Sequence } from './collections';
import type { SourceSpan } from './provenance';
import type {
  LaravelControllerInvocationSemanticJudgmentInterface,
} from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelControllerResponseSemanticPipelineDependenciesInterface } from './laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface } from './laravelControllerResponseDtoDeclarationInterface';
import type { PhpClassNameResolutionRuleInterface } from './phpClassNameResolutionInterface';
import type { LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';
import type { LaravelDtoTypeReferenceBindingAuthorityInterface } from './laravelDtoTypeReferenceBindingInterface';
import type {
  LaravelControllerResponseEvidenceProductionContract,
  LaravelControllerResponseEvidenceProductionCoverage,
  LaravelControllerResponseEvidenceProductionInput,
  LaravelControllerResponseEvidenceProductionInterface,
  LaravelControllerResponseEvidenceProductionInventory,
  LaravelControllerResponseEvidenceProductionObservation,
  LaravelControllerResponseEvidenceProductionEvidence,
  LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment,
  LaravelControllerResponseEvidenceSourceBindingAuthorityInterface,
  LaravelControllerResponseEvidenceSourceBindingContract,
  LaravelControllerResponseEvidenceSourceBindingInput,
  LaravelControllerResponseEvidenceSourceBindingJudgment,
  LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput,
  LaravelControllerResponseEvidenceSourceBindingEntry,
  LaravelControllerResponseEvidenceSourceBindingRejectedJudgment,
  LaravelControllerResponseSemanticBlocker,
  LaravelControllerResponseSemanticEvidence,
  LaravelControllerResponseSemanticProduct,
  LaravelControllerMethodReturnSemantic,
  LaravelControllerMethodResponseProduct,
  LaravelControllerMethodResponseAstProjectionContract,
  LaravelControllerMethodResponseAstProjectionInterface,
  LaravelControllerMethodResponseAstProjectionJudgment,
  LaravelControllerMethodResponseAstProjectionInput,
  LaravelControllerResponseOutputTypeInput,
  LaravelControllerResponsePaginationEnvelopeContract,
  LaravelControllerPaginationMetadataProfileContract,
  LaravelFrameworkVersionLockEvidence,
  LaravelFrameworkVersionCompatibilityJudgmentContract,
  LaravelFrameworkVersionCompatibilityJudgmentInput,
  LaravelFrameworkVersionCompatibilityJudgmentInterface,
  LaravelControllerPaginationMetadataProfileInput,
  LaravelControllerPaginationMetadataProfileJudgment,
  LaravelFrameworkVersionCompatibility,
  LaravelControllerPaginationMetadataProfileInterface,
  LaravelControllerResponsePaginationEnvelopeInput,
  LaravelControllerResponsePaginationEnvelopeJudgment,
  LaravelControllerResponsePaginationEnvelopeJudgmentInterface,
  LaravelControllerResponseOutputTypeJudgment,
  LaravelControllerResponseOutputTypeJudgmentContract,
  LaravelControllerResponseOutputTypeJudgmentInterface,
  LaravelControllerReturnResponseProjectionContract,
  LaravelControllerReturnResponseProjectionInterface,
  LaravelControllerReturnResponseProjectionJudgment,
  LaravelControllerResponseSemanticJudgmentAuthorityInterface,
  LaravelControllerResponseSemanticJudgmentContract,
  LaravelControllerResponseSemanticJudgmentFromInput,
  LaravelControllerResponseSemanticJudgmentInput,
  LaravelControllerResponseSemanticJudgment,
  LaravelControllerResponseIntegratedJudgmentInput,
  LaravelControllerIntegratedResponseJudgment,
  LaravelControllerResponseSemanticJudgmentFor,
  LaravelControllerResponseSemanticPipelineContract,
  LaravelControllerResponseSemanticPipelineInterface,
  LaravelControllerResponseSemanticRuntimeExecutorInterface,
  LaravelControllerResponseDeclarationSourceCorrelationInput,
} from './laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelControllerResponseDtoDeclarationResolutionJudgment, LaravelDtoDeclarationResolvedSourceEvidence } from './laravelControllerResponseDtoDeclarationInterface';
import type { DtoProperty } from './application';
import type { LaravelDtoPropertyTypeReferenceBindingEvidence } from './laravelDtoTypeReferenceBindingInterface';
import type { LaravelDtoResponseContractProjectionAuthorityInterface, LaravelDtoResponseContractProjectionJudgment } from './laravelDtoResponseContractProjectionInterface';

const emptyResponseEvidence: readonly [] = Object.freeze([]);
const emptyBindingEvidence: readonly [] = Object.freeze([]);
const responseEvidenceProductionCoverage: LaravelControllerResponseEvidenceProductionCoverage = Object.freeze({
  kind: 'response_evidence_production_partial',
  producedEvidence: ['observed_controller_return', 'controller_action_response_reference_candidate', 'response_attribute_source'] as const,
  missingEvidence: ['resolved_response_attribute_descriptor', 'response_dto_declaration'] as const,
  currentOwner: 'legacy_controller_action_contract_and_response_attribute_scanner',
  targetOwner: 'existing_LaravelControllerResponseEvidenceProductionInterface',
  closure: 'parsed-response-attribute-source-enters-through-the-existing-producer;the-integrated-pipeline-runs-existing-PHP-class-name-and-DTO-declaration-authorities;binds-class-typed-properties;and-projects-resolved-response-DTOs-through-the-existing-projection-interface;resolved-response-attribute-descriptor-remains-open-before-legacy-descriptor-derivation-can-be-retired',
});

const evidenceProductionContract: LaravelControllerResponseEvidenceProductionContract = Object.freeze({
  kind: 'laravel_controller_response_evidence_production_contract',
  contractVersion: 10,
  evidenceOwner: 'ControllerDeclarationEvidence.methods.returnExpressions-responseAttribute-action-and-method-source-span',
  declarationSourceCorrelationRule: 'source-correlation-is-a-closed-ADT-with-same-source-and-different-source-outcomes;producer-input-admits-only-the-same-source-receipt-issued-by-LaravelSourceIdentitySemanticsInterface;different-source-outcome-is-rejected-before-evidence-production;producer-must-not-recompute-or-infer-identity',
  declarationSourceCorrelationRejectionRule: 'different-source-file-identity-is-retained-as-controller_response_evidence_declaration_source_correlation_rejected-and-cannot-be-used-as-a-production-input-or-produce-response-evidence',
  presentResponseRule: 'each-method-retains-parser-observed-return-expressions-as-direct-source-evidence-and-may-also-retain-a-separate-descriptor-response-reference-candidate;descriptor-candidate-is-never-relabelled-as-parser-return-evidence',
  responseAttributeRule: 'each-method-retains-the-parsed-response-attribute-as-source-evidence-separate-from-resolved-descriptor-and-HTTP-return-meaning;declared-attribute-evidence-uses-the-exact-attribute-token-span-while-absence-retains-method-observation-provenance',
  descriptorAbsenceRule: 'response-absent-action-descriptors-produce-no-descriptor-candidate-but-do-not-erase-parser-observed-return-expressions',
  outputRule: 'every-declared-method-is-retained-as-one-canonical-observation;direct-return-evidence-and-descriptor-candidates-are-flattened-without-losing-origin;zero-evidence-produces-an-explicit-empty-inventory',
  noSemanticPromotion: 'response-reference-is-evidence-only-and-must-not-be-promoted-to-a-closed-response-product-by-the-producer',
  methodCoverageRule: 'each-declaration-evidence-method-is-represented-exactly-once-by-one-observation-preserving-method-evidence-action-and-parser-return-evidence',
  correlationRetentionRule: 'every-produced-inventory-retains-the-exact-input-declaration-source-correlation-receipt',
  sourceBindingRule: 'parser-observed-return-expressions-and-descriptor-response-reference-candidates-enter-source-binding-as-distinct-evidence-kinds;neither-is-promoted-to-a-closed-response-product-without-semantic-classification',
  coverageRule: 'the-complete-project-scoped-DTO-discovery-inventory-is-preserved-as-a-closed-ADT-through-production-and-source-binding;the-integrated-response-composer-consumes-existing-class-name-and-DTO-declaration-judgments;binds-class-typed-properties;and-produces-DTO-to-ResponseContract-projection-judgments;resolved-response-attribute-descriptor-remains-open',
});

const evidenceSourceBindingContract: LaravelControllerResponseEvidenceSourceBindingContract = Object.freeze({
  kind: 'laravel_controller_response_evidence_source_binding_contract',
  contractVersion: 9,
  owner: 'LaravelSourceIdentitySemanticsInterface',
  cardinality: 'one-source-identity-judgment-per-response-evidence-item',
  coverage: 'every-response-evidence-item-is-represented-exactly-once-with-no-omissions-or-duplicates',
  completeMeaning: 'non-empty-evidence-set-and-every-item-is-bound-to-the-exact-invocation-source-subject',
  emptyMeaning: 'zero-evidence-is-an-explicit-empty-receipt-and-never-a-complete-binding',
  rejectedMeaning: 'at-least-one-evidence-item-has-a-different-source-file-identity-and-all-other-items-remain-represented',
  emptyOutcome: 'zero-evidence-is-represented-by-controller_response_evidence_source_binding_empty-not-by-an-empty-complete-or-rejected-tuple',
  noInference: 'response-authority-must-not-infer-source-identity-from-path-text-or-controller-name',
  producerBoundary: 'controller-owned-response-evidence-is-bound-by-existing-source-identity-semantics;same-project-DTO-inventory-is-carried-as-separate-context-and-is-not-compared-to-the-invocation-file-as-if-it-were-controller-local-evidence',
  inventoryOutcome: 'empty-inventory-produces-only-empty-receipt;non-empty-inventory-produces-complete-or-rejected-receipt',
  observationOwnership: 'every-bound-evidence-item-retains-the-exact-controller-method-observation-that-produced-it-and-the-receipt-retains-all-method-observations-including-methods-with-zero-evidence',
  observationCoverage: 'binding-iterates-canonical-observations-and-their-evidence;flattened-inventory-is-not-the-source-of-method-association;all-canonical-method-observations-remain-on-the-receipt',
});

const responseJudgmentContract: LaravelControllerResponseSemanticJudgmentContract = Object.freeze({
  kind: 'laravel_controller_response_semantic_judgment_contract',
  contractVersion: 13,
  evidenceRule: 'descriptor-derived-response-reference-is-a-candidate-not-direct-PHP-return-proof;attribute-return-and-DTO-observations-remain-source-evidence-until-a-closed-response-product-is-published;integrated-response-composition-retains-PHP-class-name-and-DTO-declaration-judgments-as-project-context-and-retains-property-reference-binding-and-DTO-ResponseContract-projection-judgments-separately-from-controller-local-evidence',
  invocationCorrelation: 'response-judgment-is-indexed-by-the-controller-artifact-invocation-outcome-and-retains-that-exact-invocation-subtype-without-reconstruction-or-widening',
  sourceBinding: 'every-response-evidence-item-carries-an-explicit-source-identity-judgment-against-the-exact-invocation-source-subject',
  descriptorCandidateBoundary: 'source-identity-binding-proves-source-file-identity-only;it-does-not-upgrade-a-controller-action-descriptor-response-reference-candidate-into-direct-PHP-return-evidence',
  outputRule: 'fully-projectable-canonical-method-returns-produce-controller_response_method_products_complete;otherwise-canonical-return-closure-remains-controller_response_return_semantics_complete;legacy-products-remain-only-when-proven;blocked-evidence-is-never-coerced-to-empty-success',
  canonicalReturnOwnership: 'method-response-product-reads-action.semantic.returned-from-the-existing-ControllerReturnSemantic-ADT-without-reclassifying-PHP-syntax',
  sourceBindingOutcomeRule: 'a-rejected-response-evidence-source-binding-produces-controller_response_evidence_source_binding_rejected-with-the-original-invocation-and-receipt;an-empty-receipt-can-only-preserve-not-connected-rejected-or-blocked-outcomes;neither-can-produce-controller_response_complete',
  evidenceCoverageRule: 'every-response-evidence-item-is-correlated-exactly-once;complete-binding-is-non-empty;zero-evidence-has-an-explicit-empty-outcome-that-cannot-produce-controller_response_complete',
  compositionRule: 'integrated-response-composition-consumes-closed-PHP-class-name-and-DTO-declaration-judgments;binds-class-typed-properties-on-each-resolved-response-DTO;then-projects-each-resolved-response-DTO-through-the-existing-LaravelDtoResponseContractProjectionAuthorityInterface;unresolved-field-projection-blocks-response-completion',
  methodProductOwnershipRule: 'each-controller-method-response-product-carries-only-DTO-response-contract-projection-judgments-owned-by-that-exact-canonical-method-evidence;non-controller DTO property owners never enter method products;AST projection forwards the enriched product without rebuilding the association',
  descriptorEvidenceRule: 'controller-action-response-reference-candidate-retains-descriptor-origin-and-must-not-be-relabelled-as-a-parser-observed-PHP-return',
  astProjectionRule: 'controller-artifact-carries-the-response-judgment-as-a-closed-ADT-and-source-AST-projection-forwards-the-artifact-without-reconstructing-response-meaning',
  runtimeRule: 'runtime-executor-only-delegates-to-the-response-authority-and-forwards-its-closed-judgment-without-reasoning-or-reconstruction',
  authorityOwnership: 'this-authority-closes-Laravel-HTTP-response-meaning-and-does-not-replace-or-duplicate-the-PHP-invocation-semantic-authority',
  executorOwnership: 'executor-delegates-to-the-declared-response-authority-and-preserves-the-exact-outcome-indexed-ADT',
  sourceIdentityOwnership: 'existing-Laravel-source-identity-semantics-owns-each-evidence-to-invocation-source-identity-judgment',
});

const pipelineContract: LaravelControllerResponseSemanticPipelineContract = Object.freeze({
  kind: 'laravel_controller_response_semantic_pipeline_contract',
  contractVersion: 31,
  identityOwner: 'LaravelSourceIdentitySemanticsInterface',
  evidenceOwner: 'LaravelControllerResponseEvidenceProductionInterface',
  evidenceProductionDependencyRule: 'integrated-response-uses-the-exact-evidence-producer-carried-by-the-complete-dependency-contract',
  methodProjectionDependencyRule: 'method-response-AST-projection-and-output-type-judgment-are-one-composed-authority-contract',
  bindingOwner: 'LaravelControllerResponseEvidenceSourceBindingAuthorityInterface',
  dtoTypeReferenceBindingOwner: 'LaravelDtoTypeReferenceBindingAuthorityInterface',
  dtoResolutionDependencyClosureRule: 'controller-response-and-DTO-property-resolution-consume-the-class-name-and-declaration-authorities-owned-by-the-same-DTO-type-reference-binding-dependency-contract',
  dtoResponseContractProjectionOwner: 'LaravelDtoResponseContractProjectionAuthorityInterface',
  dtoProjectionBindingScopeRule: 'each-DTO-response-contract-projection-receives-only-property-reference-bindings-owned-by-that-exact-resolved-DTO-declaration;cross-DTO-bindings-are-excluded-before-the-projection-interface-is-called',
  methodResponseProductProvenanceRule: 'each-method-response-product-carries-only-DTO-response-contract-projections-owned-by-the-exact-canonical-method-evidence;the-AST-projection-forwards-that-complete-product-without-reconstructing-association',
  responseMeaningOwner: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface',
  responseAuthorityDependencyRule: 'pipeline-uses-the-authority-carried-by-its-complete-dependency-contract;identity-correlation-and-source-binding-use-that-authority-same-identity-owner',
  responseExecutorDependencyRule: 'runtime-executor-is-constructed-from-the-exact-response-semantic-authority-in-the-complete-pipeline-dependency-contract',
  executionOwner: 'LaravelControllerResponseSemanticRuntimeExecutorInterface',
  responseOutputTypeOwner: 'LaravelControllerResponseOutputTypeJudgmentInterface',
  paginationEnvelopeOwner: 'LaravelControllerResponseOutputTypeJudgmentInterface.paginationEnvelope',
  paginationMetadataProfileOwner: 'LaravelControllerResponsePaginationEnvelopeJudgmentInterface.metadataProfile',
  frameworkVersionEvidenceOwner: 'composer.lock laravel/framework package entry',
  frameworkVersionCompatibilityRule: 'scanner-acquires-composer-lock-facts-only;the-existing-pagination-metadata-profile-interface-judges-version-compatibility-and-only-verified-Laravel-12.x-is-admitted',
  paginationMetadataProvenanceRule: 'framework-default-metadata-fields-are-typed-from-canonical-pagination-kind-and-retain-method-source-provenance-not-inferred-runtime-values',
  paginationEnvelopeRule: 'framework-owned-pagination-envelope-is-a-typed-ADT-projection-and-custom-resource-pagination-information-remains-unresolved',
  methodResponseAstProjectionOwner: 'LaravelControllerMethodResponseAstProjectionInterface',
  resourceOutputShapeOwner: 'resolved-LaravelResourceScanJudgment-definitions',
  resourceOutputShapeRule: 'resource-output-type-is-derived-only-from-unique-resolved-ResourceDefinition-fields-and-is-unresolved-when-dynamic-or-custom-response-shape-is-present',
  astProjectionOwner: 'LaravelControllerAstProjectionSemanticAuthorityInterface',
  sourceCorrelationOrder: 'exact-invocation-source-and-declaration-source-to-existing-source-identity-authority-to-closed-correlation-ADT-before-evidence-production',
  sourceCorrelationProjectionOwner: 'LaravelControllerResponseSemanticPipelineInterface.correlateDeclarationSource-asks-LaravelSourceIdentitySemanticsInterface-to-judge-the-exact-invocation-and-declaration-source-operands-and-wraps-that-result-without-reimplementing-identity',
  integratedJudgmentOwner: 'LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse',
  integratedJudgmentRule: 'one-interface-method-composes-source-correlation-evidence-production-source-binding-and-response-judgment-without-reconstructing-the-invocation-judgment',
  dtoDiscoveryBoundary: 'integrated-response-input-requires-a-complete-project-scoped-discovery-receipt;class-typed-properties-are-bound-and-response-DTOs-are-projected-through-existing-upstream-interfaces;legacy-evidence-projection-is-derived-only-inside-the-existing-pipeline',
  dtoPropertyReferenceBindingRule: 'each-class-reference-property-on-each-resolved-response-DTO-is-bound-through-the-existing-php-class-name-and-DTO-declaration-authorities;unresolved-property-binding-blocks-response-completion-and-is-retained-as-project-context-evidence',
  sourceCorrelationInputIntegrity: 'caller-cannot-supply-an-independent-identity-judgment;correlation-pipeline-derives-the-judgment-from-the-exact-sources-carried-by-invocationJudgment-and-declarationEvidence',
  responseOrder: 'produced-evidence-and-all-method-observations-to-per-item-source-binding-judgment-to-existing-ControllerReturnSemantic-ADT-product-to-typed-ResponseResult-projection-to-response-executor-to-method-ResponseDefinition-and-ResponseAst-projection-to-controller-AST-projection',
  responseAstProjectionRule: 'production-response-scanner-consumes-only-closed-method-response-products-from-controller-scan-and-does-not-rescan-or-reclassify-controller-return-syntax',
  methodEvidenceOwnership: 'source-binding-entry-retains-the-exact-canonical-method-observation-and-action-that-own-the-evidence',
  astProjectionOrder: 'the-existing-AST-projection-authority-consumes-the-exact-invocation-and-response-judgments-after-response-execution-and-forwards-the-pair-without-reclassification-or-reconstruction',
  rejectedCorrelationRule: 'different-source-identity-cannot-enter-evidence-production-and-must-remain-an-explicit-rejected-ADT-outcome',
  rejectedCorrelationArtifactRule: 'controller_response_declaration_source_correlation_rejected-retains-the-exact-invocation-judgment-and-rejected-source-correlation-receipt-and-is-a-first-class-response-judgment-ADT-member-for-AST-projection',
  rejectedBindingRule: 'rejected-source-binding-cannot-be-converted-to-a-complete-response-judgment',
  noReclassificationRule: 'scanner-and-runtime-executor-forward-existing-judgments-and-never-reclassify-descriptors-or-reconstruct-provenance',
  noReplacementLayerRule: 'compose-existing-contracts-without-adding-relation-or-foundation-operations-or-a-parallel-semantic-authority',
  projectionBoundaryRule: 'AST-projection-authority-is-composed-as-an-existing-dependency;the-response-pipeline-does-not-own-or-reimplement-AST-projection-semantics',
  responseArtifactOutcomeRule: 'scanner-artifact-retains-either-a-closed-response-semantic-judgment-or-an-explicit-source-binding-or-declaration-correlation-rejection-judgment;rejection-is-never-erased-into-an-empty-success',
  invocationOutcomeUniformityRule: 'every-closed-invocation-judgment-outcome-enters-the-same-response-evidence-and-AST-projection-sequence;response-authority-and-projection-ADT-preserve-outcome-differences;scanner-does-not-branch-or-reconstruct-by-invocation-response-kind',
});

function correlateDeclarationSource<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
  input: LaravelControllerResponseDeclarationSourceCorrelationInput<InvocationJudgment>,
  sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
): LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<InvocationJudgment>;
function correlateDeclarationSource(
  input: LaravelControllerResponseDeclarationSourceCorrelationInput,
  sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
): LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment {
  const identityJudgment = sourceIdentitySemantics.relateSourceFiles(
    input.invocationJudgment.sourceFile,
    input.declarationEvidence.source.file,
  );
  switch (identityJudgment.kind) {
    case 'same_source_file_identity':
      return Object.freeze({
        kind: 'controller_response_evidence_declaration_source_correlated',
        invocationSource: input.invocationJudgment.sourceFile,
        declarationSource: input.declarationEvidence.source.file,
        identityJudgment,
      });
    case 'different_source_file_identity':
      return Object.freeze({
        kind: 'controller_response_evidence_declaration_source_correlation_rejected',
        invocationSource: input.invocationJudgment.sourceFile,
        declarationSource: input.declarationEvidence.source.file,
        identityJudgment,
      });
  }
}

function produceResponseEvidence<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
  input: LaravelControllerResponseEvidenceProductionInput<InvocationJudgment>,
): LaravelControllerResponseEvidenceProductionInventory<InvocationJudgment>;
function produceResponseEvidence(
  input: LaravelControllerResponseEvidenceProductionInput,
): LaravelControllerResponseEvidenceProductionInventory {
  const observations: readonly LaravelControllerResponseEvidenceProductionObservation[] = Object.freeze(
    input.declarationEvidence.methods.map((methodEvidence): LaravelControllerResponseEvidenceProductionObservation => {
      const returnEvidence: readonly LaravelControllerResponseEvidenceProductionEvidence[] = Object.freeze(
        methodEvidence.returnExpressions.map((returnExpression): LaravelControllerResponseEvidenceProductionEvidence => Object.freeze({
          kind: 'observed_controller_return',
          sourceFile: returnExpression.source.file,
          source: returnExpression.source,
          expressionSource: returnExpression.expressionSource,
          expressionKind: returnExpression.expressionKind,
        })),
      );
      const responseAttributeEvidence: readonly LaravelControllerResponseEvidenceProductionEvidence[] = Object.freeze([Object.freeze({
        kind: 'response_attribute_source',
        sourceFile: methodEvidence.responseAttribute.kind === 'response_attribute_declared'
          ? methodEvidence.responseAttribute.source.file
          : methodEvidence.source.file,
        source: methodEvidence.responseAttribute.kind === 'response_attribute_declared'
          ? methodEvidence.responseAttribute.source
          : methodEvidence.source,
        attribute: methodEvidence.responseAttribute,
      })]);
      const descriptorEvidence: readonly LaravelControllerResponseEvidenceProductionEvidence[] = (() => {
        switch (methodEvidence.action.response.kind) {
          case 'response_reference_declared': {
            const candidate: Extract<LaravelControllerResponseEvidenceProductionEvidence, { readonly kind: 'controller_action_response_reference_candidate' }> = Object.freeze({
              kind: 'controller_action_response_reference_candidate',
              origin: 'controller-action-descriptor-response-type',
              sourceFile: methodEvidence.source.file,
              source: methodEvidence.source,
              response: methodEvidence.action.response.response,
            });
            return Object.freeze([candidate]);
          }
          case 'response_reference_not_declared':
            return emptyResponseEvidence;
        }
      })();
      return Object.freeze({
        kind: 'controller_method_response_observation',
        methodEvidence,
        action: methodEvidence.action,
        returnExpressions: methodEvidence.returnExpressions,
        evidence: Object.freeze([...returnEvidence, ...descriptorEvidence, ...responseAttributeEvidence]),
      });
    }),
  );
  const evidence: readonly LaravelControllerResponseEvidenceProductionEvidence[] = Object.freeze(
    observations.flatMap(observation => observation.evidence),
  );
  const [firstEvidence, ...remainingEvidence] = evidence;
  switch (firstEvidence?.kind) {
    case undefined:
      return Object.freeze({
        kind: 'response_evidence_inventory_empty',
        invocationJudgment: input.invocationJudgment,
        sourceCorrelation: input.sourceCorrelation,
        dtoDeclarationInventory: input.dtoDeclarationInventory,
        observations,
        evidence: emptyResponseEvidence,
        coverage: responseEvidenceProductionCoverage,
      });
    case 'observed_controller_return':
    case 'controller_action_response_reference_candidate':
    case 'response_attribute_source': {
      const [firstObservation, ...remainingObservations] = observations;
      switch (firstObservation?.kind) {
        case undefined:
          throw new Error('Produced response evidence must retain its source-owned method observation.');
        case 'controller_method_response_observation': {
          const presentObservations: readonly [LaravelControllerResponseEvidenceProductionObservation, ...LaravelControllerResponseEvidenceProductionObservation[]] = [firstObservation, ...remainingObservations];
          const presentEvidence: readonly [LaravelControllerResponseEvidenceProductionEvidence, ...LaravelControllerResponseEvidenceProductionEvidence[]] = [firstEvidence, ...remainingEvidence];
          return Object.freeze({
            kind: 'response_evidence_inventory_present',
            invocationJudgment: input.invocationJudgment,
            sourceCorrelation: input.sourceCorrelation,
            dtoDeclarationInventory: input.dtoDeclarationInventory,
            observations: presentObservations,
            evidence: presentEvidence,
            coverage: responseEvidenceProductionCoverage,
          });
        }
      }
    }
  }
}

function bindResponseEvidence< Input extends LaravelControllerResponseEvidenceSourceBindingInput>(
  input: Input,
  sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
): LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput<Input>;
function bindResponseEvidence(
  input: LaravelControllerResponseEvidenceSourceBindingInput,
  sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
): LaravelControllerResponseEvidenceSourceBindingJudgment {
  switch (input.kind) {
    case 'response_evidence_inventory_empty':
      return Object.freeze({
        kind: 'controller_response_evidence_source_binding_empty',
        invocationSource: input.invocationJudgment.sourceFile,
        dtoDeclarationInventory: input.dtoDeclarationInventory,
        observations: input.observations,
        evidence: emptyBindingEvidence,
        coverage: 'every-response-evidence-item-is-represented-exactly-once',
      });
    case 'response_evidence_inventory_present': {
      const bindEntry = (
        observation: LaravelControllerResponseEvidenceProductionObservation,
        evidence: LaravelControllerResponseEvidenceProductionEvidence,
      ): LaravelControllerResponseEvidenceSourceBindingEntry => {
        const identityJudgment = sourceIdentitySemantics.relateSourceFiles(input.invocationJudgment.sourceFile, evidence.sourceFile);
        switch (identityJudgment.kind) {
          case 'same_source_file_identity':
            return Object.freeze({ kind: 'response_evidence_same_source', observation, evidence, identityJudgment });
          case 'different_source_file_identity':
            return Object.freeze({ kind: 'response_evidence_different_source', observation, evidence, identityJudgment });
        }
      };
      const entries: readonly LaravelControllerResponseEvidenceSourceBindingEntry[] = Object.freeze(
        input.observations.flatMap(observation => observation.evidence.map(evidence => bindEntry(observation, evidence))),
      );
      const [firstEntry] = entries;
      switch (firstEntry?.kind) {
        case undefined:
          throw new Error('A present response evidence inventory must retain at least one observation-owned evidence item.');
        case 'response_evidence_same_source':
        case 'response_evidence_different_source': {
          const differentSource = entries.find((entry): entry is Extract<LaravelControllerResponseEvidenceSourceBindingEntry, { readonly kind: 'response_evidence_different_source' }> => entry.kind === 'response_evidence_different_source');
          switch (differentSource?.kind) {
            case 'response_evidence_different_source': {
              const rejectedEvidence: readonly [typeof differentSource, ...LaravelControllerResponseEvidenceSourceBindingEntry[]] = [differentSource, ...entries.filter(entry => entry !== differentSource)];
              return Object.freeze({
                kind: 'controller_response_evidence_source_binding_rejected',
                invocationSource: input.invocationJudgment.sourceFile,
                dtoDeclarationInventory: input.dtoDeclarationInventory,
                observations: input.observations,
                evidence: rejectedEvidence,
                coverage: 'every-response-evidence-item-is-represented-exactly-once',
              });
            }
            case undefined: {
              const sameEntries = entries.map(entry => {
                switch (entry.kind) {
                  case 'response_evidence_same_source':
                    return entry;
                  case 'response_evidence_different_source':
                    throw new Error('A complete source-binding receipt cannot contain a different-source entry.');
                }
              });
              const [firstSameEntry, ...remainingSameEntries] = sameEntries;
              if (firstSameEntry === undefined) throw new Error('A present evidence inventory must bind at least one item.');
              const completeEvidence: readonly [typeof firstSameEntry, ...typeof firstSameEntry[]] = [firstSameEntry, ...remainingSameEntries];
              return Object.freeze({
                kind: 'controller_response_evidence_source_binding_complete',
                invocationSource: input.invocationJudgment.sourceFile,
                dtoDeclarationInventory: input.dtoDeclarationInventory,
                observations: input.observations,
                evidence: completeEvidence,
                coverage: 'every-response-evidence-item-is-represented-exactly-once',
              });
          }
        }
      }
    }
  }
}
}

const unresolvedResponseBlocker: LaravelControllerResponseSemanticBlocker = Object.freeze({ kind: 'response_contract_unresolved' });

type InvocationResponseOutcomeKind = LaravelControllerInvocationSemanticJudgmentInterface['response']['kind'];

function hasInvocationOutcome<Kind extends InvocationResponseOutcomeKind>(
  judgment: LaravelControllerInvocationSemanticJudgmentInterface,
  kind: Kind,
): judgment is Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: { readonly kind: Kind } }> {
  return judgment.response.kind === kind;
}

function assertNeverInvocationOutcome(judgment: never): never {
  throw new Error(`Unrecognized invocation outcome: ${judgment}`);
}

function blockUnprovenResponse(
  invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface,
  evidence: readonly LaravelControllerResponseSemanticEvidence[],
  blocker: LaravelControllerResponseSemanticBlocker = unresolvedResponseBlocker,
): LaravelControllerResponseSemanticJudgmentFor<LaravelControllerInvocationSemanticJudgmentInterface> {
  if (hasInvocationOutcome(invocationJudgment, 'php_source_invocation_integration_not_connected')) {
    return Object.freeze({ kind: 'controller_response_invocation_not_connected', invocationJudgment });
  }
  if (hasInvocationOutcome(invocationJudgment, 'php_source_invocation_integration_source_binding_rejected')) {
    return Object.freeze({ kind: 'controller_response_source_binding_rejected', invocationJudgment });
  }
  if (hasInvocationOutcome(invocationJudgment, 'php_source_invocation_integration_blocked')) {
    return Object.freeze({ kind: 'controller_response_invocation_blocked', invocationJudgment, evidence, blocker });
  }
  if (hasInvocationOutcome(invocationJudgment, 'php_source_invocation_integration_complete')) {
    return Object.freeze({ kind: 'controller_response_blocked', invocationJudgment, evidence, blocker });
  }
  return assertNeverInvocationOutcome(invocationJudgment);
}

const returnResponseProjectionContract: LaravelControllerReturnResponseProjectionContract = Object.freeze({
  kind: 'laravel_controller_return_response_projection_contract',
  contractVersion: 1,
  owner: 'existing-ControllerReturnSemantic-ADT',
  completeRule: 'response-resource-model-and-fully-projectable-branches-map-to-ResponseResult-without-reading-PHP-syntax',
  unresolvedRule: 'absent-generic-expression-or-any-unresolved-branch-remains-unresolved-and-is-never-guessed-as-empty-or-JSON',
  branchRule: 'all-branches-must-project-to-concrete-ResponseResult-before-the-branch-result-is-complete',
});

const frameworkDefaultResponseStatus = (): ResponseStatus => Object.freeze({
  kind: 'response_status',
  value: Object.freeze({ kind: 'http_status_code', value: Object.freeze({ kind: 'number_value', value: 200 }) }),
  origin: Object.freeze({ kind: 'framework_default' }),
});

const modelReferenceForOrigin = (model: ControllerModelOrigin): ModelReference => {
  switch (model.kind) {
    case 'model_class':
      return Object.freeze({ kind: 'model_reference', name: model.name });
    case 'table':
      return Object.freeze({ kind: 'model_reference', name: createModelName(model.name.value.value) });
  }
};

type ResponseResultSequenceProjection =
  | Readonly<{ readonly kind: 'response_result_sequence_complete'; readonly results: Sequence<ResponseResult> }>
  | Readonly<{ readonly kind: 'response_result_sequence_unresolved' }>;

function projectReturnSequenceTail(branches: Sequence<ControllerReturnSemantic>): ResponseResultSequenceProjection {
  switch (branches.kind) {
    case 'empty':
      return Object.freeze({ kind: 'response_result_sequence_complete', results: Object.freeze({ kind: 'empty' }) });
    case 'cons': {
      const head = projectCanonicalReturn(branches.head);
      const tail = projectReturnSequenceTail(branches.tail);
      switch (head.kind) {
        case 'controller_return_response_projection_unresolved':
          return Object.freeze({ kind: 'response_result_sequence_unresolved' });
        case 'controller_return_response_projection_complete':
          switch (tail.kind) {
            case 'response_result_sequence_unresolved':
              return Object.freeze({ kind: 'response_result_sequence_unresolved' });
            case 'response_result_sequence_complete':
              return Object.freeze({ kind: 'response_result_sequence_complete', results: Object.freeze({ kind: 'cons', head: head.result, tail: tail.results }) });
          }
      }
    }
  }
}

function projectReturnSequence(branches: Sequence<ControllerReturnSemantic>): ResponseResultSequenceProjection {
  switch (branches.kind) {
    case 'empty':
      return Object.freeze({ kind: 'response_result_sequence_unresolved' });
    case 'cons':
      return projectReturnSequenceTail(branches);
  }
}

function projectCanonicalReturn(returned: ControllerReturnSemantic): LaravelControllerReturnResponseProjectionJudgment {
  switch (returned.kind) {
    case 'response':
      return Object.freeze({ kind: 'controller_return_response_projection_complete', returned, result: returned.result });
    case 'resource':
      return Object.freeze({
        kind: 'controller_return_response_projection_complete',
        returned,
        result: Object.freeze({ kind: 'resource', resource: returned.resource, model: modelReferenceForOrigin(returned.model), cardinality: returned.cardinality, status: frameworkDefaultResponseStatus() }),
      });
    case 'model':
      return Object.freeze({
        kind: 'controller_return_response_projection_complete',
        returned,
        result: Object.freeze({
          kind: 'content',
          body: Object.freeze({ kind: 'json', shape: Object.freeze({ kind: 'single', payload: Object.freeze({ kind: 'model', model: modelReferenceForOrigin(returned.model) }) }) }),
          status: frameworkDefaultResponseStatus(),
        }),
      });
    case 'branches': {
      const branchesProjection = projectReturnSequence(returned.branches);
      switch (branchesProjection.kind) {
        case 'response_result_sequence_unresolved':
          return Object.freeze({ kind: 'controller_return_response_projection_unresolved', returned, reason: 'at-least-one-branch-has-no-concrete-http-response-result' });
        case 'response_result_sequence_complete':
          return Object.freeze({ kind: 'controller_return_response_projection_complete', returned, result: Object.freeze({ kind: 'branches', branches: branchesProjection.results }) });
      }
    }
    case 'absent':
    case 'expression':
      return Object.freeze({ kind: 'controller_return_response_projection_unresolved', returned, reason: 'absent-or-generic-expression-does-not-prove-an-http-response-result' });
  }
}

const returnResponseProjection: LaravelControllerReturnResponseProjectionInterface = Object.freeze({
  kind: 'laravel_controller_return_response_projection',
  contract: returnResponseProjectionContract,
  project: projectCanonicalReturn,
});

const methodResponseAstProjectionContract: LaravelControllerMethodResponseAstProjectionContract = Object.freeze({
  kind: 'laravel_controller_method_response_ast_projection_contract',
  contractVersion: 4,
  owner: 'LaravelControllerResponseSemanticPipelineInterface',
  resultRule: 'ResponseDefinition.outcome.success.result-preserves-the-exact-canonical-ResponseResult-from-the-method-product',
  provenanceRule: 'ResponseDefinition.source-is-the-exact-source-span-of-the-method-owning-the-canonical-return-semantic',
  actionCorrelationRule: 'method-response-AST-projection-requires-exactly-one-canonical-action-publication-matching-action-identity-and-source-span;missing-or-ambiguous-correlation-is-an-explicit-rejected-judgment',
  dtoContractProvenanceRule: 'AST-projection-preserves-the-exact-method-product-including-its-method-owned-DTO-response-contract-judgments-without-rejoining-by-source-span',
  identityRule: 'response-type-name-is-derived-from-the-canonical-action-name-with-a-deterministic-Response-suffix',
  outputTypeRule: 'ResponseDefinition.output-uses-a-proven-TypeExpression-only-when-the-canonical-ResponseResult-output-type-judgment-is-complete;otherwise-mixed-is-retained-as-an-explicit-unresolved-fallback',
  noReclassificationRule: 'projection-does-not-read-PHP-syntax-or-call-the-legacy-controller-response-classifier',
  resourceShapeRule: 'resource-definitions-are-canonical-resolved-upstream-inputs;resource-output-is-proven-only-for-a-unique-closed-resource-definition',
  paginationRule: 'paginated-output-remains-unresolved-until-the-framework-envelope-and-customization-contract-are-closed',
});

const emptyResponseTransport: ResponseTransport = Object.freeze({
  kind: 'response_transport',
  headers: Object.freeze({ kind: 'empty' }),
  cookies: Object.freeze({ kind: 'empty' }),
});

type OutputTypeProjection =
  | Readonly<{ readonly kind: 'proven'; readonly output: TypeExpression }>
  | Readonly<{ readonly kind: 'unresolved' }>;

type OutputTypeSequenceProjection =
  | Readonly<{ readonly kind: 'complete'; readonly items: Sequence<TypeExpression> }>
  | Readonly<{ readonly kind: 'unresolved' }>;

type ResourceDefinitionLookup =
  | Readonly<{ readonly kind: 'no_match' }>
  | Readonly<{ readonly kind: 'one_match'; readonly definition: ResourceDefinition }>
  | Readonly<{ readonly kind: 'multiple_matches' }>;

type ResourceFieldProjection =
  | Readonly<{ readonly kind: 'complete'; readonly properties: Sequence<TypeProperty> }>
  | Readonly<{ readonly kind: 'unresolved' }>;

const responseOutputTypeJudgmentContract: LaravelControllerResponseOutputTypeJudgmentContract = Object.freeze({
  kind: 'laravel_controller_response_output_type_judgment_contract',
  contractVersion: 5,
  owner: 'canonical-ResponseResult-ADT',
  directTypeRule: 'responsable-json-serializable-explicit-json-payload-types-and-closed-resolved-resource-fields-preserve-their-proven-TypeExpression',
  branchRule: 'branch-output-type-is-proven-only-when-every-branch-has-a-proven-output-type',
  paginationEnvelopeRule: 'pagination-output-is-a-closed-data-links-meta-object-only-when-payload-and-resource-customization-evidence-are-closed',
  paginationMetadataRule: 'links-and-meta-are-projected-by-the-versioned-framework-metadata-profile-contract-from-the-canonical-PaginationKind',
  unresolvedRule: 'redirect-resource-schema-without-unique-closed-definition-untyped-expression-empty-and-unknown-payload-shapes-remain-unresolved-rather-than-being-promoted-to-mixed-as-a-semantic-judgment',
});

const paginationEnvelopeContract: LaravelControllerResponsePaginationEnvelopeContract = Object.freeze({
  kind: 'laravel_controller_response_pagination_envelope_contract',
  contractVersion: 3,
  owner: 'LaravelControllerResponseOutputTypeJudgmentInterface',
  metadataProfileRule: 'pagination-links-and-meta-are-projected-by-the-framework-metadata-profile-contract',
  frameworkEnvelopeRule: 'paginate-emits-data-links-meta;simple-paginate-emits-data-links-and-page-meta;cursor-paginate-emits-data-links-and-cursor-meta',
  customizationRule: 'resource-paginationInformation-customization-must-be-absent-and-resource-data-shape-must-already-be-closed',
  unresolvedRule: 'unresolved-payload-or-unproven-customization-never-produces-a-proven-envelope',
  frameworkVersionRule: 'metadata-envelope-is-proven-only-for-the-explicitly-verified-Laravel-framework-major',
});

function isClosedTypeExpression(type: TypeExpression): boolean {
  switch (type.kind) {
    case 'mixed':
    case 'error':
      return false;
    case 'primitive':
    case 'reference':
    case 'uninhabited':
      return true;
    case 'array':
      return isClosedTypeExpression(type.element);
    case 'array_map':
      return isClosedTypeExpression(type.key) && isClosedTypeExpression(type.value);
    case 'union':
    case 'intersection':
      return isClosedTypeExpressionSequence(type.members.items);
    case 'nullable':
    case 'optional':
      return isClosedTypeExpression(type.value);
    case 'callable':
      return isClosedTypeParameterSequence(type.parameters.items) && isClosedTypeExpression(type.result);
    case 'generic':
      return isClosedTypeParameterSequence(type.parameters.items);
    case 'object':
      return isClosedTypePropertySequence(type.properties.items);
  }
}

function isClosedTypeExpressionSequence(items: Sequence<TypeExpression>): boolean {
  switch (items.kind) {
    case 'empty':
      return false;
    case 'cons':
      return isClosedTypeExpression(items.head) && isClosedTypeExpressionSequence(items.tail);
  }
}

function isClosedTypeParameterSequence(items: Sequence<TypeParameter>): boolean {
  switch (items.kind) {
    case 'empty':
      return true;
    case 'cons':
      return isClosedTypeExpression(items.head.type) && isClosedTypeParameterSequence(items.tail);
  }
}

function isClosedTypePropertySequence(items: Sequence<TypeProperty>): boolean {
  switch (items.kind) {
    case 'empty':
      return true;
    case 'cons':
      return isClosedTypeExpression(items.head.type) && isClosedTypePropertySequence(items.tail);
  }
}

function lookupResourceDefinition(
  resource: ResourceReference,
  definitions: readonly ResourceDefinition[],
  matches: ResourceDefinitionLookup = Object.freeze({ kind: 'no_match' }),
): ResourceDefinitionLookup {
  switch (definitions.length) {
    case 0:
      return matches;
    default: {
      const [head, ...tail] = definitions;
      const nextMatches = addResourceDefinitionMatch(matches, head, head.name.value.value === resource.name.value.value);
      return lookupResourceDefinition(resource, tail, nextMatches);
    }
  }
}


function addResourceDefinitionMatch(matches: ResourceDefinitionLookup, definition: ResourceDefinition, matchesResource: boolean): ResourceDefinitionLookup {
  switch (matchesResource) {
    case false:
      return matches;
    case true:
      switch (matches.kind) {
        case 'no_match':
          return Object.freeze({ kind: 'one_match', definition });
        case 'one_match':
        case 'multiple_matches':
          return Object.freeze({ kind: 'multiple_matches' });
      }
  }
}

function nullableOutputType(type: TypeExpression): TypeExpression {
  switch (type.kind) {
    case 'nullable':
      return type;
    default:
      return Object.freeze({ kind: 'nullable', value: type });
  }
}

function optionalOutputType(type: TypeExpression): TypeExpression {
  switch (type.kind) {
    case 'optional':
      return type;
    default:
      return Object.freeze({ kind: 'optional', value: type });
  }
}

function projectResourceFieldType(field: ResourceField): OutputTypeProjection {
  switch (isClosedTypeExpression(field.type)) {
    case false:
      return Object.freeze({ kind: 'unresolved' });
    case true:
      switch (field.presence.kind) {
        case 'always_present':
          return Object.freeze({ kind: 'proven', output: field.type });
        case 'null_when_unavailable':
          return Object.freeze({ kind: 'proven', output: nullableOutputType(field.type) });
        case 'relation_loaded':
        case 'relation_counted':
        case 'relation_aggregated':
        case 'relation_exists_loaded':
        case 'attribute_present':
        case 'attribute_appended':
        case 'pivot_loaded':
        case 'pivot_loaded_as':
        case 'conditional':
          return Object.freeze({ kind: 'proven', output: optionalOutputType(field.type) });
      }
  }
}

function projectResourceFieldSequence(fields: Sequence<ResourceField>): ResourceFieldProjection {
  switch (fields.kind) {
    case 'empty':
      return Object.freeze({ kind: 'complete', properties: Object.freeze({ kind: 'empty' }) });
    case 'cons': {
      const fieldType = projectResourceFieldType(fields.head);
      switch (fieldType.kind) {
        case 'unresolved':
          return Object.freeze({ kind: 'unresolved' });
        case 'proven': {
          const tail = projectResourceFieldSequence(fields.tail);
          switch (tail.kind) {
            case 'unresolved':
              return Object.freeze({ kind: 'unresolved' });
            case 'complete':
              return Object.freeze({
                kind: 'complete',
                properties: Object.freeze({
                  kind: 'cons',
                  head: Object.freeze({ kind: 'type_property', name: fields.head.name, type: fieldType.output, source: fields.head.source }),
                  tail: tail.properties,
                }),
              });
          }
        }
      }
    }
  }
}

function resourceDefinitionHasClosedShape(definition: ResourceDefinition): boolean {
  switch (definition.contract.dynamicEntries.items.kind) {
    case 'cons':
      return false;
    case 'empty':
      switch (definition.contract.responseCustomization.kind) {
        case 'response_customization_absent':
          switch (definition.framework.with.kind) {
            case 'with_absent':
              switch (definition.framework.withResponse.kind) {
                case 'with_response_absent':
                  switch (definition.framework.paginationInformation.kind) {
                    case 'pagination_information_absent':
                      switch (definition.framework.collection.paginationInformation.kind) {
                        case 'pagination_information_absent':
                          return true;
                        default:
                          return false;
                      }
                    default:
                      return false;
                  }
                default:
                  return false;
              }
            default:
              return false;
          }
        default:
          return false;
      }
  }
}

function projectResourceDefinitionOutputType(resource: ResourceReference, definitions: readonly ResourceDefinition[]): OutputTypeProjection {
  const lookup = lookupResourceDefinition(resource, definitions);
  switch (lookup.kind) {
    case 'no_match':
    case 'multiple_matches':
      return Object.freeze({ kind: 'unresolved' });
    case 'one_match':
      switch (resourceDefinitionHasClosedShape(lookup.definition)) {
        case false:
          return Object.freeze({ kind: 'unresolved' });
        case true: {
          const fields = projectResourceFieldSequence(lookup.definition.fields.items);
          switch (fields.kind) {
            case 'unresolved':
              return Object.freeze({ kind: 'unresolved' });
            case 'complete':
              return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'object', properties: Object.freeze({ kind: 'type_properties', items: fields.properties }) }) });
          }
      }
  }
}
}

function projectSemanticValueOutputType(value: SemanticValue): OutputTypeProjection {
  switch (value.kind) {
    case 'typed':
      return Object.freeze({ kind: 'proven', output: value.type });
    case 'scalar':
      return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'primitive', value: value.primitive }) });
    case 'reference': {
      const reference: TypeExpression = Object.freeze({ kind: 'reference', value: Object.freeze({ kind: 'domain', name: value.name }) });
      const cardinality: TypeExpression = (() => {
        switch (value.cardinality.kind) {
          case 'many':
            return Object.freeze({ kind: 'array', element: reference });
          case 'one':
            return reference;
        }
      })();
      const output: TypeExpression = (() => {
        switch (value.nullability.kind) {
          case 'nullable':
            return nullableOutputType(cardinality);
          case 'non_nullable':
            return cardinality;
        }
      })();
      return Object.freeze({ kind: 'proven', output });
    }
    case 'literal':
      switch (value.value.kind) {
        case 'string_literal':
          return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'primitive', value: Object.freeze({ kind: 'string' }) }) });
        case 'number_literal':
          return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'primitive', value: Object.freeze({ kind: 'number' }) }) });
        case 'boolean_literal':
          return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'primitive', value: Object.freeze({ kind: 'boolean' }) }) });
        case 'null_literal':
          return Object.freeze({ kind: 'unresolved' });
      }
    case 'unresolved':
    case 'property_access':
    case 'resolved_property_access':
    case 'relation_access':
    case 'collection':
    case 'object':
    case 'method_call':
    case 'static_call':
    case 'function_call':
    case 'union':
    case 'intersection':
      return Object.freeze({ kind: 'unresolved' });
  }
}

function projectJsonPayloadOutputType(payload: import('./response').ResponseJsonPayload, definitions: readonly ResourceDefinition[]): OutputTypeProjection {
  switch (payload.kind) {
    case 'object':
    case 'primitive':
      switch (isClosedTypeExpression(payload.type)) {
        case true:
          return Object.freeze({ kind: 'proven', output: payload.type });
        case false:
          return Object.freeze({ kind: 'unresolved' });
      }
    case 'value':
      return projectSemanticValueOutputType(payload.value);
    case 'resource':
      return projectResourceDefinitionOutputType(payload.resource, definitions);
    case 'model':
    case 'expression':
      return Object.freeze({ kind: 'unresolved' });
  }
}

type PaginationPropertySpec = Readonly<{ readonly name: string; readonly type: TypeExpression }>;

function paginationPropertySequence(specifications: readonly PaginationPropertySpec[], source: SourceSpan, index = 0): Sequence<TypeProperty> {
  switch (specifications.length - index) {
    case 0:
      return Object.freeze({ kind: 'empty' });
    default: {
      const specification = specifications[index];
      return Object.freeze({
        kind: 'cons',
        head: Object.freeze({ kind: 'type_property', name: createPropertyName(specification.name), type: specification.type, source }),
        tail: paginationPropertySequence(specifications, source, index + 1),
      });
    }
  }
}

function paginationObjectType(specifications: readonly PaginationPropertySpec[], source: SourceSpan): TypeExpression {
  return Object.freeze({ kind: 'object', properties: Object.freeze({ kind: 'type_properties', items: paginationPropertySequence(specifications, source) }) });
}

const stringOutputType: TypeExpression = Object.freeze({ kind: 'primitive', value: Object.freeze({ kind: 'string' }) });
const numberOutputType: TypeExpression = Object.freeze({ kind: 'primitive', value: Object.freeze({ kind: 'number' }) });
const nullableStringOutputType: TypeExpression = Object.freeze({ kind: 'nullable', value: stringOutputType });
const nullableNumberOutputType: TypeExpression = Object.freeze({ kind: 'nullable', value: numberOutputType });

function projectPaginationMetadataProfileForVerifiedVersion(input: LaravelControllerPaginationMetadataProfileInput & { readonly frameworkVersion: Extract<LaravelFrameworkVersionCompatibility, { readonly kind: 'laravel_framework_version_contract_proven' }> }): LaravelControllerPaginationMetadataProfileJudgment {
  const source = input.source;
  switch (input.pagination.kind) {
    case 'paginate':
      return Object.freeze({
        kind: 'controller_pagination_metadata_profile_proven',
        pagination: input.pagination,
        links: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'first', type: nullableStringOutputType }),
          Object.freeze({ name: 'last', type: nullableStringOutputType }),
          Object.freeze({ name: 'prev', type: nullableStringOutputType }),
          Object.freeze({ name: 'next', type: nullableStringOutputType }),
        ]), source),
        meta: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'current_page', type: numberOutputType }),
          Object.freeze({ name: 'from', type: nullableNumberOutputType }),
          Object.freeze({ name: 'last_page', type: numberOutputType }),
          Object.freeze({ name: 'path', type: stringOutputType }),
          Object.freeze({ name: 'per_page', type: numberOutputType }),
          Object.freeze({ name: 'to', type: nullableNumberOutputType }),
          Object.freeze({ name: 'total', type: numberOutputType }),
        ]), source),
        source,
        frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1',
        frameworkVersion: input.frameworkVersion,
      });
    case 'simple_paginate':
      return Object.freeze({
        kind: 'controller_pagination_metadata_profile_proven',
        pagination: input.pagination,
        links: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'prev', type: nullableStringOutputType }),
          Object.freeze({ name: 'next', type: nullableStringOutputType }),
        ]), source),
        meta: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'current_page', type: numberOutputType }),
          Object.freeze({ name: 'from', type: nullableNumberOutputType }),
          Object.freeze({ name: 'path', type: stringOutputType }),
          Object.freeze({ name: 'per_page', type: numberOutputType }),
          Object.freeze({ name: 'to', type: nullableNumberOutputType }),
        ]), source),
        source,
        frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1',
        frameworkVersion: input.frameworkVersion,
      });
    case 'cursor_paginate':
      return Object.freeze({
        kind: 'controller_pagination_metadata_profile_proven',
        pagination: input.pagination,
        links: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'prev', type: nullableStringOutputType }),
          Object.freeze({ name: 'next', type: nullableStringOutputType }),
        ]), source),
        meta: paginationObjectType(Object.freeze([
          Object.freeze({ name: 'next_cursor', type: nullableStringOutputType }),
          Object.freeze({ name: 'path', type: stringOutputType }),
          Object.freeze({ name: 'per_page', type: numberOutputType }),
          Object.freeze({ name: 'prev_cursor', type: nullableStringOutputType }),
        ]), source),
        source,
        frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1',
        frameworkVersion: input.frameworkVersion,
      });
  }
}


function projectPaginationMetadataProfile(input: LaravelControllerPaginationMetadataProfileInput): LaravelControllerPaginationMetadataProfileJudgment {
  switch (input.frameworkVersion.kind) {
    case 'laravel_framework_version_contract_unresolved':
      return Object.freeze({ kind: 'controller_pagination_metadata_profile_unresolved', reason: 'framework-version-not-proven-compatible' });
    case 'laravel_framework_version_contract_proven':
      switch (input.frameworkVersion.major) {
        case '12':
          return projectPaginationMetadataProfileForVerifiedVersion(Object.freeze({ ...input, frameworkVersion: input.frameworkVersion }));
      }
  }
}

const paginationMetadataProfileContract: LaravelControllerPaginationMetadataProfileContract = Object.freeze({
  kind: 'laravel_controller_pagination_metadata_profile_contract',
  contractVersion: 3,
  owner: 'LaravelControllerResponsePaginationEnvelopeJudgmentInterface',
  frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1',
  frameworkVersionRule: 'profile-is-proven-only-after-LaravelControllerPaginationMetadataProfileInterface.frameworkVersionCompatibility-judges-lock-evidence-as-verified-Laravel-12.x',
  metadataRule: 'metadata-fields-are-derived-from-the-canonical-pagination-ADT-under-the-framework-default-contract-not-from-inferred-runtime-values',
  provenanceRule: 'every-projected-links-and-meta-property-retains-the-exact-owning-method-source-span',
  customizationRule: 'profile-is-admissible-only-after-resource-pagination-customization-is-proven-absent-by-the-parent-envelope-judgment',
});

const frameworkVersionCompatibilityContract: LaravelFrameworkVersionCompatibilityJudgmentContract = Object.freeze({
  kind: 'laravel_framework_version_compatibility_judgment_contract',
  contractVersion: 1,
  owner: 'LaravelControllerPaginationMetadataProfileInterface',
  evidenceRule: 'scanner-acquires-lock-file-facts-only;framework-version-compatibility-is-decided-by-this-contract',
  versionRule: 'only-a-recognized-stable-semver-version-with-major-12-is-proven-compatible-with-the-verified-default-pagination-metadata-profile',
  unresolvedRule: 'missing-invalid-absent-unrecognized-prerelease-and-out-of-contract-version-evidence-remain-unresolved',
});

function judgeFrameworkVersionCompatibility(input: LaravelFrameworkVersionCompatibilityJudgmentInput): LaravelFrameworkVersionCompatibility {
  switch (input.evidence.kind) {
    case 'laravel_framework_lock_unavailable':
      return Object.freeze({ kind: 'laravel_framework_version_contract_unresolved', reason: 'composer-lock-unavailable' });
    case 'laravel_framework_lock_invalid':
      return Object.freeze({ kind: 'laravel_framework_version_contract_unresolved', reason: 'composer-lock-invalid' });
    case 'laravel_framework_package_not_locked':
      return Object.freeze({ kind: 'laravel_framework_version_contract_unresolved', reason: 'laravel-framework-package-not-locked' });
    case 'laravel_framework_version_candidate': {
      const version = input.evidence.version.value;
      const versionParts = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
      switch (versionParts?.[1]) {
        case '12':
          return Object.freeze({
            kind: 'laravel_framework_version_contract_proven',
            major: '12',
            version: input.evidence.version,
            sourceFile: input.evidence.sourceFile,
            contract: 'laravel-paginated-resource-response-default-metadata-v1',
          });
        case undefined:
          return Object.freeze({ kind: 'laravel_framework_version_contract_unresolved', reason: 'laravel-framework-version-unrecognized' });
        default:
          return Object.freeze({ kind: 'laravel_framework_version_contract_unresolved', reason: 'laravel-framework-version-outside-verified-contract' });
      }
    }
  }
}

const frameworkVersionCompatibility: LaravelFrameworkVersionCompatibilityJudgmentInterface = Object.freeze({
  kind: 'laravel_framework_version_compatibility_judgment',
  contract: frameworkVersionCompatibilityContract,
  judge: judgeFrameworkVersionCompatibility,
});

const paginationMetadataProfile: LaravelControllerPaginationMetadataProfileInterface = Object.freeze({
  kind: 'laravel_controller_pagination_metadata_profile',
  contract: paginationMetadataProfileContract,
  frameworkVersionCompatibility,
  project: projectPaginationMetadataProfile,
});

function judgePaginationEnvelope(input: LaravelControllerResponsePaginationEnvelopeInput): LaravelControllerResponsePaginationEnvelopeJudgment {
  switch (input.result.kind) {
    case 'content':
      switch (input.result.body.kind) {
        case 'json':
        case 'json_with_callback':
          switch (input.result.body.shape.kind) {
            case 'paginated': {
              switch (input.result.body.shape.payload.kind) {
                case 'resource': {
                  const resourceLookup = lookupResourceDefinition(input.result.body.shape.payload.resource, input.resourceDefinitions);
                  switch (resourceLookup.kind) {
                    case 'one_match':
                      switch (resourceDefinitionHasClosedShape(resourceLookup.definition)) {
                        case false:
                          return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'resource-pagination-output-shape-not-closed' });
                        case true:
                          break;
                      }
                      break;
                    case 'no_match':
                    case 'multiple_matches':
                      return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-payload-output-type-unresolved' });
                  }
                  break;
                }
                case 'value':
                case 'model':
                case 'object':
                case 'primitive':
                case 'expression':
                  break;
              }
              const payload = projectJsonPayloadOutputType(input.result.body.shape.payload, input.resourceDefinitions);
              switch (payload.kind) {
                case 'unresolved':
                  return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-payload-output-type-unresolved' });
                case 'proven': {
                  const data: PaginationPropertySpec = Object.freeze({ name: 'data', type: Object.freeze({ kind: 'array', element: payload.output }) });
                  const metadataProfile = paginationMetadataProfile.project(Object.freeze({ kind: 'laravel_controller_pagination_metadata_profile_input', pagination: input.result.body.shape.pagination, source: input.source, frameworkVersion: input.frameworkVersion }));
                  switch (metadataProfile.kind) {
                    case 'controller_pagination_metadata_profile_unresolved':
                      return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-kind-not-supported' });
                    case 'controller_pagination_metadata_profile_proven': {
                      const links: PaginationPropertySpec = Object.freeze({ name: 'links', type: metadataProfile.links });
                      const meta: PaginationPropertySpec = Object.freeze({ name: 'meta', type: metadataProfile.meta });
                      return Object.freeze({ kind: 'controller_response_pagination_envelope_proven', output: paginationObjectType(Object.freeze([data, links, meta]), input.source), metadataProfile });
                    }
                  }
                }
              }
            }
            case 'single':
            case 'collection':
            case 'empty':
              return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-kind-not-supported' });
          }
        case 'view':
        case 'text':
        case 'file':
        case 'download':
        case 'stream':
        case 'stream_json':
        case 'event_stream':
        case 'stream_download':
        case 'empty':
          return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-kind-not-supported' });
      }
    case 'branches':
    case 'redirect':
    case 'no_content':
    case 'resource':
    case 'responsable':
    case 'json_serializable':
      return Object.freeze({ kind: 'controller_response_pagination_envelope_unresolved', reason: 'pagination-kind-not-supported' });
  }
}

const paginationEnvelopeJudgment: LaravelControllerResponsePaginationEnvelopeJudgmentInterface = Object.freeze({
  kind: 'laravel_controller_response_pagination_envelope_judgment',
  contract: paginationEnvelopeContract,
  metadataProfile: paginationMetadataProfile,
  judge: judgePaginationEnvelope,
});

function projectResponseResultTypeSequence(results: Sequence<ResponseResult>, definitions: readonly ResourceDefinition[], source: SourceSpan, frameworkVersion: LaravelFrameworkVersionCompatibility): OutputTypeSequenceProjection {
  switch (results.kind) {
    case 'empty':
      return Object.freeze({ kind: 'complete', items: Object.freeze({ kind: 'empty' }) });
    case 'cons': {
      const head = projectResponseResultOutputType(results.head, definitions, source, frameworkVersion);
      switch (head.kind) {
        case 'unresolved':
          return Object.freeze({ kind: 'unresolved' });
        case 'proven': {
          const tail = projectResponseResultTypeSequence(results.tail, definitions, source, frameworkVersion);
          switch (tail.kind) {
            case 'unresolved':
              return Object.freeze({ kind: 'unresolved' });
            case 'complete':
              return Object.freeze({ kind: 'complete', items: Object.freeze({ kind: 'cons', head: head.output, tail: tail.items }) });
          }
        }
      }
    }
  }
}

function projectResponseResultOutputType(result: ResponseResult, definitions: readonly ResourceDefinition[], source: SourceSpan, frameworkVersion: LaravelFrameworkVersionCompatibility): OutputTypeProjection {
  switch (result.kind) {
    case 'responsable':
    case 'json_serializable':
      return isClosedTypeExpression(result.type) ? Object.freeze({ kind: 'proven', output: result.type }) : Object.freeze({ kind: 'unresolved' });
    case 'resource': {
      const resource = projectResourceDefinitionOutputType(result.resource, definitions);
      switch (resource.kind) {
        case 'unresolved':
          return resource;
        case 'proven':
          return Object.freeze({ kind: 'proven', output: result.cardinality.kind === 'collection' ? Object.freeze({ kind: 'array', element: resource.output }) : resource.output });
      }
    }
    case 'content':
      switch (result.body.kind) {
        case 'json':
        case 'json_with_callback':
          switch (result.body.shape.kind) {
            case 'single':
              return projectJsonPayloadOutputType(result.body.shape.payload, definitions);
            case 'collection': {
              const payload = projectJsonPayloadOutputType(result.body.shape.payload, definitions);
              switch (payload.kind) {
                case 'unresolved':
                  return payload;
                case 'proven':
                  return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'array', element: payload.output }) });
              }
            }
            case 'paginated': {
              const envelope = paginationEnvelopeJudgment.judge(Object.freeze({ kind: 'laravel_controller_response_pagination_envelope_input', result, resourceDefinitions: definitions, source, frameworkVersion }));
              switch (envelope.kind) {
                case 'controller_response_pagination_envelope_proven':
                  return Object.freeze({ kind: 'proven', output: envelope.output });
                case 'controller_response_pagination_envelope_unresolved':
                  return Object.freeze({ kind: 'unresolved' });
              }
            }
            case 'empty':
              return Object.freeze({ kind: 'unresolved' });
          }
        case 'view':
        case 'text':
        case 'file':
        case 'download':
        case 'stream':
        case 'stream_json':
        case 'event_stream':
        case 'stream_download':
        case 'empty':
          return Object.freeze({ kind: 'unresolved' });
      }
    case 'branches': {
      switch (result.branches.kind) {
        case 'empty':
          return Object.freeze({ kind: 'unresolved' });
        case 'cons': {
          const projection = projectResponseResultTypeSequence(result.branches, definitions, source, frameworkVersion);
          switch (projection.kind) {
            case 'unresolved':
              return Object.freeze({ kind: 'unresolved' });
            case 'complete':
              switch (projection.items.kind) {
                case 'empty':
                  return Object.freeze({ kind: 'unresolved' });
                case 'cons':
                  switch (projection.items.tail.kind) {
                    case 'empty':
                      return Object.freeze({ kind: 'proven', output: projection.items.head });
                    case 'cons': {
                      const members: TypeExpressions = Object.freeze({ kind: 'type_expressions', items: projection.items });
                      return Object.freeze({ kind: 'proven', output: Object.freeze({ kind: 'union', members }) });
                    }
                  }
              }
          }
        }
      }
    }
    case 'redirect':
    case 'no_content':
      return Object.freeze({ kind: 'unresolved' });
  }
}

type ResponseOutputTypeUnresolvedReason = 'payload-type-is-not-proven-by-canonical-response-result' | 'at-least-one-response-branch-has-no-proven-output-type' | 'resource-schema-is-not-closed' | 'pagination-envelope-is-not-closed' | 'pagination-payload-output-type-unresolved' | 'resource-pagination-output-shape-not-closed' | 'pagination-kind-not-supported';

function responseOutputTypeUnresolvedReason(result: ResponseResult): ResponseOutputTypeUnresolvedReason {
  switch (result.kind) {
    case 'resource':
      return 'resource-schema-is-not-closed';
    case 'branches':
      return 'at-least-one-response-branch-has-no-proven-output-type';
    case 'content':
      switch (result.body.kind) {
        case 'json':
        case 'json_with_callback':
          switch (result.body.shape.kind) {
            case 'paginated':
              return 'pagination-envelope-is-not-closed';
            case 'single':
            case 'collection':
              switch (result.body.shape.payload.kind) {
                case 'resource':
                  return 'resource-schema-is-not-closed';
                default:
                  return 'payload-type-is-not-proven-by-canonical-response-result';
              }
            case 'empty':
              return 'payload-type-is-not-proven-by-canonical-response-result';
          }
        default:
          return 'payload-type-is-not-proven-by-canonical-response-result';
      }
    default:
      return 'payload-type-is-not-proven-by-canonical-response-result';
  }
}

function judgeResponseOutputTypeFromProjection(input: LaravelControllerResponseOutputTypeInput): LaravelControllerResponseOutputTypeJudgment {
  const projection = projectResponseResultOutputType(input.result, input.resourceDefinitions, input.source, input.frameworkVersion);
  switch (projection.kind) {
    case 'proven':
      return Object.freeze({ kind: 'controller_response_output_type_proven', result: input.result, output: projection.output });
    case 'unresolved':
      return Object.freeze({ kind: 'controller_response_output_type_unresolved', result: input.result, reason: responseOutputTypeUnresolvedReason(input.result) });
  }
}

function judgeResponseOutputType(input: LaravelControllerResponseOutputTypeInput): LaravelControllerResponseOutputTypeJudgment {
  switch (input.result.kind) {
    case 'content':
      switch (input.result.body.kind) {
        case 'json':
        case 'json_with_callback':
          switch (input.result.body.shape.kind) {
            case 'paginated': {
              const envelope = paginationEnvelopeJudgment.judge(Object.freeze({ kind: 'laravel_controller_response_pagination_envelope_input', result: input.result, resourceDefinitions: input.resourceDefinitions, source: input.source, frameworkVersion: input.frameworkVersion }));
              switch (envelope.kind) {
                case 'controller_response_pagination_envelope_proven':
                  return Object.freeze({ kind: 'controller_response_output_type_proven', result: input.result, output: envelope.output });
                case 'controller_response_pagination_envelope_unresolved':
                  return Object.freeze({ kind: 'controller_response_output_type_unresolved', result: input.result, reason: envelope.reason });
              }
            }
            case 'single':
            case 'collection':
            case 'empty':
              return judgeResponseOutputTypeFromProjection(input);
          }
        case 'view':
        case 'text':
        case 'file':
        case 'download':
        case 'stream':
        case 'stream_json':
        case 'event_stream':
        case 'stream_download':
        case 'empty':
          return judgeResponseOutputTypeFromProjection(input);
      }
    case 'branches':
    case 'redirect':
    case 'no_content':
    case 'resource':
    case 'responsable':
    case 'json_serializable':
      return judgeResponseOutputTypeFromProjection(input);
  }
}

const responseOutputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface = Object.freeze({
  kind: 'laravel_controller_response_output_type_judgment',
  contract: responseOutputTypeJudgmentContract,
  paginationEnvelope: paginationEnvelopeJudgment,
  judge: judgeResponseOutputType,
});

function projectMethodResponseAst(
  input: LaravelControllerMethodResponseAstProjectionInput,
  outputTypeAuthority: LaravelControllerResponseOutputTypeJudgmentInterface,
): LaravelControllerMethodResponseAstProjectionJudgment {
  const product = input.product;
  const correlatedActionJudgments = input.actionJudgments.filter(publication =>
    publication.judgment.semantic.actionName.value.value === product.method.action.action.value.value
    && publication.judgment.semantic.source.file.value.value === product.method.source.file.value.value
    && publication.judgment.semantic.source.start.value === product.method.source.start.value
    && publication.judgment.semantic.source.end.value === product.method.source.end.value,
  );
  switch (correlatedActionJudgments.length) {
    case 0:
      return Object.freeze({
        kind: 'controller_method_response_action_correlation_rejected',
        product,
        actionJudgments: input.actionJudgments,
        reason: 'no_matching_action_judgment',
      });
    case 1:
      break;
    default:
      return Object.freeze({
        kind: 'controller_method_response_action_correlation_rejected',
        product,
        actionJudgments: Object.freeze(correlatedActionJudgments),
        reason: 'ambiguous_action_judgments',
      });
  }
  const [actionJudgment] = correlatedActionJudgments;
  switch (actionJudgment) {
    case undefined:
      return Object.freeze({
        kind: 'controller_method_response_action_correlation_rejected',
        product,
        actionJudgments: input.actionJudgments,
        reason: 'no_matching_action_judgment',
      });
    default:
      break;
  }
  const outputTypeJudgment = outputTypeAuthority.judge(Object.freeze({ kind: 'laravel_controller_response_output_type_input', result: product.result, resourceDefinitions: input.resourceDefinitions, source: product.method.source, frameworkVersion: input.frameworkVersion }));
  const output: TypeExpression = (() => {
    switch (outputTypeJudgment.kind) {
      case 'controller_response_output_type_proven':
        return outputTypeJudgment.output;
      case 'controller_response_output_type_unresolved':
        return Object.freeze({ kind: 'mixed' });
    }
  })();
  const definition: ResponseDefinition = Object.freeze({
    kind: 'response',
    typeName: createResponseTypeName(`${product.method.action.action.value.value}Response`),
    output,
    transport: emptyResponseTransport,
    outcome: Object.freeze({ kind: 'success', result: product.result }),
    source: product.method.source,
  });
  const ast = createDomainAstJudgment({ kind: 'response_ast', semantic: definition, source: product.method.source });
  return Object.freeze({ kind: 'controller_method_response_ast_projection_complete', product, actionJudgment, outputTypeJudgment, definition, ast });
}

const createLaravelControllerMethodResponseAstProjectionImpl = (
  outputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface,
): LaravelControllerMethodResponseAstProjectionInterface => Object.freeze({
  kind: 'laravel_controller_method_response_ast_projection',
  contract: methodResponseAstProjectionContract,
  outputTypeJudgment,
  project: (input: LaravelControllerMethodResponseAstProjectionInput) => projectMethodResponseAst(input, outputTypeJudgment),
});

const methodResponseAstProjection = createLaravelControllerMethodResponseAstProjectionImpl(responseOutputTypeJudgment);

type MethodResponseProjectionTail =
  | Readonly<{ readonly kind: 'controller_method_response_projection_complete'; readonly methods: readonly LaravelControllerMethodResponseProduct[] }>
  | Readonly<{ readonly kind: 'controller_method_response_projection_unresolved' }>;

type MethodResponseProjectionAggregate =
  | Readonly<{ readonly kind: 'controller_method_response_projection_complete'; readonly firstMethod: LaravelControllerMethodResponseProduct; readonly remainingMethods: readonly LaravelControllerMethodResponseProduct[] }>
  | Readonly<{ readonly kind: 'controller_method_response_projection_unresolved' }>;

function dtoResponseContractsForMethod(
  method: LaravelControllerMethodReturnSemantic,
  judgments: readonly LaravelDtoResponseContractProjectionJudgment[],
): readonly LaravelDtoResponseContractProjectionJudgment[] {
  return Object.freeze(judgments.filter(judgment => {
    const owner = judgment.input.declarationJudgment.request.owner;
    switch (owner.kind) {
      case 'dto_property_type_reference_owner':
        return false;
      case 'controller_response_attribute_owner':
        return owner.methodEvidence === method.methodEvidence;
    }
  }));
}

function projectMethodResponseTail(
  methods: readonly LaravelControllerMethodReturnSemantic[],
  dtoResponseContractJudgments: readonly LaravelDtoResponseContractProjectionJudgment[],
): MethodResponseProjectionTail {
  switch (methods.length) {
    case 0:
      return Object.freeze({ kind: 'controller_method_response_projection_complete', methods: Object.freeze([]) });
    default: {
      const [first, ...remaining] = methods;
      const firstProjection = returnResponseProjection.project(first.returned);
      switch (firstProjection.kind) {
        case 'controller_return_response_projection_unresolved':
          return Object.freeze({ kind: 'controller_method_response_projection_unresolved' });
        case 'controller_return_response_projection_complete': {
          const tail = projectMethodResponseTail(remaining, dtoResponseContractJudgments);
          switch (tail.kind) {
            case 'controller_method_response_projection_unresolved':
              return Object.freeze({ kind: 'controller_method_response_projection_unresolved' });
            case 'controller_method_response_projection_complete':
              return Object.freeze({
                kind: 'controller_method_response_projection_complete',
                methods: Object.freeze([
                  Object.freeze({
                    kind: 'controller_method_response_product',
                    method: first,
                    result: firstProjection.result,
                    dtoResponseContracts: dtoResponseContractsForMethod(first, dtoResponseContractJudgments),
                  }),
                  ...tail.methods,
                ]),
              });
          }
        }
      }
    }
  }
}

function projectMethodResponses(
  methods: readonly [LaravelControllerMethodReturnSemantic, ...LaravelControllerMethodReturnSemantic[]],
  dtoResponseContractJudgments: readonly LaravelDtoResponseContractProjectionJudgment[],
): MethodResponseProjectionAggregate {
  const [first, ...remaining] = methods;
  const firstProjection = returnResponseProjection.project(first.returned);
  switch (firstProjection.kind) {
    case 'controller_return_response_projection_unresolved':
      return Object.freeze({ kind: 'controller_method_response_projection_unresolved' });
    case 'controller_return_response_projection_complete': {
      const tail = projectMethodResponseTail(remaining, dtoResponseContractJudgments);
      switch (tail.kind) {
        case 'controller_method_response_projection_unresolved':
          return Object.freeze({ kind: 'controller_method_response_projection_unresolved' });
        case 'controller_method_response_projection_complete':
          return Object.freeze({
            kind: 'controller_method_response_projection_complete',
            firstMethod: Object.freeze({
              kind: 'controller_method_response_product',
              method: first,
              result: firstProjection.result,
              dtoResponseContracts: dtoResponseContractsForMethod(first, dtoResponseContractJudgments),
            }),
            remainingMethods: tail.methods,
          });
      }
    }
  }
}

function judgeResponse<Input extends LaravelControllerResponseSemanticJudgmentInput>(
  input: Input,
): LaravelControllerResponseSemanticJudgmentFromInput<Input>;
function judgeResponse(
  input: LaravelControllerResponseSemanticJudgmentInput,
): LaravelControllerResponseSemanticJudgment | LaravelControllerResponseEvidenceSourceBindingRejectedJudgment {
  switch (input.sourceBindingJudgment.kind) {
    case 'controller_response_evidence_source_binding_rejected':
      return Object.freeze({
        kind: 'controller_response_evidence_source_binding_rejected',
        invocationJudgment: input.invocationJudgment,
        sourceBindingJudgment: input.sourceBindingJudgment,
      });
    case 'controller_response_evidence_source_binding_empty':
      return blockUnprovenResponse(input.invocationJudgment, Object.freeze([]));
    case 'controller_response_evidence_source_binding_complete': {
      const [firstEvidence, ...remainingEvidence] = input.sourceBindingJudgment.evidence.map(entry => entry.evidence);
      if (firstEvidence === undefined) {
        return blockUnprovenResponse(input.invocationJudgment, Object.freeze([]));
      }
      const dtoJudgmentEvidence: readonly LaravelControllerResponseSemanticEvidence[] = Object.freeze(
        input.dtoDeclarationResolutionJudgments.map(judgment => Object.freeze({
          kind: 'response_dto_declaration_resolution_judgment' as const,
          judgment,
        })),
      );
      const dtoPropertyBindingEvidence: readonly LaravelControllerResponseSemanticEvidence[] = Object.freeze(
        input.dtoPropertyTypeReferenceBindingEvidence.map(evidence => Object.freeze({
          kind: 'response_dto_property_type_reference_binding_judgment' as const,
          evidence,
        })),
      );
      const dtoProjectionEvidence: readonly LaravelControllerResponseSemanticEvidence[] = Object.freeze(
        input.dtoResponseContractProjectionJudgments.map(judgment => Object.freeze({
          kind: 'response_dto_contract_projection_judgment' as const,
          judgment,
        })),
      );
      const evidence: readonly [LaravelControllerResponseSemanticEvidence, ...LaravelControllerResponseSemanticEvidence[]] = [
        firstEvidence,
        ...remainingEvidence,
        ...dtoJudgmentEvidence,
        ...dtoPropertyBindingEvidence,
        ...dtoProjectionEvidence,
      ];
      if (!hasInvocationOutcome(input.invocationJudgment, 'php_source_invocation_integration_complete')) {
        return blockUnprovenResponse(input.invocationJudgment, evidence);
      }
      const firstDtoJudgment = input.dtoDeclarationResolutionJudgments.find(judgment => judgment.kind !== 'response_dto_declaration_resolved');
      switch (firstDtoJudgment?.kind) {
        case undefined:
          break;
        case 'response_dto_declaration_unresolved':
          return blockUnprovenResponse(input.invocationJudgment, evidence, Object.freeze({ kind: 'response_dto_declaration_unresolved' }));
        case 'response_dto_declaration_ambiguous':
          return blockUnprovenResponse(input.invocationJudgment, evidence, Object.freeze({ kind: 'response_evidence_ambiguous' }));
      }
      const unresolvedPropertyBinding = input.dtoPropertyTypeReferenceBindingEvidence.find(entry => entry.judgment.kind === 'laravel_dto_type_reference_unresolved');
      switch (unresolvedPropertyBinding?.judgment.kind) {
        case 'laravel_dto_type_reference_unresolved':
          return blockUnprovenResponse(input.invocationJudgment, evidence, Object.freeze({ kind: 'response_dto_property_type_reference_unresolved' }));
        case 'laravel_dto_type_reference_bound':
        case undefined:
          break;
      }
      const unresolvedDtoProjection = input.dtoResponseContractProjectionJudgments.find(judgment => judgment.kind === 'laravel_dto_response_contract_projection_unresolved');
      switch (unresolvedDtoProjection?.kind) {
        case 'laravel_dto_response_contract_projection_unresolved':
          return blockUnprovenResponse(input.invocationJudgment, evidence, Object.freeze({ kind: 'response_dto_contract_projection_unresolved' }));
        case undefined:
          break;
      }
      const methods: readonly LaravelControllerMethodReturnSemantic[] = Object.freeze(
        input.sourceBindingJudgment.observations.map(observation => Object.freeze({
          kind: 'controller_method_return_semantic',
          methodEvidence: observation.methodEvidence,
          action: observation.action,
          source: observation.methodEvidence.source,
          returned: observation.action.semantic.returned,
        })),
      );
      const [firstMethod, ...remainingMethods] = methods;
      switch (firstMethod?.kind) {
        case undefined:
          return blockUnprovenResponse(input.invocationJudgment, evidence);
        case 'controller_method_return_semantic': {
          const canonicalMethods: readonly [LaravelControllerMethodReturnSemantic, ...LaravelControllerMethodReturnSemantic[]] = Object.freeze([firstMethod, ...remainingMethods]);
          const projection = projectMethodResponses(canonicalMethods, input.dtoResponseContractProjectionJudgments);
          switch (projection.kind) {
            case 'controller_method_response_projection_unresolved':
              return Object.freeze({
                kind: 'controller_response_return_semantics_complete',
                invocationJudgment: input.invocationJudgment,
                evidence,
                product: Object.freeze({ kind: 'controller_method_return_semantics', methods: canonicalMethods }),
              });
            case 'controller_method_response_projection_complete':
              return Object.freeze({
                kind: 'controller_response_method_products_complete',
                invocationJudgment: input.invocationJudgment,
                evidence,
                product: Object.freeze({ kind: 'controller_method_response_products', firstMethod: projection.firstMethod, remainingMethods: projection.remainingMethods }),
              });
          }
        }
      }
    }
  }
}

const createLaravelControllerResponseSemanticJudgmentAuthorityImpl = (
  sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
): LaravelControllerResponseSemanticJudgmentAuthorityInterface => Object.freeze({
  kind: 'laravel_controller_response_semantic_judgment_authority',
  closed: true,
  contract: responseJudgmentContract,
  sourceIdentitySemantics,
  sourceBindingContract: evidenceSourceBindingContract,
  returnResponseProjection,
  judge: judgeResponse,
});

const createLaravelControllerResponseSemanticRuntimeExecutorImpl = <
  Authority extends LaravelControllerResponseSemanticJudgmentAuthorityInterface,
>(authority: Authority): LaravelControllerResponseSemanticRuntimeExecutorInterface<Authority> => Object.freeze({
  kind: 'laravel_controller_response_semantic_runtime_executor',
  closed: true,
  contractVersion: 2,
  authority,
  returnResponseProjection: authority.returnResponseProjection,
  execute: authority.judge,
});

const responseSemanticAuthority = createLaravelControllerResponseSemanticJudgmentAuthorityImpl(laravelSourceIdentitySemantics);
const dtoDeclarationResolutionAuthority = laravelControllerResponseDtoDeclarationResolutionAuthorityFactory.create(
  Object.freeze({ sourceIdentitySemantics: laravelSourceIdentitySemantics }),
);
const dtoTypeReferenceBindingAuthority = laravelDtoTypeReferenceBindingAuthorityFactory.create(
  Object.freeze({
    classNameResolutionAuthority: phpClassNameResolutionAuthority,
    declarationResolutionAuthority: dtoDeclarationResolutionAuthority,
  }),
);

const evidenceProduction: LaravelControllerResponseEvidenceProductionInterface = Object.freeze({
  kind: 'laravel_controller_response_evidence_production',
  closed: true,
  contractVersion: 10,
  contract: evidenceProductionContract,
  produce: produceResponseEvidence,
});

function resolveDtoDeclarationJudgments<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
  input: LaravelControllerResponseIntegratedJudgmentInput<InvocationJudgment>,
  classNameResolutionAuthority: PhpClassNameResolutionRuleInterface,
  dtoDeclarationResolutionAuthority: LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface,
): readonly LaravelControllerResponseDtoDeclarationResolutionJudgment[] {
  return Object.freeze(input.declarationEvidence.methods.flatMap(methodEvidence => {
    switch (methodEvidence.responseAttribute.kind) {
      case 'response_attribute_not_declared':
        return [];
      case 'response_attribute_declared': {
        const classNameContext = (() => {
          switch (methodEvidence.responseAttribute.classNameResolutionContext.kind) {
            case 'available':
              return methodEvidence.responseAttribute.classNameResolutionContext.context;
            case 'unavailable':
              return Object.freeze({ kind: 'php_class_name_resolution_context_unavailable' as const });
          }
        })();
        const requestedClassResolution = classNameResolutionAuthority.judge(Object.freeze({
          kind: 'php_class_name_resolution_input',
          sourceName: createClassName(methodEvidence.responseAttribute.response.name.value.value),
          context: classNameContext,
        }));
        return [dtoDeclarationResolutionAuthority.resolve(Object.freeze({
          kind: 'laravel_controller_response_dto_declaration_resolution_input',
          sourceProject: input.sourceProject,
          inventory: input.dtoDeclarationInventory,
          requestedClassResolution,
          requestSource: methodEvidence.responseAttribute.source,
          owner: Object.freeze({ kind: 'controller_response_attribute_owner', methodEvidence }),
        }))];
      }
    }
  }));
}

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

function bindDtoPropertyTypeReferences(
  input: LaravelControllerResponseIntegratedJudgmentInput,
  declarationJudgments: readonly LaravelControllerResponseDtoDeclarationResolutionJudgment[],
  dtoTypeReferenceBindingAuthority: LaravelDtoTypeReferenceBindingAuthorityInterface,
): readonly LaravelDtoPropertyTypeReferenceBindingEvidence[] {
  const resolvedDeclarations = declarationJudgments.flatMap(judgment => {
    switch (judgment.kind) {
      case 'response_dto_declaration_unresolved':
      case 'response_dto_declaration_ambiguous':
        return [];
      case 'response_dto_declaration_resolved':
        return [judgment.declaration];
    }
  });
  const uniqueDeclarations = resolvedDeclarations.filter((declaration, index, declarations) =>
    declarations.findIndex(candidate => candidate === declaration) === index,
  );
  return Object.freeze(uniqueDeclarations.flatMap(declaration => {
    const properties: readonly DtoProperty[] = sequenceToArray(declaration.declaration.semantic.properties.items);
    return properties.flatMap(property => {
      switch (property.typeEvidence.kind) {
        case 'dto_property_primitive_type_evidence':
        case 'dto_property_mixed_type_evidence':
        case 'dto_property_unsupported_type_evidence':
          return [];
        case 'dto_property_class_reference_type_evidence': {
          const bindingJudgment = dtoTypeReferenceBindingAuthority.bind(Object.freeze({
            kind: 'laravel_dto_type_reference_binding_input',
            sourceProject: input.sourceProject,
            sourceName: property.typeEvidence.sourceName,
            lexicalContext: property.typeEvidence.lexicalContext,
            inventory: input.dtoDeclarationInventory,
            source: property.typeEvidence.source,
          }));
          return [Object.freeze({
            kind: 'laravel_dto_property_type_reference_binding_evidence' as const,
            ownerDeclaration: declaration,
            property,
            judgment: bindingJudgment,
          })];
        }
      }
    });
  }));
}

function projectDtoResponseContracts(
  declarationJudgments: readonly LaravelControllerResponseDtoDeclarationResolutionJudgment[],
  propertyBindings: readonly LaravelDtoPropertyTypeReferenceBindingEvidence[],
  projectionAuthority: LaravelDtoResponseContractProjectionAuthorityInterface,
): readonly LaravelDtoResponseContractProjectionJudgment[] {
  return Object.freeze(declarationJudgments.flatMap(judgment => {
    switch (judgment.kind) {
      case 'response_dto_declaration_unresolved':
      case 'response_dto_declaration_ambiguous':
        return [];
      case 'response_dto_declaration_resolved': {
        switch (judgment.request.owner.kind) {
          case 'dto_property_type_reference_owner':
            return [];
          case 'controller_response_attribute_owner':
            const declarationPropertyBindings = Object.freeze(propertyBindings.filter(
            binding => binding.ownerDeclaration === judgment.declaration,
          ));
          return [projectionAuthority.project(Object.freeze({
              kind: 'laravel_dto_response_contract_projection_input',
              declarationJudgment: judgment,
              responseShapeEvidence: Object.freeze({
                kind: 'laravel_dto_response_shape_available',
                shape: judgment.request.owner.methodEvidence.responseAttribute.shape,
              }),
              propertyTypeReferenceBindings: declarationPropertyBindings,
            }))];
        }
      }
    }
  }));
}

function judgeIntegratedResponse<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
  input: LaravelControllerResponseIntegratedJudgmentInput<InvocationJudgment>,
  dependencies: LaravelControllerResponseSemanticPipelineDependenciesInterface,
  responseExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface,
): LaravelControllerIntegratedResponseJudgment<InvocationJudgment> {
  const correlation = correlateDeclarationSource({
    kind: 'laravel_controller_response_declaration_source_correlation_input',
    invocationJudgment: input.invocationJudgment,
    declarationEvidence: input.declarationEvidence,
  }, dependencies.responseSemanticAuthority.sourceIdentitySemantics);
  switch (correlation.kind) {
    case 'controller_response_evidence_declaration_source_correlation_rejected':
      return Object.freeze({
        kind: 'controller_response_declaration_source_correlation_rejected',
        invocationJudgment: input.invocationJudgment,
        sourceCorrelation: correlation,
      });
    case 'controller_response_evidence_declaration_source_correlated': {
      const productionInput: LaravelControllerResponseEvidenceProductionInput<InvocationJudgment> = Object.freeze({
        kind: 'laravel_controller_response_evidence_production_input',
        invocationJudgment: input.invocationJudgment,
        declarationEvidence: input.declarationEvidence,
        dtoDeclarationInventory: input.dtoDeclarationInventory,
        sourceCorrelation: correlation,
      });
      const inventory = dependencies.evidenceProduction.produce(productionInput);
      const sourceBindingJudgment = bindResponseEvidence(inventory, dependencies.responseSemanticAuthority.sourceIdentitySemantics);
      const dtoDeclarationResolutionJudgments = resolveDtoDeclarationJudgments(
        input,
        dependencies.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority,
        dependencies.dtoTypeReferenceBindingAuthority.dependencies.declarationResolutionAuthority,
      );
      const dtoPropertyTypeReferenceBindingEvidence = bindDtoPropertyTypeReferences(input, dtoDeclarationResolutionJudgments, dependencies.dtoTypeReferenceBindingAuthority);
      const dtoResponseContractProjectionJudgments = projectDtoResponseContracts(
        dtoDeclarationResolutionJudgments,
        dtoPropertyTypeReferenceBindingEvidence,
        dependencies.dtoResponseContractProjectionAuthority,
      );
      const responseInput: LaravelControllerResponseSemanticJudgmentInput<InvocationJudgment> = Object.freeze({
        kind: 'laravel_controller_response_semantic_judgment_input',
        invocationJudgment: input.invocationJudgment,
        sourceBindingJudgment,
        dtoDeclarationResolutionJudgments,
        dtoPropertyTypeReferenceBindingEvidence,
        dtoResponseContractProjectionJudgments,
      });
      return responseExecutor.execute(responseInput);
    }
  }
}

/**
 * Composition root: the defaults are bound once into the same complete contract
 * consumed by the factory. The factory itself does not repair partial dependency
 * bundles or silently select semantic authorities.
 */
export const laravelControllerResponseSemanticPipelineDependencies: LaravelControllerResponseSemanticPipelineDependenciesInterface = Object.freeze({
  kind: 'laravel_controller_response_semantic_pipeline_dependencies',
  responseSemanticAuthority,
  dtoTypeReferenceBindingAuthority,
  dtoResponseContractProjectionAuthority: laravelDtoResponseContractProjectionAuthority,
  evidenceProduction,
  methodResponseAstProjection,
  astProjectionAuthority: laravelControllerAstProjectionSemanticAuthority,
});

const createLaravelControllerResponseSemanticPipelineImpl = (
  dependencies: LaravelControllerResponseSemanticPipelineDependenciesInterface,
): LaravelControllerResponseSemanticPipelineInterface => {
  const responseExecutor = createLaravelControllerResponseSemanticRuntimeExecutorImpl(dependencies.responseSemanticAuthority);
  const boundEvidenceSourceBinding: LaravelControllerResponseEvidenceSourceBindingAuthorityInterface = Object.freeze({
    kind: 'laravel_controller_response_evidence_source_binding_authority',
    closed: true,
    contract: evidenceSourceBindingContract,
    sourceIdentitySemantics: dependencies.responseSemanticAuthority.sourceIdentitySemantics,
    bind: <Input extends LaravelControllerResponseEvidenceSourceBindingInput>(input: Input): LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput<Input> => bindResponseEvidence(input, dependencies.responseSemanticAuthority.sourceIdentitySemantics),
  });
  return Object.freeze({
  kind: 'laravel_controller_response_semantic_pipeline',
  closed: true,
  contractVersion: 31,
  dependencies,
  sourceIdentitySemantics: dependencies.responseSemanticAuthority.sourceIdentitySemantics,
  correlateDeclarationSource: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(input: LaravelControllerResponseDeclarationSourceCorrelationInput<InvocationJudgment>) => correlateDeclarationSource(input, dependencies.responseSemanticAuthority.sourceIdentitySemantics),
  judgeIntegratedResponse: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    input: LaravelControllerResponseIntegratedJudgmentInput<InvocationJudgment>,
  ): LaravelControllerIntegratedResponseJudgment<InvocationJudgment> => judgeIntegratedResponse(input, dependencies, responseExecutor),
  evidenceProduction: dependencies.evidenceProduction,
  evidenceSourceBinding: boundEvidenceSourceBinding,
  dtoTypeReferenceBindingAuthority: dependencies.dtoTypeReferenceBindingAuthority,
  dtoResponseContractProjection: dependencies.dtoResponseContractProjectionAuthority,
  responseExecutor,
  responseOutputTypeJudgment: dependencies.methodResponseAstProjection.outputTypeJudgment,
  methodResponseAstProjection: dependencies.methodResponseAstProjection,
  astProjection: dependencies.astProjectionAuthority,
  contract: pipelineContract,
  });
};

export interface LaravelControllerResponseSemanticRuntimeOperationsInterface {
  readonly createMethodResponseAstProjection: (
    outputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface,
  ) => LaravelControllerMethodResponseAstProjectionInterface;
  readonly createSemanticJudgmentAuthority: (
    sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface,
  ) => LaravelControllerResponseSemanticJudgmentAuthorityInterface;
  readonly createRuntimeExecutor: <
    Authority extends LaravelControllerResponseSemanticJudgmentAuthorityInterface,
  >(authority: Authority) => LaravelControllerResponseSemanticRuntimeExecutorInterface<Authority>;
  readonly createPipeline: (
    dependencies: LaravelControllerResponseSemanticPipelineDependenciesInterface,
  ) => LaravelControllerResponseSemanticPipelineInterface;
}

export const laravelControllerResponseSemanticRuntimeOperations:
  LaravelControllerResponseSemanticRuntimeOperationsInterface = Object.freeze({
    createMethodResponseAstProjection: createLaravelControllerMethodResponseAstProjectionImpl,
    createSemanticJudgmentAuthority: createLaravelControllerResponseSemanticJudgmentAuthorityImpl,
    createRuntimeExecutor: createLaravelControllerResponseSemanticRuntimeExecutorImpl,
    createPipeline: createLaravelControllerResponseSemanticPipelineImpl,
  });

/** Composition root binds the interface-owned authority; scanner consumers depend only on the pipeline interface. */
export const laravelControllerResponseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface =
  laravelControllerResponseSemanticRuntimeOperations.createPipeline(
    laravelControllerResponseSemanticPipelineDependencies,
  );
