import type { ModelDefinition } from '../../types/upstream/model';
import type { ResourceModelBindingBatchClosure, ResourceModelBindingBatchCompleteness, ResourceModelBindingBatchJudgment, ResourceModelBindingBatchJudgmentInput, ResourceModelBindingCandidate, ResourceModelBindingEvidence, ResourceModelBindingJudgment, ResourceModelBindingJudgmentAuthority, ResourceModelBindingJudgmentInput, ResourceModelBindingOutcome, ResourceModelBindingSourceEvidence, ResourceModelBindingSubject } from '../../types/upstream/laravelScannerSemanticJudgment';
import type { SourceSpan } from '../../types/upstream/provenance';
import { ResourceNamingConvention } from '../../utils/resource-naming';
import { semanticRewriteAuthority } from '../../types/upstream/semanticRewriteAuthority';
import { RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL, RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY, RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL, RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET, type ResourceModelBindingBatchStateSemanticsInterface, type ResourceModelBindingCandidateCardinality } from '../../types/upstream/resourceModelBindingSemanticInterface';
import type { SemanticRelation } from '../../semantic/relations/semanticRewriteEngine';
import { relationAll, relationAny, relationEqual, relationGate } from '../../semantic/relations/semanticRelations';
import { relationExpand, relationFirstOption, relationOptionFold, relationRefine, relationSelect, relationSlice, relationVariantFold } from '../../semantic/relations/relationalSequence';

type ResourceModelBindingFact = SemanticRelation<import('../../types/upstream/resourceModelBindingSemanticInterface').ResourceModelBindingSemanticRelation>;

const sourceSpanKey = (source: SourceSpan): string => `${source.file.value.value}\u001f${source.start.value}\u001f${source.end.value}`;

const sameSourceSpan = (left: SourceSpan, right: SourceSpan): boolean => relationAll([
  relationEqual(left.file.value.value, right.file.value.value),
  relationEqual(left.start.value, right.start.value),
  relationEqual(left.end.value, right.end.value),
]);

const sameEvidence = (left: ResourceModelBindingEvidence, right: ResourceModelBindingEvidence): boolean => relationAll([
  relationEqual(left.resource.name.value.value, right.resource.name.value.value),
  relationEqual(left.model.name.value.value, right.model.name.value.value),
  relationEqual(left.basis, right.basis),
  sameSourceSpan(left.source, right.source),
]);

const semanticStringAtom = (value: ResourceModelBindingFact['arguments'][number]): string => relationOptionFold(
  relationRefine(value, (candidate): candidate is string => typeof candidate === 'string'),
  () => { throw Error('Resource model-binding semantic relation expected a text atom.'); },
  atom => atom,
);

const evidenceBasisFromAtom = (value: ResourceModelBindingFact['arguments'][number]): ResourceModelBindingEvidence['basis'] => relationOptionFold(
  relationFirstOption(RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET.judgmentModel.evidencePrecedence, candidate => relationEqual(candidate, value)),
  () => { throw Error('Resource model-binding semantic relation produced an unknown evidence basis.'); },
  candidate => candidate,
);

const sourceFact = (
  relation: ResourceModelBindingFact['relation'],
  arguments_: readonly (string | number | boolean)[],
): ResourceModelBindingFact => Object.freeze({ relation, arguments: Object.freeze([...arguments_]) });

const sourceEvidenceFacts = (input: ResourceModelBindingJudgmentInput): { readonly facts: readonly ResourceModelBindingFact[]; readonly provenance: readonly { readonly key: string; readonly source: SourceSpan }[] } => {
  const resourceName = input.subject.resource.name.value.value;
  const modelIdentityFacts = relationExpand(input.models, model => [
    sourceFact('resource_model_alias', [model.identity.name.value.value, model.identity.name.value.value]),
    sourceFact('resource_model_alias', [model.identity.name.value.value, model.identity.shortName.value.value]),
    sourceFact('resource_model_short_name', [model.identity.name.value.value, model.identity.shortName.value.value]),
    sourceFact('resource_model_table_name', [model.identity.name.value.value, model.identity.table.name.value.value]),
    ...model.relations.items.map(relation => sourceFact('resource_model_model_relation_target', [
      model.identity.name.value.value,
      relation.name.value.value,
      relation.target.value.value,
    ])),
  ]);
  const controllerOriginFacts = relationExpand(input.controllerScan.controllers, controller => relationExpand(
    relationSelect(controller.resourceBindings, binding => relationEqual(binding.resource.name.value.value, resourceName)),
    binding => relationGate(
      relationEqual(binding.modelOrigin.kind, 'model_class'),
      () => [sourceFact('resource_model_class_origin', [resourceName, binding.modelOrigin.name.value.value, sourceSpanKey(binding.source)])],
      () => [sourceFact('resource_model_table_origin', [resourceName, binding.modelOrigin.name.value.value, sourceSpanKey(binding.source)])],
    ),
  ));
  const conventionFacts = [sourceFact('resource_model_convention_key', [resourceName, ResourceNamingConvention.stripSuffix(resourceName), sourceSpanKey(input.subject.source)])];
  const relationFacts = relationExpand(input.relations, relation => [sourceFact('resource_model_resource_relation', [
    relation.parent.name.value.value,
    relation.child.name.value.value,
    relation.relation.value.value,
    sourceSpanKey(relation.source),
  ])]);
  const knownCandidateFacts = relationExpand(input.knownBindings, judgment => relationVariantFold(
    judgment.outcome,
    'resolved',
    rest => relationVariantFold(rest, 'ambiguous', () => [], ambiguous => ambiguous.candidates.map(candidate => sourceFact('resource_model_prior_selected_candidate', [
      ambiguous.subject.resource.name.value.value,
      candidate.model.identity.name.value.value,
    ]))),
    resolved => [sourceFact('resource_model_prior_selected_candidate', [resolved.subject.resource.name.value.value, resolved.candidate.model.identity.name.value.value])],
  ));
  const provenance = [
    { key: sourceSpanKey(input.subject.source), source: input.subject.source },
    ...relationExpand(input.controllerScan.controllers, controller => controller.resourceBindings.map(binding => ({ key: sourceSpanKey(binding.source), source: binding.source }))),
    ...input.relations.map(relation => ({ key: sourceSpanKey(relation.source), source: relation.source })),
  ];
  return Object.freeze({
    facts: Object.freeze([...modelIdentityFacts, ...controllerOriginFacts, ...conventionFacts, ...relationFacts, ...knownCandidateFacts]),
    provenance: Object.freeze(provenance),
  });
};

const candidateFor = (model: ModelDefinition, evidence: readonly ResourceModelBindingEvidence[]): ResourceModelBindingCandidate => {
  const first = relationOptionFold(relationFirstOption(evidence, () => true), () => { throw Error('A model-binding candidate must carry source evidence.'); }, item => item);
  const nonEmptyEvidence: readonly [ResourceModelBindingEvidence, ...ResourceModelBindingEvidence[]] = [first, ...relationSlice(evidence, 1)];
  return Object.freeze({ model, evidence: nonEmptyEvidence });
};

const deriveCandidateEvidence = (input: ResourceModelBindingJudgmentInput): readonly ResourceModelBindingCandidate[] => {
  const source = sourceEvidenceFacts(input);
  const derivation = semanticRewriteAuthority.resolveRelations({
    kind: 'semantic_relation_execution_request',
    seeds: source.facts,
    rules: RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET.rules,
  });
  if (!derivation.closed) {
    throw Error('Resource model-binding semantic derivation did not reach its declared least fixed point.');
  }
  const resourceName = input.subject.resource.name.value.value;
  const evidenceFacts = relationSelect(derivation.facts, fact => relationEqual(fact.relation, RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET.candidateEvidenceRelation)
    && relationEqual(fact.arguments[0], resourceName));
  const provenanceFacts = relationSelect(derivation.facts, fact => relationEqual(fact.relation, RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET.candidateProvenanceRelation)
    && relationEqual(fact.arguments[0], resourceName));
  const selectedCandidateFacts = relationSelect(derivation.facts, fact => relationEqual(fact.relation, RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET.selectedCandidateRelation)
    && relationEqual(fact.arguments[0], resourceName));
  const candidates = relationExpand(
    relationSelect(input.models, model => relationAny(selectedCandidateFacts.map(fact => relationEqual(fact.arguments[1], model.identity.name.value.value)))),
    model => {
      const evidence = relationExpand(evidenceFacts, fact => relationGate(
        relationEqual(fact.arguments[1], model.identity.name.value.value),
        () => relationExpand(
          relationSelect(provenanceFacts, provenance => relationAll([
            relationEqual(provenance.arguments[1], model.identity.name.value.value),
            relationEqual(provenance.arguments[2], fact.arguments[2]),
          ])),
          provenance => {
            const sourceKey = semanticStringAtom(provenance.arguments[3]);
            const sourceSpan = relationOptionFold(
              relationFirstOption(source.provenance, entry => relationEqual(entry.key, sourceKey)),
              () => { throw Error(`Missing source provenance for resource model evidence '${sourceKey}'.`); },
              entry => entry.source,
            );
            return [Object.freeze({
              kind: 'resource_model_binding_evidence',
              resource: input.subject.resource,
              model: { kind: 'model_reference', name: model.identity.name },
              source: sourceSpan,
              basis: evidenceBasisFromAtom(fact.arguments[2]),
            })];
          },
        ),
        () => [],
      ));
      const distinctEvidence = evidence.filter((item, index, items) => items.findIndex(existing => sameEvidence(existing, item)) === index);
      return relationGate(distinctEvidence.length > 0, () => [candidateFor(model, distinctEvidence)], () => []);
    },
  );
  return Object.freeze(candidates);
};

const closeCandidateCardinality = (candidates: readonly ResourceModelBindingCandidate[]): ResourceModelBindingCandidateCardinality => relationGate(
  relationEqual(candidates.length, 0),
  () => {
    const emptyCandidates: readonly [] = Object.freeze([]);
    return Object.freeze({ kind: 'no_candidate', candidates: emptyCandidates });
  },
  () => relationGate(
    relationEqual(candidates.length, 1),
    () => {
      const candidate = relationOptionFold(relationFirstOption(candidates, () => true), () => { throw Error('A singleton candidate partition must retain its candidate.'); }, value => value);
      const singleton: readonly [ResourceModelBindingCandidate] = Object.freeze([candidate]);
      return Object.freeze({ kind: 'one_candidate', candidates: singleton });
    },
    () => {
      const first = relationOptionFold(relationFirstOption(candidates, () => true), () => { throw Error('A multiple-candidate partition must retain a first candidate.'); }, value => value);
      const second = relationOptionFold(relationFirstOption(relationSlice(candidates, 1), () => true), () => { throw Error('A multiple-candidate partition must retain a second candidate.'); }, value => value);
      const rest: readonly [ResourceModelBindingCandidate, ResourceModelBindingCandidate, ...ResourceModelBindingCandidate[]] = [first, second, ...relationSlice(candidates, 2)];
      return Object.freeze({ kind: 'multiple_candidates', candidates: Object.freeze(rest) });
    },
  ),
);

const formResourceModelBindingOutcome = (input: ResourceModelBindingJudgmentInput, cardinality: ResourceModelBindingCandidateCardinality): ResourceModelBindingOutcome => {
  const related = relationSelect(input.relations, relation =>
    relationEqual(relation.parent.name.value.value, input.subject.resource.name.value.value)
    || relationEqual(relation.child.name.value.value, input.subject.resource.name.value.value),
  );
  return relationVariantFold(
    cardinality,
    'one_candidate',
    (remainder): ResourceModelBindingOutcome => relationVariantFold(
      remainder,
      'multiple_candidates',
      (_none): ResourceModelBindingOutcome => {
        const reason: Extract<ResourceModelBindingOutcome, { readonly kind: 'unresolved' }>['reason'] = relationGate(related.length > 0, () => 'relation_binding_unresolved', () => 'no_model_candidate');
        return { kind: 'unresolved', subject: input.subject, reason, evidence: sourceEvidence(input) };
      },
      (multiple): ResourceModelBindingOutcome => ({ kind: 'ambiguous', subject: input.subject, candidates: multiple.candidates }),
    ),
    (one): ResourceModelBindingOutcome => ({ kind: 'resolved', subject: input.subject, candidate: one.candidates[0] }),
  );
};

const judgeResourceModelBinding = (input: ResourceModelBindingJudgmentInput): ResourceModelBindingJudgment => {
  const cardinality = closeCandidateCardinality(deriveCandidateEvidence(input));
  const outcome = formResourceModelBindingOutcome(input, cardinality);
  return Object.freeze({ kind: 'resource_model_binding_judgment', outcome });
};

const sourceEvidence = (input: ResourceModelBindingJudgmentInput): readonly [ResourceModelBindingSourceEvidence, ...ResourceModelBindingSourceEvidence[]] => Object.freeze([Object.freeze({
  kind: 'resource_model_binding_source_evidence',
  resource: input.subject.resource,
  source: input.subject.source,
  basis: 'resource_declaration',
})]);

const batchInputFor = (input: ResourceModelBindingBatchJudgmentInput, subject: ResourceModelBindingBatchJudgmentInput['subjects'][number], knownBindings: readonly ResourceModelBindingJudgment[]): ResourceModelBindingJudgmentInput => ({
  kind: 'resource_model_binding_judgment_input',
  subject,
  models: input.models,
  controllerScan: input.controllerScan,
  relations: input.relations,
  knownBindings,
});

const sameSubject = (left: ResourceModelBindingJudgment['outcome']['subject'], right: ResourceModelBindingJudgment['outcome']['subject']): boolean => relationAll([
  relationEqual(left.resource.name.value.value, right.resource.name.value.value),
  sameSourceSpan(left.source, right.source),
]);

const sameEvidenceSet = (left: readonly ResourceModelBindingEvidence[], right: readonly ResourceModelBindingEvidence[]): boolean => relationGate(
  relationEqual(left.length, right.length),
  () => relationAll(left.map((evidence, index) => sameEvidence(evidence, right[index]))),
  () => false,
);

const sameCandidate = (left: ResourceModelBindingCandidate, right: ResourceModelBindingCandidate): boolean => relationAll([
  relationEqual(left.model.identity.name.value.value, right.model.identity.name.value.value),
  sameEvidenceSet(left.evidence, right.evidence),
]);

const sameCandidateSet = (left: readonly ResourceModelBindingCandidate[], right: readonly ResourceModelBindingCandidate[]): boolean => relationGate(
  relationEqual(left.length, right.length),
  () => relationAll(left.map((candidate, index) => sameCandidate(candidate, right[index]))),
  () => false,
);

const sameSourceEvidenceSet = (
  left: Extract<ResourceModelBindingOutcome, { readonly kind: 'unresolved' }>['evidence'],
  right: Extract<ResourceModelBindingOutcome, { readonly kind: 'unresolved' }>['evidence'],
): boolean => relationGate(
  relationEqual(left.length, right.length),
  () => relationAll(left.map((evidence, index) => relationAll([
    relationEqual(evidence.resource.name.value.value, right[index].resource.name.value.value),
    relationEqual(evidence.basis, right[index].basis),
    sameSourceSpan(evidence.source, right[index].source),
  ]))),
  () => false,
);

const sameOutcome = (left: ResourceModelBindingJudgment, right: ResourceModelBindingJudgment): boolean => relationVariantFold(
  left.outcome,
  'resolved',
  leftRest => relationVariantFold(
    leftRest,
    'ambiguous',
    leftUnresolved => relationVariantFold(
      right.outcome,
      'resolved',
      rightRest => relationVariantFold(
        rightRest,
        'ambiguous',
        rightUnresolved => relationAll([
          sameSubject(leftUnresolved.subject, rightUnresolved.subject),
          relationEqual(leftUnresolved.reason, rightUnresolved.reason),
          sameSourceEvidenceSet(leftUnresolved.evidence, rightUnresolved.evidence),
        ]),
        () => false,
      ),
      () => false,
    ),
    leftAmbiguous => relationVariantFold(
      right.outcome,
      'resolved',
      rightRest => relationVariantFold(
        rightRest,
        'ambiguous',
        () => false,
        rightAmbiguous => relationAll([
          sameSubject(leftAmbiguous.subject, rightAmbiguous.subject),
          sameCandidateSet(leftAmbiguous.candidates, rightAmbiguous.candidates),
        ]),
      ),
      () => false,
    ),
  ),
  leftResolved => relationVariantFold(
    right.outcome,
    'resolved',
    () => false,
    rightResolved => relationAll([
      sameSubject(leftResolved.subject, rightResolved.subject),
      sameCandidate(leftResolved.candidate, rightResolved.candidate),
    ]),
  ),
);

/** Executable realization of the upstream batch-state correspondence contract. */
const resourceModelBindingBatchStateSemantics: ResourceModelBindingBatchStateSemanticsInterface = Object.freeze({
  kind: 'resource_model_binding_batch_state_semantics',
  contractVersion: 1,
  identity: RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY,
  stateEquivalence: Object.freeze({
    subjectCoverage: 'same-exact-subject-object-set',
    judgment: 'same-closed-outcome-for-each-corresponding-subject',
    order: 'irrelevant-to-equivalence',
  }),
  judgmentForSubject: (subject: ResourceModelBindingSubject, judgments: readonly ResourceModelBindingJudgment[]) => judgments.find(
    judgment => judgment.outcome.subject === subject,
  ),
  sameState: (left: readonly ResourceModelBindingJudgment[], right: readonly ResourceModelBindingJudgment[]) => left.length === right.length && left.every(judgment => {
    const corresponding = resourceModelBindingBatchStateSemantics.judgmentForSubject(judgment.outcome.subject, right);
    return corresponding !== undefined && sameOutcome(judgment, corresponding);
  }),
});

const requireJudgmentForSubject = (
  subject: ResourceModelBindingSubject,
  judgments: readonly ResourceModelBindingJudgment[],
): ResourceModelBindingJudgment => resourceModelBindingBatchStateSemantics.judgmentForSubject(subject, judgments)
  ?? (() => { throw Error('A closed batch transition must retain every exact input subject.'); })();

const unresolvedCycleJudgment = (input: ResourceModelBindingBatchJudgmentInput, subject: ResourceModelBindingBatchJudgmentInput['subjects'][number]): ResourceModelBindingJudgment => {
  const singleInput = batchInputFor(input, subject, []);
  return Object.freeze({
    kind: 'resource_model_binding_judgment',
    outcome: {
      kind: 'unresolved',
      subject,
      reason: 'relation_binding_unresolved',
      evidence: sourceEvidence(singleInput),
    },
  });
};

const batchJudgment = (closure: ResourceModelBindingBatchClosure, judgments: readonly ResourceModelBindingJudgment[]): ResourceModelBindingBatchJudgment => {
  const rejectedSubjects = Object.freeze(judgments
    .filter(judgment => judgment.outcome.kind !== 'resolved')
    .map(judgment => judgment.outcome.subject));
  const completeness: ResourceModelBindingBatchCompleteness = relationGate(
    rejectedSubjects.length === 0,
    () => ({ kind: 'resource_model_binding_batch_complete' }),
    () => ({ kind: 'resource_model_binding_batch_blocked', rejectedSubjects }),
  );
  return Object.freeze({
    kind: 'resource_model_binding_batch_judgment',
    contractVersion: 3,
    closure,
    completeness,
    bindings: Object.freeze(judgments.map(judgment => Object.freeze({
      kind: 'resource_model_binding_subject_judgment' as const,
      subject: judgment.outcome.subject,
      judgment,
    }))),
  });
};

const closureReceipt = (resolution: ResourceModelBindingBatchClosure['resolution']): ResourceModelBindingBatchClosure => Object.freeze({
  kind: 'resource_model_binding_fixed_point_closure',
  closed: true,
  basis: 'whole-resource-model-candidate-lattice',
  resolution,
});

const judgeBatch = (input: ResourceModelBindingBatchJudgmentInput): ResourceModelBindingBatchJudgment => {
  const initial = input.subjects.map(subject => judgeResourceModelBinding(batchInputFor(input, subject, [])));
  const settle = (current: readonly ResourceModelBindingJudgment[], history: readonly (readonly ResourceModelBindingJudgment[])[]): ResourceModelBindingBatchJudgment => {
    const next = input.subjects.map(subject => judgeResourceModelBinding(batchInputFor(input, subject, current)));
    return relationGate(
      resourceModelBindingBatchStateSemantics.sameState(current, next),
      () => batchJudgment(closureReceipt({ kind: 'stable_fixed_point' }), Object.freeze(next)),
      () => {
        const repeatedIndex = history.findIndex(previous => resourceModelBindingBatchStateSemantics.sameState(previous, next));
        return relationGate(
          repeatedIndex >= 0,
          () => {
            const cycleStates = [...history.slice(repeatedIndex), next];
            const baseline = cycleStates[0];
            const affectedSubjects = input.subjects.filter(subject => {
              const baselineJudgment = resourceModelBindingBatchStateSemantics.judgmentForSubject(subject, baseline);
              return relationGate(
                baselineJudgment !== undefined,
                () => !cycleStates.every(state => {
                  const stateJudgment = resourceModelBindingBatchStateSemantics.judgmentForSubject(subject, state);
                  return stateJudgment !== undefined && sameOutcome(stateJudgment, baselineJudgment);
                }),
                () => { throw Error('A closed resource-binding state omitted an exact input subject.'); },
              );
            });
            const affectedResources = affectedSubjects.map(subject => subject.resource);
            const firstAffectedResource = relationOptionFold(
              relationFirstOption(affectedResources, () => true),
              () => { throw Error('A repeated fixed-point state must contain at least one changing resource.'); },
              resource => resource,
            );
            const affectedResourceTuple: readonly [typeof firstAffectedResource, ...typeof affectedResources[number][]] = [firstAffectedResource, ...relationSlice(affectedResources, 1)];
            const judgments = input.subjects.map(subject =>
              affectedSubjects.some(affected => affected === subject)
                ? unresolvedCycleJudgment(input, subject)
                : requireJudgmentForSubject(subject, next),
            );
            return batchJudgment(
              closureReceipt({ kind: 'cycle_conservative', affectedResources: affectedResourceTuple }),
              Object.freeze(judgments),
            );
          },
          () => settle(next, [...history, current]),
        );
      },
    );
  };
  return settle(initial, [initial]);
};

/**
 * Closed model-binding authority. It consumes source-correlated controller evidence
 * and canonical model definitions; it never reads a ResourceDefinition as its own answer.
 * Batch closure completes relation propagation before resource AST projection starts.
 */
export const resourceModelBindingAuthority: ResourceModelBindingJudgmentAuthority = Object.freeze({
  kind: 'resource_model_binding_judgment_authority',
  closed: true,
  contractVersion: 5,
  semanticModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL,
  closureModel: RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL,
  ruleSet: RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET,
  batchState: resourceModelBindingBatchStateSemantics,
  bindingForSubject: (batch: ResourceModelBindingBatchJudgment, subject: ResourceModelBindingSubject) => batch.bindings.find(binding => binding.subject === subject)
    ?? (() => { throw Error('Closed resource-binding authority omitted the exact source subject from its batch response.'); })(),
  judgmentCorrespondence: 'each_binding_retains_exact_input_subject_and_its_closed_judgment',
  closureCorrespondence: 'state-transition-and-cycle-impact-use-exact-subject-identity-not-array-index',
  judge: judgeResourceModelBinding,
  judgeBatch,
});
