import type {
  PhpFunctionInvocationSourceEvidence,
  PhpFunctionInvocationSourceInventory,
  PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface,
} from './phpFunctionInvocationSemanticAuthorityInterface';
import type { PhpSourceDocument, PhpSourceFrontendExtraction, PhpSourceFrontendInterface } from './phpSourceFrontendInterface';
import type {
  PhpSourceFrontendExtractionValidationAuthorityInterface,
  PhpSourceFrontendExtractionValidation,
} from './phpSourceFrontendValidationAuthorityInterface';
import type {
  PhpSourceInvocationSemanticPipelineBlocked,
  PhpSourceInvocationSemanticPipelineComplete,
  PhpSourceInvocationSemanticPipelineContract,
  PhpSourceInvocationSemanticPipelineInterface,
  PhpSourceInvocationSemanticPipelineResult,
} from './phpSourceInvocationSemanticPipelineInterface';
import { PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT } from './phpSourceInvocationSemanticPipelineInterface';
import type {
  PhpFunctionNameResolutionAuthorityInterface,
  PhpFunctionNameResolutionInput,
  PhpFunctionNameResolutionJudgment,
  PhpFunctionResolutionEnvironmentProjectionInterface,
  PhpFunctionResolutionSourceInventory,
  PhpFunctionResolutionSourceInventoryAuthorityInterface,
} from './phpFunctionNameResolutionInterface';
import type { SourceSpan } from './provenance';

export interface PhpSourceInvocationSemanticPipelineAuthorityDependencies {
  readonly frontend: PhpSourceFrontendInterface;
  readonly extractionValidation: PhpSourceFrontendExtractionValidationAuthorityInterface;
  readonly sourceInventory: PhpFunctionResolutionSourceInventoryAuthorityInterface;
  readonly environmentProjection: PhpFunctionResolutionEnvironmentProjectionInterface;
  readonly nameResolution: PhpFunctionNameResolutionAuthorityInterface;
  readonly invocationBatch: PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface;
}

export interface PhpSourceInvocationSemanticPipelineAuthorityInterface extends PhpSourceInvocationSemanticPipelineInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline_authority';
  readonly contract: PhpSourceInvocationSemanticPipelineContract;
  readonly dependencies: PhpSourceInvocationSemanticPipelineAuthorityDependencies;
}

const blocked = (result: PhpSourceInvocationSemanticPipelineBlocked): PhpSourceInvocationSemanticPipelineResult => Object.freeze(result);

const wholeFileInvocationInventory = (
  document: PhpSourceDocument,
  source: SourceSpan,
  entries: readonly PhpFunctionInvocationSourceEvidence[],
): PhpFunctionInvocationSourceInventory => Object.freeze({
  kind: 'php_function_invocation_source_inventory',
  sourceFile: document.sourceFile,
  entries: Object.freeze(entries),
  completeness: Object.freeze({
    kind: 'php_function_invocation_source_inventory_complete',
    sourceFile: document.sourceFile,
    source,
    obligations: Object.freeze([
      'all-php-function-call-nodes-inventoried',
      'all-call-arguments-captured',
      'all-name-resolution-environments-accounted-for',
    ]),
  }),
});

const rejectedValidation = (
  document: PhpSourceDocument,
  validation: Extract<PhpSourceFrontendExtractionValidation, { readonly kind: 'php_source_frontend_extraction_rejected' }>,
): PhpSourceInvocationSemanticPipelineBlocked => Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_blocked',
  stage: 'frontend_validation',
  document,
  validation,
});

const incompleteCoverage = (
  document: PhpSourceDocument,
  validation: Extract<PhpSourceFrontendExtractionValidation, { readonly kind: 'php_source_frontend_extraction_validated' }>,
): PhpSourceInvocationSemanticPipelineBlocked => Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_blocked',
  stage: 'frontend_coverage',
  document,
  validation: Object.freeze({ ...validation, completeness: 'incomplete' }),
});

const incompleteInventory = (
  document: PhpSourceDocument,
  extraction: PhpSourceFrontendExtraction,
  inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_incomplete' }>,
): PhpSourceInvocationSemanticPipelineBlocked => Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_blocked',
  stage: 'source_inventory',
  document,
  extraction: Object.freeze({
    kind: 'php_source_frontend_extraction_validated',
    extraction,
    completeness: 'complete',
  }),
  inventory,
});

const createPipeline = (
  dependencies: PhpSourceInvocationSemanticPipelineAuthorityDependencies,
): PhpSourceInvocationSemanticPipelineAuthorityInterface => {
  const analyze = (document: PhpSourceDocument): PhpSourceInvocationSemanticPipelineResult => {
    const extraction = dependencies.frontend.extract(document);
    const validation = dependencies.extractionValidation.validate({
      kind: 'php_source_frontend_extraction_validation_input',
      document,
      extraction,
    });

    switch (validation.kind) {
      case 'php_source_frontend_extraction_rejected':
        return blocked(rejectedValidation(document, validation));
      case 'php_source_frontend_extraction_validated':
        break;
    }

    if (validation.completeness !== 'complete') return blocked(incompleteCoverage(document, validation));

    const sourceInventory = dependencies.sourceInventory.inspect(extraction.nameResolutionInventory);
    switch (sourceInventory.kind) {
      case 'php_function_resolution_source_inventory_incomplete':
        return blocked(incompleteInventory(document, extraction, sourceInventory));
      case 'php_function_resolution_source_inventory_complete':
        break;
    }

    const invocationSyntaxInventory = extraction.invocationInventory;
    switch (invocationSyntaxInventory.kind) {
      case 'php_source_invocation_syntax_inventory_incomplete':
        return blocked(incompleteCoverage(document, validation));
      case 'php_source_invocation_syntax_inventory_complete':
        break;
    }

    const evidence: PhpFunctionInvocationSourceEvidence[] = [];
    const resolutions: PhpFunctionNameResolutionJudgment[] = [];
    for (const invocation of invocationSyntaxInventory.entries) {
      const projection = dependencies.environmentProjection.project({
        kind: 'php_function_resolution_environment_projection_input',
        inventory: sourceInventory,
        invocationSource: invocation.source,
      });
      switch (projection.kind) {
        case 'php_function_resolution_environment_projection_incomplete':
          return blocked(Object.freeze({
            kind: 'php_source_invocation_semantic_pipeline_blocked',
            stage: 'environment_projection',
            document,
            extraction: Object.freeze({ ...validation, completeness: 'complete' }),
            inventory: sourceInventory,
            projection,
          }));
        case 'php_function_resolution_environment_projection_complete':
          break;
      }
      const resolutionInput: PhpFunctionNameResolutionInput = Object.freeze({
        kind: 'php_function_name_resolution_evidence',
        syntaxEvidence: invocation.syntax,
        environment: projection.judgment,
        source: invocation.source,
      });
      evidence.push(Object.freeze({
        kind: 'php_function_invocation_source_evidence',
        resolutionInput,
        arguments: invocation.arguments,
      }));
      resolutions.push(dependencies.nameResolution.resolve(resolutionInput));
    }

    const invocationInventory = wholeFileInvocationInventory(document, extraction.source, evidence);
    const batch = dependencies.invocationBatch.derive({
      kind: 'php_function_invocation_semantic_judgment_batch_derivation_input',
      inventory: invocationInventory,
      resolutions,
    });
    switch (batch.kind) {
      case 'php_function_invocation_semantic_judgment_batch_rejected':
        return blocked(Object.freeze({
          kind: 'php_source_invocation_semantic_pipeline_blocked',
          stage: 'invocation_batch_closure',
          document,
          extraction: Object.freeze({ ...validation, completeness: 'complete' }),
          inventory: sourceInventory,
          batch,
        }));
      case 'php_function_invocation_semantic_judgment_batch_validated':
        return Object.freeze({
          kind: 'php_source_invocation_semantic_pipeline_complete',
          document,
          extraction: Object.freeze({ ...validation, completeness: 'complete' }),
          inventory: sourceInventory,
          resolutions: Object.freeze(resolutions),
          batch,
        }) satisfies PhpSourceInvocationSemanticPipelineComplete;
    }
  };

  return Object.freeze({
    kind: 'php_source_invocation_semantic_pipeline',
    contract: PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT,
    dependencies,
    analyze,
  });
};

export const createPhpSourceInvocationSemanticPipelineAuthority = createPipeline;
