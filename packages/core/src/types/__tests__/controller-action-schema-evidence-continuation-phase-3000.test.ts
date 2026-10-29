import { describe, expect, it } from 'vitest';
import { emptyRouteSchemaPayload } from '../domain/validationRules';
import { sourceFileIdentityFactory, stringValue } from '../names';
import { controllerActionSchemaSemanticJudgmentAuthority, routeRequestSchemaEvidenceFactory } from '../controllerActionSchemaSemanticJudgmentAuthority';

describe('Phase 3000 route-request schema evidence domain continuation', () => {
  it('continues available evidence with its canonical source and schema origin', () => {
    const sourceIdentity = sourceFileIdentityFactory.create(stringValue.create('app/Http/Controllers/PaymentController.php'));
    const judgment = controllerActionSchemaSemanticJudgmentAuthority.judge(Object.freeze({
      requestEvidence: Object.freeze({ kind: 'no_form_request_schema_evidence' as const }),
      inlineSchema: emptyRouteSchemaPayload(),
      inlineSchemaEvidence: Object.freeze({ kind: 'no_inline_validation_evidence' as const }),
      inlineValidationEntries: Object.freeze([]),
      sourceIdentity,
    }));

    const boundaryProjection = judgment.routeRequestEvidence.continueToRouteBoundarySchema();

    expect(boundaryProjection.schemaEvidence).toBe(judgment.routeRequestEvidence);
    expect(boundaryProjection.schemaEvidence.kind).toBe('controller_action_route_request_schema_evidence');
    expect(boundaryProjection.schemaEvidence.sourceIdentity).toBe(sourceIdentity);
    expect(boundaryProjection.schemaEvidence.schemaOrigin).toBe('inline_validation_schema');
    expect(boundaryProjection.schema).toBe(judgment.derivation.schema);
  });

  it('continues unavailable evidence as a reasoned domain outcome', () => {
    const evidence = routeRequestSchemaEvidenceFactory.unavailable('action_judgment_ambiguous');
    const boundaryProjection = evidence.continueToRouteBoundarySchema();

    expect(boundaryProjection.schemaEvidence).toBe(evidence);
    expect(boundaryProjection.schemaEvidence.kind).toBe('route_request_schema_evidence_unavailable');
    expect(boundaryProjection.schemaEvidence.reason).toBe('action_judgment_ambiguous');
    expect(boundaryProjection.schema).toEqual(emptyRouteSchemaPayload());
  });
});
