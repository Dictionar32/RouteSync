/**
 * Executable implementation of the upstream semantic-dataflow admission contract.
 *
 * Kept separate from `semanticDataflowInterface.ts`: the interface defines the
 * contract; this module implements its proof-envelope validation. It does not
 * derive facts, recompute closure, or repair a partial judgment.
 */
import type { SemanticDataflowIdentity, SemanticDataflowFact } from './semanticDataflow';
import { semanticDataflowIdentityKey } from './semanticDataflow';
import type {
  AstDataflowJudgment,
  SemanticDataflowBoundaryResult,
  SemanticDataflowBoundaryRejection,
  SemanticDataflowJudgmentBoundaryInterface,
} from './semanticDataflowInterface';

const boundaryIdentityKey = (identity: SemanticDataflowIdentity): string => JSON.stringify(semanticDataflowIdentityKey(identity));
const boundarySourceKey = (source: SemanticDataflowIdentity['source']): string => JSON.stringify({
  file: source.file.value.value,
  start: source.start.value,
  end: source.end.value,
});
const boundaryFactKey = (fact: SemanticDataflowFact): string => JSON.stringify(fact.kind === 'reaches'
  ? { kind: fact.kind, source: boundaryIdentityKey(fact.source), target: boundaryIdentityKey(fact.target) }
  : {
      kind: fact.kind,
      source: boundaryIdentityKey(fact.source),
      target: boundaryIdentityKey(fact.target),
      role: fact.role,
      guard: fact.guard === undefined ? null : {
        predicate: boundaryIdentityKey(fact.guard.predicate),
        polarity: fact.guard.polarity,
      },
    });
const boundaryContainsFact = (facts: readonly SemanticDataflowFact[], candidate: SemanticDataflowFact): boolean =>
  facts.some(fact => boundaryFactKey(fact) === boundaryFactKey(candidate));
const boundaryReject = (reason: SemanticDataflowBoundaryRejection['reason']): SemanticDataflowBoundaryRejection =>
  Object.freeze({ kind: 'semantic_dataflow_boundary_rejection', reason });

export const semanticDataflowJudgmentBoundary: SemanticDataflowJudgmentBoundaryInterface = Object.freeze({
  admit: (judgment: AstDataflowJudgment): SemanticDataflowBoundaryResult => {
    if (judgment.kind !== 'semantic_dataflow_judgment') return boundaryReject('wrong_judgment_kind');
    if (judgment.closed !== true || judgment.authority !== 'semantic_dataflow_judgment'
      || judgment.fixedPoint !== 'least_fixed_point'
      || judgment.reasoning !== 'declarative_relation_rewrite_fixed_point') {
      return boundaryReject('judgment_not_closed');
    }
    const contract = judgment.reasoningContract;
    if (contract.kind !== 'semantic_reasoning_contract' || contract.closed !== true
      || contract.authority !== 'upstream'
      || contract.strategy !== 'declarative_relation_rewrite_fixed_point') {
      return boundaryReject('reasoning_contract_not_closed');
    }
    if (contract.evidence.kind !== 'semantic_relation_fixed_point' || contract.evidence.closed !== true
      || contract.derivation.kind !== 'semantic_reasoning_derivation'
      || contract.derivation.strategy !== contract.strategy || contract.derivation.closed !== true
      || contract.provenance.kind !== 'semantic_reasoning_provenance'
      || contract.provenance.authority !== 'upstream' || contract.provenance.closed !== true
      || contract.closure.kind !== 'semantic_reasoning_closure' || contract.closure.closed !== true) {
      return boundaryReject('reasoning_proof_facets_inconsistent');
    }
    if (!Array.isArray(judgment.facts) || !Array.isArray(judgment.closure)
      || !Array.isArray(judgment.derivations) || !Array.isArray(judgment.paths)) {
      return boundaryReject('missing_evidence_collections');
    }
    const certificate = judgment.closureCertificate;
    if (certificate === undefined || certificate === null) return boundaryReject('closure_certificate_missing');
    if (certificate.kind !== 'semantic_dataflow_closure_certificate' || certificate.closed !== true
      || certificate.factClosure.kind !== 'fact_closure' || certificate.factClosure.converged !== true
      || !Number.isSafeInteger(certificate.factClosure.rounds) || certificate.factClosure.rounds < 0
      || certificate.pathClosure.kind !== 'path_closure' || certificate.pathClosure.converged !== true
      || !Number.isSafeInteger(certificate.pathClosure.rounds) || certificate.pathClosure.rounds < 0
      || certificate.derivationCoverage.kind !== 'derivation_coverage' || certificate.derivationCoverage.complete !== true
      || !Number.isSafeInteger(certificate.derivationCoverage.coveredFacts) || certificate.derivationCoverage.coveredFacts < 0
      || certificate.derivationCoverage.coveredFacts !== judgment.closure.length) {
      return boundaryReject('closure_certificate_invalid');
    }
    if (judgment.origin.kind !== 'semantic_dataflow_origin'
      || judgment.origin.source !== 'semantic_dataflow_input' || judgment.origin.closed !== true
      || boundaryIdentityKey(judgment.origin.identity) !== boundaryIdentityKey(judgment.node)) {
      return boundaryReject('origin_identity_mismatch');
    }
    if (boundarySourceKey(judgment.source) !== boundarySourceKey(judgment.node.source)) {
      return boundaryReject('source_identity_mismatch');
    }
    if (judgment.facts.some(fact => !boundaryContainsFact(judgment.closure, fact))) {
      return boundaryReject('input_fact_missing_from_closure');
    }
    const closureKeys = judgment.closure.map(boundaryFactKey);
    if (new Set(closureKeys).size !== closureKeys.length) {
      return boundaryReject('closure_fact_duplicate');
    }
    const derivationWitnesses = judgment.derivations.map(derivation =>
      `${derivation.rule?.value?.value ?? '<missing-rule>'}\u0000${derivation.witness?.value?.value ?? '<missing-witness>'}`);
    if (new Set(derivationWitnesses).size !== derivationWitnesses.length) {
      return boundaryReject('derivation_witness_duplicate');
    }
    for (const derivation of judgment.derivations) {
      if (derivation.kind !== 'semantic_dataflow_derivation' || !Array.isArray(derivation.premises)
        || derivation.rule?.kind !== 'semantic_dataflow_rule'
        || derivation.rule.value?.kind !== 'string_value' || typeof derivation.rule.value.value !== 'string'
        || derivation.witness?.kind !== 'semantic_dataflow_witness'
        || derivation.witness.value?.kind !== 'string_value' || typeof derivation.witness.value.value !== 'string') {
        return boundaryReject('derivation_identity_invalid');
      }
      if (derivation.premises.some(premise => !boundaryContainsFact(judgment.closure, premise))) {
        return boundaryReject('derivation_premise_missing');
      }
      if (!boundaryContainsFact(judgment.closure, derivation.conclusion)) {
        return boundaryReject('derivation_conclusion_missing');
      }
      const rule = derivation.rule.value.value;
      if (rule === 'semantic-dataflow-canonical-fact') {
        if (derivation.premises.length !== 0 || !boundaryContainsFact(judgment.facts, derivation.conclusion)) {
          return boundaryReject('derivation_premise_shape_invalid');
        }
      } else if (rule === 'semantic-dataflow-reach-seed') {
        const premise = derivation.premises[0];
        const conclusion = derivation.conclusion;
        if (derivation.premises.length !== 1 || premise === undefined || premise.kind === 'reaches' || conclusion.kind !== 'reaches') {
          return boundaryReject('derivation_premise_shape_invalid');
        }
        if (boundaryIdentityKey(premise.source) !== boundaryIdentityKey(conclusion.source)
          || boundaryIdentityKey(premise.target) !== boundaryIdentityKey(conclusion.target)) {
          return boundaryReject('derivation_rule_conclusion_mismatch');
        }
      } else if (rule === 'semantic-dataflow-reach-transitive') {
        const left = derivation.premises[0];
        const right = derivation.premises[1];
        const conclusion = derivation.conclusion;
        if (derivation.premises.length !== 2 || left === undefined || right === undefined
          || left.kind !== 'reaches' || right.kind !== 'reaches' || conclusion.kind !== 'reaches') {
          return boundaryReject('derivation_premise_shape_invalid');
        }
        if (boundaryIdentityKey(left.target) !== boundaryIdentityKey(right.source)
          || boundaryIdentityKey(left.source) !== boundaryIdentityKey(conclusion.source)
          || boundaryIdentityKey(right.target) !== boundaryIdentityKey(conclusion.target)) {
          return boundaryReject('derivation_rule_conclusion_mismatch');
        }
      } else {
        return boundaryReject('derivation_rule_unknown');
      }
    }
    if (judgment.closure.some(fact => !judgment.derivations.some(derivation => boundaryFactKey(derivation.conclusion) === boundaryFactKey(fact)))) {
      return boundaryReject('closure_derivation_missing');
    }
    // Validate proof grounding without re-running semantic closure. A fact is
    // grounded only when a derivation can be supported from already-grounded
    // premises; cyclic derivations cannot certify themselves.
    const groundedFacts = new Set<string>();
    const pendingDerivations = [...judgment.derivations];
    let madeProgress = true;
    while (madeProgress) {
      madeProgress = false;
      for (let index = pendingDerivations.length - 1; index >= 0; index -= 1) {
        const derivation = pendingDerivations[index];
        if (derivation === undefined) continue;
        const premisesGrounded = derivation.premises.every(premise => groundedFacts.has(boundaryFactKey(premise)));
        const canonicalInput = derivation.rule.value.value === 'semantic-dataflow-canonical-fact'
          && derivation.premises.length === 0
          && boundaryContainsFact(judgment.facts, derivation.conclusion);
        if (!canonicalInput && !premisesGrounded) continue;
        groundedFacts.add(boundaryFactKey(derivation.conclusion));
        pendingDerivations.splice(index, 1);
        madeProgress = true;
      }
    }
    if (judgment.closure.some(fact => !groundedFacts.has(boundaryFactKey(fact)))) {
      return boundaryReject('derivation_not_grounded');
    }
    for (const fact of judgment.closure) {
      if (fact.kind === 'reaches') continue;
      if (fact.lineage !== undefined && (fact.lineage.kind !== 'semantic_dataflow_fact_lineage'
        || fact.lineage.closed !== true
        || boundarySourceKey(fact.lineage.source) !== boundarySourceKey(fact.lineage.identity.source))) {
        return boundaryReject('fact_lineage_mismatch');
      }
    }
    for (const path of judgment.paths) {
      if (path.steps.length === 0) {
        if (boundaryIdentityKey(path.source) !== boundaryIdentityKey(path.target)) {
          return boundaryReject('path_endpoint_mismatch');
        }
        continue;
      }
      if (boundaryIdentityKey(path.steps[0].source) !== boundaryIdentityKey(path.source)
        || boundaryIdentityKey(path.steps[path.steps.length - 1].target) !== boundaryIdentityKey(path.target)) {
        return boundaryReject('path_endpoint_mismatch');
      }
      for (let index = 1; index < path.steps.length; index += 1) {
        if (boundaryIdentityKey(path.steps[index - 1].target) !== boundaryIdentityKey(path.steps[index].source)) {
          return boundaryReject('path_step_disconnected');
        }
      }
      if (path.steps.some(step => !boundaryContainsFact(judgment.closure, step))) {
        return boundaryReject('path_step_disconnected');
      }
    }
    return Object.freeze({ kind: 'semantic_dataflow_boundary_acceptance', judgment, closed: true });
  },
});
