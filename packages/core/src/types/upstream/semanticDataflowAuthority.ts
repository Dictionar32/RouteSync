/**
 * Canonical upstream authority for semantic dataflow.
 *
 * Scanner/AST code supplies only typed seed facts. Guarded flow, reachability,
 * derivations, and path closure are semantic dataflow meaning and therefore
 * belong to this upstream authority rather than a compiler-local analyzer.
 */
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';
import { stringValue } from './valueObjects';
import { relationEqual, relationResolve } from '../../semantic/foundation/semanticRelations';
import { relationFixedPoint, relationProject, relationExpand, relationFirstOption, relationOptionFold, relationVariantFold } from '../../semantic/foundation/relationalSequence';
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowJudgment,
  SemanticDataflowDerivation,
  SemanticDataflowRuleName,
  SemanticDataflowWitnessName,
  SemanticDataflowInput,
  SemanticDataflowGuard,
  SemanticDataflowPath,
  SemanticDataflowOrigin,
} from './semanticDataflow';
import { semanticDataflowIdentityKey } from './semanticDataflow';

const identityKey = (value: SemanticDataflowIdentity): string => JSON.stringify(semanticDataflowIdentityKey(value));
const factKey = (fact: SemanticDataflowFact): string => JSON.stringify(
  fact.kind === 'reaches'
    ? fact
    : fact.kind === 'dependency'
      ? { kind: fact.kind, source: semanticDataflowIdentityKey(fact.source), target: semanticDataflowIdentityKey(fact.target), role: fact.role, guard: fact.guard }
      : { kind: fact.kind, source: semanticDataflowIdentityKey(fact.source), target: semanticDataflowIdentityKey(fact.target), role: fact.role, guard: fact.guard },
);
const uniqueFacts = (facts: readonly SemanticDataflowFact[], index = 0, output: readonly SemanticDataflowFact[] = []): readonly SemanticDataflowFact[] =>
  relationResolve(relationEqual(index, facts.length), () => Object.freeze(output), () => uniqueFacts(facts, index + 1, relationOptionFold(
    relationFirstOption(output, candidate => relationEqual(factKey(candidate), factKey(facts[index]))),
    () => Object.freeze([...output, facts[index]]),
    () => output,
  )));

const reachFact = (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity): SemanticDataflowFact =>
  Object.freeze({ kind: 'reaches', source, target });

const reachClosure = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowFact[] => {
  const seed = Object.freeze(uniqueFacts([
    ...facts,
    ...facts.filter(fact => fact.kind !== 'reaches').map(fact => reachFact(fact.source, fact.target)),
  ]));
  const fixed = relationFixedPoint(
    seed,
    current => Object.freeze(uniqueFacts([
      ...current,
      ...relationExpand(current, left => relationExpand(current, right =>
        left.kind === 'reaches' && right.kind === 'reaches'
          && relationEqual(identityKey(left.target), identityKey(right.source))
          ? [reachFact(left.source, right.target)]
          : [],
      )),
    ])),
    (left, right) => relationEqual(JSON.stringify(relationProject(left, factKey)), JSON.stringify(relationProject(right, factKey))),
    128,
  );
  return Object.freeze(fixed.value);
};

const pathKey = (path: SemanticDataflowPath): string => JSON.stringify({
  source: identityKey(path.source),
  target: identityKey(path.target),
  steps: path.steps.map(factKey),
  guards: path.guards,
});

const appendGuard = (guards: readonly SemanticDataflowGuard[], fact: SemanticDataflowFact): readonly SemanticDataflowGuard[] =>
  fact.kind === 'reaches' || fact.guard === undefined ? guards : [...guards, fact.guard];

const pathClosure = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowPath[] => {
  const seeds = facts.filter(fact => fact.kind !== 'reaches').map(fact => Object.freeze({
    source: fact.source,
    target: fact.target,
    steps: Object.freeze([fact]),
    guards: Object.freeze(appendGuard([], fact)),
  }));
  const outgoing = (source: SemanticDataflowIdentity): readonly SemanticDataflowFact[] => facts.filter(fact =>
    fact.kind !== 'reaches' && relationEqual(identityKey(fact.source), identityKey(source)));
  const expand = (paths: readonly SemanticDataflowPath[]): readonly SemanticDataflowPath[] => paths.flatMap(path => outgoing(path.target).map(next => Object.freeze({
    source: path.source,
    target: next.target,
    steps: Object.freeze([...path.steps, next]),
    guards: Object.freeze(appendGuard(path.guards, next)),
  })));
  let paths = [...seeds];
  let frontier = [...seeds];
  for (let iteration = 0; iteration < 128 && frontier.length > 0; iteration += 1) {
    const expanded = expand(frontier).map(path => Object.freeze({ ...path, steps: Object.freeze(path.steps.filter((step): step is Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }> => step.kind !== 'reaches')) }));
    const fresh = expanded.filter(candidate => !paths.some(existing => relationEqual(pathKey(existing), pathKey(candidate))));
    if (fresh.length === 0) break;
    paths = [...paths, ...fresh];
    frontier = fresh;
  }
  return Object.freeze(paths);
};

const ruleName = (value: string): SemanticDataflowRuleName => Object.freeze({ kind: 'semantic_dataflow_rule', value: stringValue(value) });
const witnessName = (value: string): SemanticDataflowWitnessName => Object.freeze({ kind: 'semantic_dataflow_witness', value: stringValue(value) });
const derivationKey = (derivation: SemanticDataflowDerivation): string => JSON.stringify(derivation);
const flowFacts = (judgment: SemanticDataflowJudgment): readonly Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }>[] =>
  judgment.facts.filter((fact): fact is Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }> => fact.kind !== 'reaches');

const factIn = (facts: readonly SemanticDataflowFact[], candidate: SemanticDataflowFact): boolean => facts.some(fact => relationEqual(factKey(fact), factKey(candidate)));
const sameReach = (left: SemanticDataflowFact, right: SemanticDataflowFact): boolean =>
  relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(left, 'reaches', () => false, l =>
    relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(right, 'reaches', () => false, r =>
      relationEqual(identityKey(l.source), identityKey(r.source)) && relationEqual(identityKey(l.target), identityKey(r.target))));

const derivationsFor = (facts: readonly SemanticDataflowFact[], closure: readonly SemanticDataflowFact[]): readonly SemanticDataflowDerivation[] => {
  const base = facts.map(fact => Object.freeze({ kind: 'semantic_dataflow_derivation' as const, rule: ruleName('semantic-dataflow-canonical-fact'), witness: witnessName(`canonical:${factKey(fact)}`), premises: Object.freeze([]), conclusion: fact }));
  const reachSeeds = facts.filter(fact => fact.kind !== 'reaches').map(fact => Object.freeze({ kind: 'semantic_dataflow_derivation' as const, rule: ruleName('semantic-dataflow-reach-seed'), witness: witnessName(`reach-seed:${factKey(fact)}`), premises: Object.freeze([fact]), conclusion: reachFact(fact.source, fact.target) }));
  const transitive: SemanticDataflowDerivation[] = [];
  closure.filter(fact => fact.kind === 'reaches' && !reachSeeds.some(seed => factKey(seed.conclusion) === factKey(fact))).forEach(conclusion => {
    if (conclusion.kind !== 'reaches') return;
    const left = closure.find(candidate => candidate.kind === 'reaches' && closure.some(right => right.kind === 'reaches' && relationEqual(identityKey(candidate.target), identityKey(right.source)) && sameReach(reachFact(candidate.source, right.target), conclusion)));
    if (left === undefined || left.kind !== 'reaches') return;
    const right = closure.find(candidate => candidate.kind === 'reaches' && relationEqual(identityKey(left.target), identityKey(candidate.source)) && sameReach(reachFact(left.source, candidate.target), conclusion));
    if (right === undefined || right.kind !== 'reaches') return;
    transitive.push(Object.freeze({ kind: 'semantic_dataflow_derivation', rule: ruleName('semantic-dataflow-reach-transitive'), witness: witnessName(`reach-transitive:${identityKey(conclusion.source)}:${identityKey(conclusion.target)}`), premises: Object.freeze([left, right]), conclusion }));
  });
  return Object.freeze([...base, ...reachSeeds, ...transitive].filter((derivation, index, all) => all.findIndex(candidate => relationEqual(derivationKey(candidate), derivationKey(derivation))) === index));
};

export const validateSemanticDataflowDerivations = (closure: readonly SemanticDataflowFact[], derivations: readonly SemanticDataflowDerivation[]): boolean =>
  derivations.every(derivation => factIn(closure, derivation.conclusion) && derivation.premises.every(premise => factIn(closure, premise)));

export const createSemanticDataflowJudgment = (input: SemanticDataflowInput): SemanticDataflowJudgment => {
  const facts = Object.freeze(uniqueFacts(relationProject(input.facts, fact => fact)));
  const closure = reachClosure(facts);
  const paths = pathClosure(facts);
  const derivations = derivationsFor(facts, closure);
  if (!validateSemanticDataflowDerivations(closure, derivations)) throw new Error('semantic dataflow derivation invariant violated');
  return Object.freeze({
    kind: 'semantic_dataflow_judgment', node: input.node, source: input.source, facts, closure, derivations, origin: input.origin,
    paths, fixedPoint: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', authority: 'semantic_dataflow_judgment', closed: true,
  });
};


