/** Elevates syntax-neutral semantic knowledge flow into the upstream semantic dataflow judgment. */
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowJudgment,
  SemanticDataflowDerivation,
  SemanticDataflowInput,
} from '../../types/upstream/semanticDataflowInterface';
import type { AstRuleName, AstWitnessName } from '../../types/upstream/ast';
import { stringValue } from '../../types/upstream/valueObjects';
import { relationEqual, relationResolve } from '../../semantic/foundation/semanticRelations';
import { relationFixedPoint, relationProject, relationExpand, relationFirstOption, relationOptionFold, relationVariantFold } from '../../semantic/foundation/relationalSequence';

const identityKey = (value: SemanticDataflowIdentity): string => JSON.stringify(value);
const factKey = (fact: SemanticDataflowFact): string => JSON.stringify(fact);

const uniqueFacts = (facts: readonly SemanticDataflowFact[], index = 0, output: readonly SemanticDataflowFact[] = []): readonly SemanticDataflowFact[] =>
  relationResolve(
    relationEqual(index, facts.length),
    () => Object.freeze(output),
    () => uniqueFacts(facts, index + 1, relationOptionFold(
      relationFirstOption(output, candidate => relationEqual(factKey(candidate), factKey(facts[index]))),
      () => Object.freeze([...output, facts[index]]),
      () => output,
    )),
  );

const reachesFrom = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowFact[] =>
  relationExpand(
    facts,
    fact => relationResolve(
      relationEqual(fact.kind, 'reaches'),
      () => [fact],
      () => [Object.freeze({ kind: 'reaches', source: fact.source, target: fact.target })],
    ),
  );

const transitiveReaches = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowFact[] =>
  relationExpand(
    facts,
    left => relationExpand(
      facts,
      right => relationResolve(
        relationAllEqual(left, right),
        () => [Object.freeze({ kind: 'reaches', source: left.source, target: right.target })],
        () => [],
      ),
    ),
  );

const ruleName = (value: string): AstRuleName => Object.freeze({ kind: 'ast_rule', value: stringValue(value) });
const witnessName = (value: string): AstWitnessName => Object.freeze({ kind: 'ast_witness', value: stringValue(value) });

const reachFact = (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity): SemanticDataflowFact =>
  Object.freeze({ kind: 'reaches', source, target });

const sameReach = (left: SemanticDataflowFact, right: SemanticDataflowFact): boolean =>
  relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(
    left,
    'reaches',
    () => false,
    leftReach => relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(
      right,
      'reaches',
      () => false,
      rightReach => relationEqual(identityKey(leftReach.source), identityKey(rightReach.source))
        && relationEqual(identityKey(leftReach.target), identityKey(rightReach.target)),
    ),
  );

const derivationKey = (derivation: SemanticDataflowDerivation): string => JSON.stringify({
  rule: derivation.rule,
  witness: derivation.witness,
  premises: derivation.premises,
  conclusion: derivation.conclusion,
});

const factIn = (facts: readonly SemanticDataflowFact[], candidate: SemanticDataflowFact): boolean =>
  facts.some(fact => relationEqual(factKey(fact), factKey(candidate)));

const derivationValid = (
  derivation: SemanticDataflowDerivation,
  closure: readonly SemanticDataflowFact[],
): boolean => factIn(closure, derivation.conclusion)
  && derivation.premises.every(premise => factIn(closure, premise))
  && relationResolve(
    relationEqual(derivation.rule.value.value, 'semantic-dataflow-reach-transitive'),
    () => derivation.premises.length === 2
      && derivation.premises.every(premise => premise.kind === 'reaches')
      && derivation.premises[0].kind === 'reaches'
      && derivation.premises[1].kind === 'reaches'
      && sameReach(
        reachFact(derivation.premises[0].source, derivation.premises[1].target),
        derivation.conclusion,
      )
      && relationEqual(
        identityKey(derivation.premises[0].target),
        identityKey(derivation.premises[1].source),
      ),
    () => true,
  );

export const validateSemanticDataflowDerivations = (
  closure: readonly SemanticDataflowFact[],
  derivations: readonly SemanticDataflowDerivation[],
): boolean => derivations.every(derivation => derivationValid(derivation, closure));

const derivationsFor = (facts: readonly SemanticDataflowFact[], closure: readonly SemanticDataflowFact[]): readonly SemanticDataflowDerivation[] => {
  const base: SemanticDataflowDerivation[] = facts.map(fact => Object.freeze({
    kind: 'semantic_dataflow_derivation' as const,
    rule: ruleName('semantic-dataflow-canonical-fact'),
    witness: witnessName(`canonical:${fact.kind}:${identityKey(fact.source)}:${identityKey(fact.target)}`),
    premises: Object.freeze([]),
    conclusion: fact,
  }));
  const reachSeeds: SemanticDataflowDerivation[] = facts
    .filter(fact => fact.kind !== 'reaches')
    .map(fact => Object.freeze({
      kind: 'semantic_dataflow_derivation' as const,
      rule: ruleName('semantic-dataflow-reach-seed'),
      witness: witnessName(`reach-seed:${fact.kind}:${identityKey(fact.source)}:${identityKey(fact.target)}`),
      premises: Object.freeze([fact]),
      conclusion: reachFact(fact.source, fact.target),
    }));
  const directReachKeys = new Set(reachSeeds.map(derivation => factKey(derivation.conclusion)));
  const transitive: SemanticDataflowDerivation[] = [];
  closure.filter(fact => fact.kind === 'reaches' && !directReachKeys.has(factKey(fact))).forEach(conclusion => {
    const left = closure.find(candidate => candidate.kind === 'reaches'
      && closure.some(right => right.kind === 'reaches'
        && relationEqual(identityKey(candidate.target), identityKey(right.source))
        && sameReach(reachFact(candidate.source, right.target), conclusion)));
    if (left === undefined || left.kind !== 'reaches') return;
    const right = closure.find(candidate => candidate.kind === 'reaches'
      && relationEqual(identityKey(left.target), identityKey(candidate.source))
      && sameReach(reachFact(left.source, candidate.target), conclusion));
    if (right === undefined || right.kind !== 'reaches') return;
    transitive.push(Object.freeze({
      kind: 'semantic_dataflow_derivation',
      rule: ruleName('semantic-dataflow-reach-transitive'),
      witness: witnessName(`reach-transitive:${identityKey(conclusion.source)}:${identityKey(conclusion.target)}`),
      premises: Object.freeze([left, right]),
      conclusion,
    }));
  });
  const derivations = [...base, ...reachSeeds, ...transitive];
  if (!validateSemanticDataflowDerivations(closure, derivations)) {
    throw new Error('semantic dataflow derivation invariant violated');
  }
  return Object.freeze(derivations.filter((derivation, index, all) =>
    all.findIndex(candidate => relationEqual(derivationKey(candidate), derivationKey(derivation))) === index));
};

const relationAllEqual = (left: SemanticDataflowFact, right: SemanticDataflowFact): boolean =>
  relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(
    left,
    'reaches',
    () => false,
    leftReach => relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(
      right,
      'reaches',
      () => false,
      rightReach => relationEqual(identityKey(leftReach.target), identityKey(rightReach.source)),
    ),
  );

export const createSemanticDataflowJudgment = (
  input: SemanticDataflowInput,
): SemanticDataflowJudgment => {
  const facts = Object.freeze(uniqueFacts(relationProject(input.facts, fact => fact)));
  const seed = Object.freeze(uniqueFacts([...facts, ...reachesFrom(facts)]));
  const fixed = relationFixedPoint(
    seed,
    current => Object.freeze(uniqueFacts([...current, ...transitiveReaches(current)])),
    (left, right) => relationEqual(JSON.stringify(relationProject(left, factKey)), JSON.stringify(relationProject(right, factKey))),
    128,
  );
  const closure = Object.freeze(fixed.value);
  const judgment: SemanticDataflowJudgment = Object.freeze({
    kind: 'semantic_dataflow_judgment',
    node: input.node,
    source: input.source,
    facts,
    closure,
    derivations: derivationsFor(facts, closure),
    fixedPoint: 'least_fixed_point',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    authority: 'semantic_dataflow_judgment',
    closed: true,
  });
  return judgment;
};
