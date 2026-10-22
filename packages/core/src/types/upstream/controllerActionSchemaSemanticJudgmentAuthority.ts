import type { RouteSchemaPayload } from '../domain/validationRules';
import { createRouteSchemaPayload } from '../domain/validationRules';
import type { RequestField } from '../domain/request';
import type { SourceFile } from './names';
import type { ControllerActionSchemaDerivation, ControllerActionSchemaRequestEvidence, ControllerActionSchemaSemanticJudgmentAuthorityInterface } from './controllerActionSchemaSemanticJudgmentInterface';
import { relationEqual } from '../../semantic/relations/semanticRelations';
import { relationGate } from '../../semantic/relations/relationalSequence';

const schemaIsEmpty = (schema: RouteSchemaPayload): boolean =>
  relationEqual(schema.fields.length + schema.messages.length + schema.attributes.length + schema.validationEntries.length, 0);

const inlineValidationDerivation = (schema: RouteSchemaPayload): ControllerActionSchemaDerivation =>
  Object.freeze({ kind: 'inline_validation_schema', schema } satisfies ControllerActionSchemaDerivation);

const formRequestDerivation = (
  fields: readonly RequestField[],
  inlineSchema: RouteSchemaPayload,
): ControllerActionSchemaDerivation =>
  relationGate(
    schemaIsEmpty(inlineSchema),
    () => Object.freeze({ kind: 'form_request_schema', schema: createRouteSchemaPayload(fields) } satisfies ControllerActionSchemaDerivation),
    () => Object.freeze({
      kind: 'form_request_and_inline_validation_schema',
      schema: createRouteSchemaPayload(
        [...fields, ...inlineSchema.fields],
        inlineSchema.messages,
        inlineSchema.attributes,
        inlineSchema.validationEntries,
      ),
    } satisfies ControllerActionSchemaDerivation),
  );

/**
 * Canonical upstream schema authority. It owns the request/inline-validation merge policy
 * and returns origin together with schema, so consumers cannot repeat the merge.
 */
export const controllerActionSchemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze({
  kind: 'controller_action_schema_semantic_judgment_authority',
  contractVersion: 3,
  sourceCorrelation: 'schema-judgment-retains-the-exact-action-source-identity',
  derivationClosure: 'schema-origin-is-explicit-and-the-canonical-route-schema-payload-is-published-once;form-request-presence-is-decided-by-the-evidence-discriminant-not-by-field-cardinality',
  judge: input => {
    let derivation: ControllerActionSchemaDerivation;
    switch (input.requestEvidence.kind) {
      case 'no_form_request_schema_evidence':
        derivation = inlineValidationDerivation(input.inlineSchema);
        break;
      case 'form_request_schema_evidence':
        derivation = formRequestDerivation(input.requestEvidence.source.fields, input.inlineSchema);
        break;
    }
    return Object.freeze({
      kind: 'controller_action_schema_semantic_judgment_completed',
      sourceIdentity: input.sourceIdentity,
      derivation,
      inlineValidationEntries: Object.freeze([...input.inlineValidationEntries]),
    });
  },
});
