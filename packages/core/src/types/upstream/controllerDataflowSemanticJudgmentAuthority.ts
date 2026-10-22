import { controllerDataflowBindingPayloadCorrespondenceAuthority } from './controllerDataflowBindingPayloadCorrespondenceAuthority';
import type { ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import { controllerDataflowVariableIdentityAuthority } from './controllerDataflowVariableIdentityAuthority';
import type { ControllerDataflowVariableIdentityAuthorityInterface } from './controllerDataflowVariableIdentityInterface';
import { controllerSemanticVariableFlowCompositionAuthority } from './controllerSemanticVariableFlowCompositionAuthority';
import type { ControllerSemanticVariableFlowCompositionAuthorityInterface } from './controllerSemanticVariableFlowCompositionInterface';
import { invocationSemanticIntegratedResponseComposition } from './invocationSemanticPipeline';
import type { InvocationSemanticIntegratedResponseCompositionInterface } from './invocationSemanticPipelineInterface';
import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import type { LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';
import type {
  ControllerDataflowBindingPayloadCorrespondenceJudgment,
  ControllerDataflowDefinitionPayloadMetadata,
} from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type {
  ControllerDataflowBindingSemanticJudgmentInterface,
  ControllerDataflowPayloadSemanticJudgment,
} from './controllerDataflowInvocationSemanticModelInterface';
import type {
  ControllerDataflowSemanticJudgment,
  ControllerDataflowSemanticJudgmentAuthorityInput,
  ControllerDataflowSemanticJudgmentAuthorityInterface,
} from './controllerDataflowSemanticJudgmentAuthorityInterface';
import type { SemanticBinding, SemanticKnowledgeDataFlow } from './semanticDataflowKnowledge';
import type { ControllerDataflowVariableIdentityJudgment } from './controllerDataflowVariableIdentityInterface';
import type { SourceFile } from './names';

const unresolvedCorrespondence = <Binding, Payload>(
  correspondence: ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>,
): Extract<ControllerDataflowBindingSemanticJudgmentInterface<Binding, Payload>, { readonly kind: 'controller_dataflow_binding_correspondence_unresolved' }> => {
  switch (correspondence.kind) {
    case 'binding_payload_correspondence_missing':
    case 'binding_payload_correspondence_ambiguous':
      return Object.freeze({ kind: 'controller_dataflow_binding_correspondence_unresolved', correspondence });
    case 'binding_payload_correspondence_matched':
      throw Error('Unresolved correspondence judgment requires a missing or ambiguous outcome');
  }
};

const identityUnresolved = <Binding, Payload>(
  correspondence: Extract<ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>, { readonly kind: 'binding_payload_correspondence_matched' }>,
  identity: ControllerDataflowVariableIdentityJudgment,
): Extract<ControllerDataflowBindingSemanticJudgmentInterface<Binding, Payload>, { readonly kind: 'controller_dataflow_binding_identity_unresolved' }> => {
  switch (identity.kind) {
    case 'controller_dataflow_variable_identity_missing':
    case 'controller_dataflow_variable_identity_ambiguous':
      return Object.freeze({ kind: 'controller_dataflow_binding_identity_unresolved', correspondence, identity });
    case 'controller_dataflow_variable_identity_resolved':
      throw Error('Unresolved identity judgment requires a missing or ambiguous outcome');
  }
};

const bindingJudgment = <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
  binding: SemanticBinding,
  input: ControllerDataflowSemanticJudgmentAuthorityInput<Payload>,
  dependencies: ControllerDataflowSemanticJudgmentAuthorityDependencies,
): ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload> => {
  const correspondence = dependencies.bindingPayloadCorrespondenceAuthority.judge({
    kind: 'controller_dataflow_binding_payload_correspondence_input',
    binding,
    payloads: input.sourceCorrelation.statementPayloads,
  });
  switch (correspondence.kind) {
    case 'binding_payload_correspondence_missing':
    case 'binding_payload_correspondence_ambiguous':
      return unresolvedCorrespondence(correspondence);
    case 'binding_payload_correspondence_matched': {
      const identity = dependencies.variableIdentityAuthority.resolve({
        kind: 'controller_dataflow_variable_identity_input',
        identity: correspondence.binding.variable,
        facts: input.sourceCorrelation.semanticKnowledgeProjection.knowledge.facts,
      });
      switch (identity.kind) {
        case 'controller_dataflow_variable_identity_missing':
        case 'controller_dataflow_variable_identity_ambiguous':
          return identityUnresolved(correspondence, identity);
        case 'controller_dataflow_variable_identity_resolved': {
          const definition = input.definitionProjectionAuthority.project({
            kind: 'controller_dataflow_definition_projection_input',
            correspondence,
            identity,
          });
          requireSameSourceFileIdentity(input.sourceCorrelation.sourceFile, definition.source.file, dependencies.sourceIdentitySemantics);
          return Object.freeze({
            kind: 'controller_dataflow_binding_semantics_resolved',
            correspondence,
            identity,
            definition,
          } satisfies Extract<ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>, { readonly kind: 'controller_dataflow_binding_semantics_resolved' }>);
        }
      }
    }
  }
};

const requireSameSourceFileIdentity = (
  canonical: SourceFile,
  candidate: SourceFile,
  identitySemantics: LaravelSourceIdentitySemanticsInterface,
): void => {
  const identityJudgment = identitySemantics.relateSourceFiles(canonical, candidate);
  switch (identityJudgment.kind) {
    case 'same_source_file_identity': return;
    case 'different_source_file_identity':
      throw Error('Controller dataflow source correlation requires one canonical source-file identity');
  }
};

type ResolvedBindingJudgment<Payload extends ControllerDataflowDefinitionPayloadMetadata> = Extract<
  ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>,
  { readonly kind: 'controller_dataflow_binding_semantics_resolved' }
>;

const payloadSemanticJudgment = <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
  payload: import('./controllerDataflowBindingPayloadCorrespondenceInterface').ControllerDataflowSourcePayload<Payload>,
  bindingJudgments: readonly ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>[],
): ControllerDataflowPayloadSemanticJudgment<Payload, ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>> => {
  const resolvedCandidates = bindingJudgments.filter(
    (judgment): judgment is ResolvedBindingJudgment<Payload> => {
      switch (judgment.kind) {
        case 'controller_dataflow_binding_semantics_resolved': return Object.is(judgment.correspondence.payload, payload);
        default: return false;
      }
    },
  );
  switch (resolvedCandidates.length) {
    case 0:
      return Object.freeze({ kind: 'controller_dataflow_payload_semantics_unresolved', payload });
    case 1: {
      const bindingJudgment = resolvedCandidates[0];
      switch (bindingJudgment) {
        case undefined:
          return Object.freeze({ kind: 'controller_dataflow_payload_semantics_unresolved', payload });
        default:
          switch (bindingJudgment.kind) {
            case 'controller_dataflow_binding_semantics_resolved':
              return Object.freeze({ kind: 'controller_dataflow_payload_semantics_resolved', payload, bindingJudgment });
          }
      }
    }
    default:
      return Object.freeze({ kind: 'controller_dataflow_payload_semantics_ambiguous', payload, bindingJudgments: resolvedCandidates });
  }
};

const derive = <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
  input: ControllerDataflowSemanticJudgmentAuthorityInput<Payload>,
  dependencies: ControllerDataflowSemanticJudgmentAuthorityDependencies,
): ControllerDataflowSemanticJudgment<Payload> => {
  const sourceCorrelation = input.sourceCorrelation;
  requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.invocationJudgment.sourceFile, dependencies.sourceIdentitySemantics);
  requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.semanticKnowledgeProjection.sourceFile, dependencies.sourceIdentitySemantics);
  sourceCorrelation.statementPayloads.forEach(payload => requireSameSourceFileIdentity(sourceCorrelation.sourceFile, payload.source.file, dependencies.sourceIdentitySemantics));
  const knowledge = sourceCorrelation.semanticKnowledgeProjection.knowledge;
  const bindings = knowledge.facts.flatMap((fact): readonly Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'binding' }>[] => {
    switch (fact.kind) {
      case 'binding': return [fact];
      default: return [];
    }
  });
  const bindingJudgments = bindings.map(fact => bindingJudgment(fact.value, input, dependencies));
  const resolved = bindingJudgments.flatMap((outcome): readonly ResolvedBindingJudgment<Payload>[] => {
    switch (outcome.kind) {
      case 'controller_dataflow_binding_semantics_resolved': return [outcome];
      default: return [];
    }
  });
  const payloadJudgments = sourceCorrelation.statementPayloads.map(payload => payloadSemanticJudgment(payload, bindingJudgments));
  const variableFlow = dependencies.variableFlowCompositionAuthority.compose({
    kind: 'controller_semantic_variable_flow_composition_input',
    definitions: resolved.map(outcome => outcome.definition),
  });
  const integratedResponse = dependencies.integratedResponseComposition.integrate({
    semanticKnowledgeProjection: sourceCorrelation.semanticKnowledgeProjection,
    phpSourceInvocationPipeline: sourceCorrelation.invocationJudgment.response,
  });
  return Object.freeze({
    kind: 'controller_dataflow_semantic_judgment',
    semanticKnowledgeProjection: sourceCorrelation.semanticKnowledgeProjection,
    semanticVariables: variableFlow.flow,
    bindingJudgments,
    payloadJudgments,
    invocationSemanticIntegratedResponse: integratedResponse,
    invocationJudgment: sourceCorrelation.invocationJudgment,
  });
};

export interface ControllerDataflowSemanticJudgmentAuthorityDependencies {
  readonly bindingPayloadCorrespondenceAuthority: ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface;
  readonly variableIdentityAuthority: ControllerDataflowVariableIdentityAuthorityInterface;
  readonly variableFlowCompositionAuthority: ControllerSemanticVariableFlowCompositionAuthorityInterface;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly integratedResponseComposition: InvocationSemanticIntegratedResponseCompositionInterface;
}

export const createControllerDataflowSemanticJudgmentAuthority = (
  dependencies: ControllerDataflowSemanticJudgmentAuthorityDependencies,
): ControllerDataflowSemanticJudgmentAuthorityInterface => Object.freeze({
  kind: 'controller_dataflow_semantic_judgment_authority',
  contractVersion: 17,
  bindingPayloadCorrespondenceAuthority: dependencies.bindingPayloadCorrespondenceAuthority,
  variableIdentityAuthority: dependencies.variableIdentityAuthority,
  variableFlowCompositionAuthority: dependencies.variableFlowCompositionAuthority,
  sourceIdentitySemantics: dependencies.sourceIdentitySemantics,
  integratedResponseComposition: dependencies.integratedResponseComposition,
  derive: input => derive(input, dependencies),
});

export const controllerDataflowSemanticJudgmentAuthority: ControllerDataflowSemanticJudgmentAuthorityInterface =
  createControllerDataflowSemanticJudgmentAuthority({
    bindingPayloadCorrespondenceAuthority: controllerDataflowBindingPayloadCorrespondenceAuthority,
    variableIdentityAuthority: controllerDataflowVariableIdentityAuthority,
    variableFlowCompositionAuthority: controllerSemanticVariableFlowCompositionAuthority,
    sourceIdentitySemantics: laravelSourceIdentitySemantics,
    integratedResponseComposition: invocationSemanticIntegratedResponseComposition,
  });
