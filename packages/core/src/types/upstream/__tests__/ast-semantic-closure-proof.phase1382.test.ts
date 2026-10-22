import { describe, expect, it } from 'vitest';
import { stringValue } from '../valueObjects';
import {
  astSemanticFact,
  astSemanticFacts,
  astSemanticInterface,
  astSemanticRequestIdentity,
  astSemanticRoundLimit,
  astSemanticTextTerm,
  type AstSemanticRule,
} from '../astSemanticInterface';

describe('Phase 1382 AST semantic closure proof', () => {
  it('preserves rule, premises, witness, and newly derived conclusions in the closure', () => {
    const premise = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('route-source'),
      astSemanticTextTerm('route-declaration'),
    );
    const conclusion = astSemanticFact(
      'upstream_mapping',
      'upstream_maps',
      astSemanticTextTerm('route-declaration'),
      astSemanticTextTerm('canonical-route'),
    );
    const rule: AstSemanticRule = Object.freeze({
      kind: 'ast_semantic_rule',
      name: Object.freeze({ kind: 'ast_rule', value: stringValue('map-route-declaration') }),
      stage: 'upstream_mapping',
      premises: Object.freeze([premise]),
      conclusions: Object.freeze([conclusion]),
    });

    const closure = astSemanticInterface.close({ kind: 'ast_semantic_closure_request', requestIdentity: astSemanticRequestIdentity('phase1382-closure-1'), seed: astSemanticFacts([premise]), rules: [rule], roundLimit: astSemanticRoundLimit(8) });

    expect(closure.status).toBe('closed');
    if (closure.status !== 'closed') throw new Error('expected closed fixture');
    expect(closure.requestIdentity).toEqual(astSemanticRequestIdentity('phase1382-closure-1'));
    expect(closure.certificate.requestIdentity).toBe(closure.requestIdentity);
    expect(closure.certificate.seedSnapshotIdentity).toBe(closure.seedSnapshotIdentity);
    expect(closure.certificate.ruleSetIdentity).toBe(closure.ruleSetIdentity);
    expect(closure.certificate.factSetIdentity).toBe(closure.factSetIdentity);
    expect(closure.certificate.derivationLedgerIdentity).toBe(closure.derivationLedgerIdentity);
    expect(closure.facts.items).toContainEqual(conclusion);
    expect(closure.derivations).toHaveLength(1);
    expect(closure.derivations[0]?.rule).toEqual(rule.name);
    expect(closure.derivations[0]?.premises).toContainEqual({ kind: 'ast_semantic_premise', fact: premise });
    expect(closure.derivations[0]?.conclusions).toContainEqual(conclusion);
    expect(closure.derivations[0]?.witness.value.value).toContain('map-route-declaration@round:1');
    expect(astSemanticInterface.verifyClosure({
      kind: 'ast_semantic_closure_request',
      requestIdentity: astSemanticRequestIdentity('phase1382-closure-1'),
      seed: astSemanticFacts([premise]),
      rules: [rule],
      roundLimit: astSemanticRoundLimit(8),
    }, closure).status).toBe('verified');
  });

  it('rejects a closure when the certificate is rebound to a different fact-set identity', () => {
    const premise = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('source'),
      astSemanticTextTerm('route'),
    );
    const request = {
      kind: 'ast_semantic_closure_request' as const,
      requestIdentity: astSemanticRequestIdentity('forged-certificate-check'),
      seed: astSemanticFacts([premise]),
      rules: Object.freeze([]),
      roundLimit: astSemanticRoundLimit(3),
    };
    const closure = astSemanticInterface.close(request);
    if (closure.status !== 'closed') throw new Error('expected closed fixture');
    const forged = Object.freeze({
      ...closure,
      factSetIdentity: Object.freeze({
        kind: 'ast_semantic_fact_set_identity' as const,
        canonicalForm: stringValue('forged-fact-set'),
      }),
    });
    expect(astSemanticInterface.verifyClosure(request, forged)).toMatchObject({
      kind: 'ast_semantic_closure_verification',
      status: 'rejected',
      reason: 'fact_set_mismatch',
    });
  });


  it('rejects a closed result whose final facts are not justified by a complete round ledger', () => {
    const premise = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('source'),
      astSemanticTextTerm('route'),
    );
    const conclusion = astSemanticFact(
      'upstream_mapping',
      'upstream_maps',
      astSemanticTextTerm('route'),
      astSemanticTextTerm('canonical-route'),
    );
    const rule: AstSemanticRule = Object.freeze({
      kind: 'ast_semantic_rule',
      name: Object.freeze({ kind: 'ast_rule', value: stringValue('map-route') }),
      stage: 'upstream_mapping',
      premises: Object.freeze([premise]),
      conclusions: Object.freeze([conclusion]),
    });
    const request = {
      kind: 'ast_semantic_closure_request' as const,
      requestIdentity: astSemanticRequestIdentity('phase1621-incomplete-ledger'),
      seed: astSemanticFacts([premise]),
      rules: Object.freeze([rule]),
      roundLimit: astSemanticRoundLimit(4),
    };
    const valid = astSemanticInterface.close(request);
    if (valid.status !== 'closed') throw new Error('expected closed fixture');
    const emptyLedgerIdentity = Object.freeze({
      kind: 'ast_semantic_derivation_ledger_identity' as const,
      canonicalForm: stringValue(JSON.stringify([])),
    });
    const forged = Object.freeze({
      ...valid,
      derivations: Object.freeze([]),
      derivationLedgerIdentity: emptyLedgerIdentity,
      certificate: Object.freeze({ ...valid.certificate, derivationLedgerIdentity: emptyLedgerIdentity }),
    });
    expect(astSemanticInterface.verifyClosure(request, forged)).toMatchObject({
      kind: 'ast_semantic_closure_verification',
      status: 'rejected',
      reason: 'derivation_replay_mismatch',
    });
  });

  it('canonicalizes seed and fact-set identity independently of declaration order', () => {
    const first = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('first-source'),
      astSemanticTextTerm('first-declaration'),
    );
    const second = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('second-source'),
      astSemanticTextTerm('second-declaration'),
    );
    const forward = astSemanticInterface.close({
      kind: 'ast_semantic_closure_request',
      requestIdentity: astSemanticRequestIdentity('canonical-order-forward'),
      seed: astSemanticFacts([first, second]),
      rules: [],
      roundLimit: astSemanticRoundLimit(4),
    });
    const reversed = astSemanticInterface.close({
      kind: 'ast_semantic_closure_request',
      requestIdentity: astSemanticRequestIdentity('canonical-order-reversed'),
      seed: astSemanticFacts([second, first]),
      rules: [],
      roundLimit: astSemanticRoundLimit(4),
    });

    expect(forward.status).toBe('closed');
    expect(reversed.status).toBe('closed');
    expect(forward.seedSnapshotIdentity).toEqual(reversed.seedSnapshotIdentity);
    expect(forward.factSetIdentity).toEqual(reversed.factSetIdentity);
    expect(forward.ruleSetIdentity).toEqual(reversed.ruleSetIdentity);
  });

  it('does not invent a derivation when no rule matches', () => {
    const seed = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('route-source'),
      astSemanticTextTerm('route-declaration'),
    );
    const unmatchedRule: AstSemanticRule = Object.freeze({
      kind: 'ast_semantic_rule',
      name: Object.freeze({ kind: 'ast_rule', value: stringValue('unmatched-rule') }),
      stage: 'upstream_mapping',
      premises: Object.freeze([astSemanticFact(
        'scanner_evidence',
        'scanner_observes',
        astSemanticTextTerm('missing-source'),
        astSemanticTextTerm('missing-declaration'),
      )]),
      conclusions: Object.freeze([astSemanticFact(
        'upstream_mapping',
        'upstream_maps',
        astSemanticTextTerm('missing-declaration'),
        astSemanticTextTerm('missing-canonical-route'),
      )]),
    });

    const closure = astSemanticInterface.close({ kind: 'ast_semantic_closure_request', requestIdentity: astSemanticRequestIdentity('phase1382-closure-2'), seed: astSemanticFacts([seed]), rules: [unmatchedRule], roundLimit: astSemanticRoundLimit(8) });

    expect(closure.status).toBe('closed');
    expect(closure.derivations).toHaveLength(0);
  });
  it('does not label an invalid round limit as a closed judgment', () => {
    const seed = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('source'),
      astSemanticTextTerm('declaration'),
    );
    const closure = astSemanticInterface.close({
      kind: 'ast_semantic_closure_request',
      requestIdentity: astSemanticRequestIdentity('phase1382-closure-3'),
      seed: astSemanticFacts([seed]),
      rules: [],
      roundLimit: astSemanticRoundLimit(0),
    });

    expect(closure.status).toBe('incomplete');
    if (closure.status === 'incomplete') {
      expect(closure.reason).toBe('invalid_round_limit');
      expect(closure.rounds.value.value).toBe(0);
    }
  });

  it('returns incomplete when the round limit is reached before fixed-point closure', () => {
    const first = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('source'),
      astSemanticTextTerm('declaration'),
    );
    const second = astSemanticFact(
      'upstream_mapping',
      'upstream_maps',
      astSemanticTextTerm('declaration'),
      astSemanticTextTerm('canonical-route'),
    );
    const third = astSemanticFact(
      'resolver_graph',
      'resolver_resolves',
      astSemanticTextTerm('canonical-route'),
      astSemanticTextTerm('resolved-route'),
    );
    const rules: readonly AstSemanticRule[] = [
      Object.freeze({
        kind: 'ast_semantic_rule',
        name: Object.freeze({ kind: 'ast_rule', value: stringValue('map-route') }),
        stage: 'upstream_mapping',
        premises: Object.freeze([first]),
        conclusions: Object.freeze([second]),
      }),
      Object.freeze({
        kind: 'ast_semantic_rule',
        name: Object.freeze({ kind: 'ast_rule', value: stringValue('resolve-route') }),
        stage: 'resolver_graph',
        premises: Object.freeze([second]),
        conclusions: Object.freeze([third]),
      }),
    ];

    const closure = astSemanticInterface.close({
      kind: 'ast_semantic_closure_request',
      requestIdentity: astSemanticRequestIdentity('phase1382-closure-4'),
      seed: astSemanticFacts([first]),
      rules,
      roundLimit: astSemanticRoundLimit(1),
    });

    expect(closure.status).toBe('incomplete');
    if (closure.status === 'incomplete') {
      expect(closure.reason).toBe('round_limit_reached');
      expect(closure.rounds.value.value).toBe(1);
      expect(closure.facts.items).toContainEqual(second);
      expect(closure.facts.items).not.toContainEqual(third);
    }
  });

  it('exposes closure reasoning and accepts only a verified closure through the canonical interface', () => {
    const premise = astSemanticFact(
      'scanner_evidence',
      'scanner_observes',
      astSemanticTextTerm('source'),
      astSemanticTextTerm('route'),
    );
    const request = {
      kind: 'ast_semantic_closure_request' as const,
      requestIdentity: astSemanticRequestIdentity('phase1627-verified-closure'),
      seed: astSemanticFacts([premise]),
      rules: [],
      roundLimit: astSemanticRoundLimit(4),
    };

    const assessment = astSemanticInterface.closeVerified(request);

    expect(astSemanticInterface.reasoning.strategy).toBe('declarative_relation_rewrite_fixed_point');
    expect(assessment.kind).toBe('ast_semantic_closure_assessment');
    expect(assessment.status).toBe('accepted');
    if (assessment.status !== 'accepted') throw new Error('expected verified semantic closure');
    expect(assessment.closure.status).toBe('closed');
    expect(assessment.verification.status).toBe('verified');
    expect(assessment.closure.requestIdentity).toEqual(request.requestIdentity);
  });

  it('does not accept an incomplete closure through the canonical interface', () => {
    const request = {
      kind: 'ast_semantic_closure_request' as const,
      requestIdentity: astSemanticRequestIdentity('phase1627-incomplete-closure'),
      seed: astSemanticFacts([]),
      rules: [],
      roundLimit: astSemanticRoundLimit(0),
    };

    const assessment = astSemanticInterface.closeVerified(request);

    expect(assessment.status).toBe('rejected');
    if (assessment.status !== 'rejected') throw new Error('expected rejected semantic closure');
    expect(assessment.closure.status).toBe('incomplete');
    expect(assessment.verification.status).toBe('rejected');
  });

});
