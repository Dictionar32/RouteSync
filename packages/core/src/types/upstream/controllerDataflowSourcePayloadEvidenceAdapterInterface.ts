import type { ControllerDataflowDefinitionPayloadMetadata, ControllerDataflowSourcePayload } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type { SourceFile } from './names';

/** Source evidence acquisition input; syntax-specific source type is supplied by the adapter. */
export interface ControllerDataflowSourcePayloadEvidenceInput<Source> {
  readonly kind: 'controller_dataflow_source_payload_evidence_input';
  readonly sourceFile: SourceFile;
  readonly source: Source;
}

/**
 * Contract for extracting source-backed expression payloads from a parser-owned syntax tree.
 * This adapter extracts evidence only: it does not correlate bindings, classify origin, or infer semantics.
 */
export interface ControllerDataflowSourcePayloadEvidenceAdapterInterface<
  Source,
  Payload extends ControllerDataflowDefinitionPayloadMetadata,
> {
  readonly kind: 'controller_dataflow_source_payload_evidence_adapter';
  readonly contractVersion: 1;
  readonly collect: (input: ControllerDataflowSourcePayloadEvidenceInput<Source>) => readonly ControllerDataflowSourcePayload<Payload>[];
}

export interface ControllerDataflowSourcePayloadEvidenceAdapterContract {
  readonly kind: 'controller_dataflow_source_payload_evidence_adapter_contract';
  readonly version: 1;
  readonly responsibility: 'extract-parser-owned-source-payloads-with-canonical-source-identity-and-typed-statement-index';
  readonly excludedResponsibilities: 'binding-correlation-variable-origin-judgment-expression-semantic-resolution-and-variable-grouping-remain-outside-source-evidence-extraction';
}

export const CONTROLLER_DATAFLOW_SOURCE_PAYLOAD_EVIDENCE_ADAPTER_CONTRACT: ControllerDataflowSourcePayloadEvidenceAdapterContract = Object.freeze({
  kind: 'controller_dataflow_source_payload_evidence_adapter_contract',
  version: 1,
  responsibility: 'extract-parser-owned-source-payloads-with-canonical-source-identity-and-typed-statement-index',
  excludedResponsibilities: 'binding-correlation-variable-origin-judgment-expression-semantic-resolution-and-variable-grouping-remain-outside-source-evidence-extraction',
});
