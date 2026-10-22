import type { ControllerVariableOrigin } from './controller';
import type {
  ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface,
  ControllerDataflowBindingPayloadCorrespondenceInput,
  ControllerDataflowBindingPayloadCorrespondenceJudgment,
  ControllerDataflowBindingPayloadSourceBinding,
  ControllerDataflowDefinitionPayloadMetadata,
  ControllerDataflowSourcePayload,
} from './controllerDataflowBindingPayloadCorrespondenceInterface';

const sourceCorrespondsToPayload = <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
  input: ControllerDataflowBindingPayloadCorrespondenceInput<ControllerDataflowBindingPayloadSourceBinding, Payload>,
  payload: ControllerDataflowSourcePayload<Payload>,
): boolean => Object.is(input.binding.source.filePath.value, payload.source.file.value.value)
  && Object.is(input.binding.source.span.start.value, payload.source.start.value)
  && Object.is(input.binding.source.span.end.value, payload.source.end.value);

const canonicalDefinitionOrigin = (
  binding: ControllerDataflowBindingPayloadSourceBinding,
  statementIndex: ControllerDataflowDefinitionPayloadMetadata['statementIndex'],
): ControllerVariableOrigin => {
  switch (binding.origin.code) {
    case 'iteration': return Object.freeze({ kind: 'foreach', statementIndex });
    case 'exception_handler': return Object.freeze({ kind: 'catch', statementIndex });
    case 'parameter': return Object.freeze({ kind: 'parameter' });
    case 'assignment': return Object.freeze({ kind: 'assignment', statementIndex });
    default: return Object.freeze({ kind: 'external' });
  }
};

const judge = <Binding extends ControllerDataflowBindingPayloadSourceBinding, Payload extends ControllerDataflowDefinitionPayloadMetadata>(
  input: ControllerDataflowBindingPayloadCorrespondenceInput<Binding, Payload>,
): ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload> => {
  const candidates = input.payloads.filter(payload => sourceCorrespondsToPayload(input, payload));
  switch (candidates.length) {
    case 0:
      return Object.freeze({ kind: 'binding_payload_correspondence_missing', binding: input.binding, source: input.binding.source });
    case 1: {
      const payload = candidates[0];
      switch (payload) {
        case undefined:
          return Object.freeze({ kind: 'binding_payload_correspondence_missing', binding: input.binding, source: input.binding.source });
        default:
          return Object.freeze({
            kind: 'binding_payload_correspondence_matched',
            binding: input.binding,
            payload,
            definitionOrigin: canonicalDefinitionOrigin(input.binding, payload.payload.statementIndex),
          });
      }
    }
    default:
      return Object.freeze({ kind: 'binding_payload_correspondence_ambiguous', binding: input.binding, source: input.binding.source, candidates });
  }
};

export const controllerDataflowBindingPayloadCorrespondenceAuthority: ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface = Object.freeze({
  kind: 'controller_dataflow_binding_payload_correspondence_authority',
  contractVersion: 3,
  judge,
});
