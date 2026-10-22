import {
  LARAVEL_RESOURCE_INTEGRATED_RESPONSE_CONTRACT,
  type LaravelResourceScannerInterface,
  type LaravelResourceScanInput,
  type LaravelResourceScanJudgment,
  type LaravelResourceResolvedArtifact,
  type LaravelResourceRejectedArtifact,
  type LaravelResourceScanArtifact,
} from '../../../types/upstream/laravelResourceScannerInterface';
import { RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL } from '../../../types/upstream/resourceModelBindingSemanticInterface';
import { resourceModelBindingAuthority } from '../../semantic/resourceModelBindingAuthority';
import { resourceModelBindingBatchCompletenessFold, resourceModelBindingOutcomeFold, type ResourceModelBindingBatchClosure, type ResourceModelBindingJudgmentAuthority, type ResourceModelBindingSubject } from '../../../types/upstream/laravelScannerSemanticJudgment';
import type { ResourceReference } from '../../../types/upstream/semanticReferences';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Sequence, Lookup } from '../../../types/upstream/collections';
import type { ResourceScanEvidence } from '../lexer/resourceSourceEvidence';
import type { OriginModelSymbol } from '../symbols/model/originModelSymbol';
import type { PhpArrayEntry, PhpAstValue } from '../lexer/PhpAst';
import type { PhpStatement } from '../lexer/phpAstTypes';
import type { PhpMethodAst } from '../lexer/phpMethodAstTypes';
import type { PhpClassPropertyAst } from '../lexer/phpAstDeclarationTypes';
import type { ResourceProducerInterface } from '../../../types/upstream/resourceProducerInterface';
import { createModelSymbolTable } from '../symbols/ModelSymbolTable';
import { resourceProducer } from '../operations/resourceProducer';
import { matchLookup } from '../../../types/upstream/collections';

type LaravelResourceProducerOperations = ResourceProducerInterface<
  PhpArrayEntry,
  PhpStatement,
  PhpMethodAst,
  PhpClassPropertyAst,
  PhpAstValue,
  OriginModelSymbol
>;

/** The upstream operation contract is enforced at the canonical scanner boundary. */
const resourceProducerOperations: LaravelResourceProducerOperations = resourceProducer;

type ResourceProjection =
  | { readonly kind: 'resource_model_resolved_projection'; readonly artifact: LaravelResourceResolvedArtifact }
  | { readonly kind: 'resource_model_rejected_projection'; readonly artifact: LaravelResourceRejectedArtifact };

const resourceReference = (name: import('../../../types/upstream/names').ResourceName): ResourceReference => ({ kind: 'resource_reference', name });

const sourceSpanFor = (evidence: ResourceScanEvidence): SourceSpan => ({
  kind: 'source_span',
  file: evidence.identity.sourceFile,
  start: { kind: 'number_value', value: 0 },
  end: { kind: 'number_value', value: evidence.identity.sourceLength },
});

const sequenceFromArray = <Item>(items: readonly Item[]): Sequence<Item> =>
  items.reduceRight<Sequence<Item>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const projectResource = (
  modelSymbols: ReturnType<typeof createModelSymbolTable>,
  bindingAuthority: ResourceModelBindingJudgmentAuthority,
  bindingBatch: ReturnType<ResourceModelBindingJudgmentAuthority['judgeBatch']>,
  subjectEntry: {
    readonly evidence: ResourceScanEvidence;
    readonly subject: ReturnType<typeof createResourceSubject>;
  },
): ResourceProjection => {
  const evidence = subjectEntry.evidence;
  const subject = subjectEntry.subject;
  const resource = subject.resource;
  const source = subject.source;
  const modelBinding = bindingAuthority.bindingForSubject(bindingBatch, subject).judgment;

  return resourceModelBindingOutcomeFold.fold<ResourceProjection>(modelBinding.outcome, {
    resolved: candidate => {
      const modelLookup: Lookup<OriginModelSymbol> = modelSymbols.get(candidate.candidate.model.identity.name);
      return matchLookup(modelLookup, {
        missing: () => {
          throw Error(`Authority-resolved model '${candidate.candidate.model.identity.name.value.value}' has no corresponding canonical model AST.`);
        },
        found: ({ value: model }) => {
          const produced = resourceProducerOperations.produceResult({
            resourceName: evidence.identity.resourceName,
            entries: evidence.syntax.entries,
            source,
            model,
            assignments: evidence.syntax.assignments,
            method: evidence.syntax.method,
            baseClass: evidence.syntax.baseClass,
            wrapping: evidence.syntax.wrapping,
            requestParameter: evidence.syntax.requestParameter,
            documentationMixins: evidence.syntax.documentationMixins,
            methods: evidence.syntax.methods,
            properties: evidence.syntax.properties,
            preserveKeys: evidence.syntax.preserveKeys,
            forceWrapping: evidence.syntax.forceWrapping,
            usesRequestQueryString: evidence.syntax.usesRequestQueryString,
            includesPreviouslyLoadedRelationships: evidence.syntax.includesPreviouslyLoadedRelationships,
            jsonAttributes: evidence.syntax.jsonAttributes,
            jsonRelationships: evidence.syntax.jsonRelationships,
            collectsResource: evidence.syntax.collectsResource,
          });
          const artifact: LaravelResourceResolvedArtifact = Object.freeze({
            kind: 'laravel_resource_resolved_artifact',
            ast: produced.ast,
            definition: produced.definition,
            modelBinding: Object.freeze({ ...modelBinding, outcome: candidate }),
          });
          return { kind: 'resource_model_resolved_projection', artifact };
        },
      });
    },
    unresolved: () => ({
      kind: 'resource_model_rejected_projection',
      artifact: { kind: 'laravel_resource_rejected_artifact', resource, source, modelBinding },
    }),
    ambiguous: () => ({
      kind: 'resource_model_rejected_projection',
      artifact: { kind: 'laravel_resource_rejected_artifact', resource, source, modelBinding },
    }),
  });
};

const createResourceSubject = (evidence: ResourceScanEvidence): ResourceModelBindingSubject => Object.freeze({
  kind: 'resource_model_binding_subject',
  resource: resourceReference(evidence.identity.resourceName),
  source: sourceSpanFor(evidence),
});

export const laravelResourceScanner: LaravelResourceScannerInterface<ResourceScanEvidence> = Object.freeze({
  kind: 'laravel_resource_scanner',
  closed: true,
  contractVersion: 19,
  semanticJudgmentModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL,
  responseContract: LARAVEL_RESOURCE_INTEGRATED_RESPONSE_CONTRACT,
  bindingAuthority: resourceModelBindingAuthority,
  scan: async (input: LaravelResourceScanInput<ResourceScanEvidence>): Promise<LaravelResourceScanJudgment> => {
    const sourceEvidence = input.resourceEvidence;
    const resourceSubjects = Object.freeze(sourceEvidence.map(evidence => Object.freeze({ evidence, subject: createResourceSubject(evidence) })));
    const subjects = Object.freeze(resourceSubjects.map(entry => entry.subject));
    const relationEvidence = Object.freeze(sourceEvidence.flatMap(evidence => evidence.relations));
    const bindingBatch = resourceModelBindingAuthority.judgeBatch({
      kind: 'resource_model_binding_batch_judgment_input',
      subjects,
      models: input.modelDefinitions,
      controllerScan: input.controllerScan,
      relations: relationEvidence,
    });
    const bindingClosure: ResourceModelBindingBatchClosure = bindingBatch.closure;
    const modelSymbols = createModelSymbolTable(input.modelAsts);
    const resources = resourceSubjects.map(subjectEntry =>
      projectResource(modelSymbols, resourceModelBindingAuthority, bindingBatch, subjectEntry).artifact,
    );
    const artifacts: readonly LaravelResourceScanArtifact[] = Object.freeze(resources);
    return resourceModelBindingBatchCompletenessFold.fold<LaravelResourceScanJudgment>(bindingBatch.completeness, {
      complete: () => {
        const resolvedArtifacts = Object.freeze(resources.filter(
          (artifact): artifact is LaravelResourceResolvedArtifact => artifact.kind === 'laravel_resource_resolved_artifact',
        ));
        return Object.freeze({
          kind: 'laravel_resource_scan_complete',
          contractVersion: 19,
          response: Object.freeze({
            kind: 'laravel_resource_integrated_response',
            controllerScan: input.controllerScan,
            bindingClosure,
            artifacts: Object.freeze({ kind: 'laravel_resource_scan_artifact_sequence', items: sequenceFromArray(resolvedArtifacts) }),
          }),
        });
      },
      blocked: () => {
        const rejectedArtifacts = Object.freeze(resources.filter(
          (artifact): artifact is LaravelResourceRejectedArtifact => artifact.kind === 'laravel_resource_rejected_artifact',
        ));
        return Object.freeze({
          kind: 'laravel_resource_scan_blocked',
          contractVersion: 19,
          response: Object.freeze({
            kind: 'laravel_resource_integrated_response',
            controllerScan: input.controllerScan,
            bindingClosure,
            artifacts: Object.freeze({ kind: 'laravel_resource_scan_artifact_sequence', items: sequenceFromArray(artifacts) }),
          }),
          rejectedArtifacts,
        });
      },
    });
  },
});
