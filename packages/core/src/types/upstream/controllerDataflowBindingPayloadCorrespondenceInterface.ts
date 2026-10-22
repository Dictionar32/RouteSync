import type { SourceSpan } from './provenance';
import type { SemanticSource, SemanticBindingOriginCode } from './semanticDataflowKnowledge';
import type { ControllerVariableOrigin } from './controller';
import type { StatementIndex } from './valueObjects';

/** Source-adapter payload represented by canonical provenance and source-specific evidence. */
export interface ControllerDataflowSourcePayload<Payload> {
  readonly kind: 'controller_dataflow_source_payload';
  readonly source: SourceSpan;
  readonly payload: Payload;
}

/** Closed correspondence judgment; absence and ambiguity are not fabricated AST values. */
export type ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload> =
  | Readonly<{
      readonly kind: 'binding_payload_correspondence_matched';
      readonly binding: Binding;
      readonly payload: ControllerDataflowSourcePayload<Payload>;
      /** Canonical origin judgment is closed with the matched source correspondence. */
      readonly definitionOrigin: ControllerVariableOrigin;
    }>
  | Readonly<{
      readonly kind: 'binding_payload_correspondence_missing';
      readonly binding: Binding;
      readonly source: SemanticSource;
    }>
  | Readonly<{
      readonly kind: 'binding_payload_correspondence_ambiguous';
      readonly binding: Binding;
      readonly source: SemanticSource;
      readonly candidates: readonly ControllerDataflowSourcePayload<Payload>[];
    }>;

/** Typed source identity accepted by the upstream correspondence authority. */
export interface ControllerDataflowBindingPayloadSourceBinding {
  readonly source: SemanticSource;
  readonly origin: Readonly<{ readonly code: SemanticBindingOriginCode }>;
}

/** Adapter payload metadata required to close a definition-origin judgment. */
export interface ControllerDataflowDefinitionPayloadMetadata {
  readonly statementIndex: StatementIndex;
}

export interface ControllerDataflowBindingPayloadCorrespondenceInput<
  Binding extends ControllerDataflowBindingPayloadSourceBinding,
  Payload extends ControllerDataflowDefinitionPayloadMetadata,
> {
  readonly kind: 'controller_dataflow_binding_payload_correspondence_input';
  readonly binding: Binding;
  readonly payloads: readonly ControllerDataflowSourcePayload<Payload>[];
}

/** Upstream authority for the exact file/start/end correspondence relation. */
export interface ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface {
  readonly kind: 'controller_dataflow_binding_payload_correspondence_authority';
  readonly contractVersion: 3;
  readonly judge: <Binding extends ControllerDataflowBindingPayloadSourceBinding, Payload extends ControllerDataflowDefinitionPayloadMetadata>(
    input: ControllerDataflowBindingPayloadCorrespondenceInput<Binding, Payload>,
  ) => ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>;
}

export interface ControllerDataflowBindingPayloadCorrespondenceContract {
  readonly kind: 'controller_dataflow_binding_payload_correspondence_contract';
  readonly version: 3;
  readonly identity: 'semantic-source-file-and-source-span-equal-canonical-payload-file-and-span';
  readonly closedOutcomes: 'matched-missing-and-ambiguous-remain-distinct';
  readonly missingOrAmbiguous: 'never-fabricate-an-unsupported-ast-expression-or-silently-discard-the-judgment';
  readonly ownership: 'upstream-authority-judges-correspondence-and-canonical-origin-source-adapter-only-supplies-payload-evidence';
  readonly originJudgment: 'matched-payload-origin-is-derived-from-semantic-binding-origin-and-typed-statement-index';
}

export const CONTROLLER_DATAFLOW_BINDING_PAYLOAD_CORRESPONDENCE_CONTRACT: ControllerDataflowBindingPayloadCorrespondenceContract = Object.freeze({
  kind: 'controller_dataflow_binding_payload_correspondence_contract',
  version: 3,
  identity: 'semantic-source-file-and-source-span-equal-canonical-payload-file-and-span',
  closedOutcomes: 'matched-missing-and-ambiguous-remain-distinct',
  missingOrAmbiguous: 'never-fabricate-an-unsupported-ast-expression-or-silently-discard-the-judgment',
  ownership: 'upstream-authority-judges-correspondence-and-canonical-origin-source-adapter-only-supplies-payload-evidence',
  originJudgment: 'matched-payload-origin-is-derived-from-semantic-binding-origin-and-typed-statement-index',
});
