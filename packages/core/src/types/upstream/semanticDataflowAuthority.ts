/**
 * Canonical upstream authority for semantic dataflow.
 *
 * Scanner/AST code supplies only typed seed facts. Guarded flow, reachability,
 * derivations, and path closure are semantic dataflow meaning and therefore
 * belong to this upstream authority rather than a compiler-local analyzer.
 */
import { stringValue } from './valueObjects';
import { relationEqual, relationResolve } from '../../semantic/foundation/semanticRelations';
import { relationFixedPoint, relationProject, relationSelect, relationExpand, relationFirstOption, relationOptionFold, relationVariantFold, relationAt, relationAnyMatch, relationIndexOf } from '../../semantic/foundation/relationalSequence';
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
} from './semanticDataflow';
import { semanticDataflowIdentityKey } from './semanticDataflow';
import { semanticReasoningContract } from './semanticReasoning';

const identityKey = (value: SemanticDataflowIdentity): string => JSON.stringify(semanticDataflowIdentityKey(value));
const factKey = (fact: SemanticDataflowFact): string => JSON.stringify(
  fact.kind === 'reaches'
    ? fact
    : fact.kind === 'dependency'
      ? { kind: fact.kind, source: semanticDataflowIdentityKey(fact.source), target: semanticDataflowIdentityKey(fact.target), role: fact.role, guard: fact.guard }
      : { kind: fact.kind, source: semanticDataflowIdentityKey(fact.source), target: semanticDataflowIdentityKey(fact.target), role: fact.role, guard: fact.guard },
);
const uniqueFacts = (facts: readonly SemanticDataflowFact[], index = 0, output: readonly SemanticDataflowFact[] = []): readonly SemanticDataflowFact[] =>
  relationResolve(relationEqual(index, facts.length), () => Object.freeze(output), () => relationOptionFold(
    relationAt(facts, index),
    () => output,
    fact => uniqueFacts(facts, index + 1, relationOptionFold(
      relationFirstOption(output, candidate => relationEqual(factKey(candidate), factKey(fact))),
      () => Object.freeze([...output, fact]),
      () => output,
    )),
  ));

const reachFact = (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity): SemanticDataflowFact =>
  Object.freeze({ kind: 'reaches', source, target });

const reachClosure = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowFact[] => {
  const reachSeeds = relationProject(
    relationSelect(facts, fact => fact.kind !== 'reaches'),
    fact => reachFact(fact.source, fact.target),
  );
  const seed = Object.freeze(uniqueFacts([ ...facts, ...reachSeeds ]));
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
  steps: relationProject(path.steps, factKey),
  guards: path.guards,
});

const appendGuard = (guards: readonly SemanticDataflowGuard[], fact: SemanticDataflowFact): readonly SemanticDataflowGuard[] =>
  fact.kind === 'reaches' || fact.guard === undefined ? guards : [...guards, fact.guard];

const pathClosure = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowPath[] => {
  const seeds = relationProject(
    relationSelect(facts, fact => fact.kind !== 'reaches'),
    fact => Object.freeze({
      source: fact.source,
      target: fact.target,
      steps: Object.freeze([fact]),
      guards: Object.freeze(appendGuard([], fact)),
    }),
  );
  const outgoing = (source: SemanticDataflowIdentity): readonly SemanticDataflowFact[] => relationSelect(
    facts,
    fact => fact.kind !== 'reaches' && relationEqual(identityKey(fact.source), identityKey(source)),
  );
  const expand = (paths: readonly SemanticDataflowPath[]): readonly SemanticDataflowPath[] => relationExpand(
    paths,
    path => relationProject(outgoing(path.target), next => Object.freeze({
      source: path.source,
      target: next.target,
      steps: Object.freeze([...path.steps, next]),
      guards: Object.freeze(appendGuard(path.guards, next)),
    })),
  );
  const close = (paths: readonly SemanticDataflowPath[], frontier: readonly SemanticDataflowPath[], iteration: number): readonly SemanticDataflowPath[] =>
    relationResolve(
      relationAny([relationEqual(iteration, 128), relationEqual(frontier.length, 0)]),
      () => paths,
      () => {
        const expanded = relationProject(expand(frontier), path => Object.freeze({
          ...path,
          steps: Object.freeze(relationSelect(path.steps, (step): step is Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }> => step.kind !== 'reaches')),
        }));
        const fresh = relationSelect(expanded, candidate => !relationAnyMatch(paths, existing => relationEqual(pathKey(existing), pathKey(candidate))));
        return relationResolve(
          relationEqual(fresh.length, 0),
          () => paths,
          () => close(Object.freeze([...paths, ...fresh]), fresh, iteration + 1),
        );
      },
    );
  return Object.freeze(close(seeds, seeds, 0));
};

const ruleName = (value: string): SemanticDataflowRuleName => Object.freeze({ kind: 'semantic_dataflow_rule', value: stringValue(value) });
const witnessName = (value: string): SemanticDataflowWitnessName => Object.freeze({ kind: 'semantic_dataflow_witness', value: stringValue(value) });
const derivationKey = (derivation: SemanticDataflowDerivation): string => JSON.stringify(derivation);

const factIn = (facts: readonly SemanticDataflowFact[], candidate: SemanticDataflowFact): boolean => facts.some(fact => relationEqual(factKey(fact), factKey(candidate)));
const sameReach = (left: SemanticDataflowFact, right: SemanticDataflowFact): boolean =>
  relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(left, 'reaches', () => false, l =>
    relationVariantFold<SemanticDataflowFact, 'reaches', boolean>(right, 'reaches', () => false, r =>
      relationEqual(identityKey(l.source), identityKey(r.source)) && relationEqual(identityKey(l.target), identityKey(r.target))));

const derivationsFor = (facts: readonly SemanticDataflowFact[], closure: readonly SemanticDataflowFact[]): readonly SemanticDataflowDerivation[] => {
  const base = relationProject(
    facts,
    fact => Object.freeze({
      kind: 'semantic_dataflow_derivation' as const,
      rule: ruleName('semantic-dataflow-canonical-fact'),
      witness: witnessName(`canonical:${factKey(fact)}`),
      premises: Object.freeze([]),
      conclusion: fact,
    }),
  );
  const reachSeeds = relationProject(
    relationSelect(facts, fact => fact.kind !== 'reaches'),
    fact => Object.freeze({
      kind: 'semantic_dataflow_derivation' as const,
      rule: ruleName('semantic-dataflow-reach-seed'),
      witness: witnessName(`reach-seed:${factKey(fact)}`),
      premises: Object.freeze([fact]),
      conclusion: reachFact(fact.source, fact.target),
    }),
  );

  const findReach = (
    source: SemanticDataflowIdentity,
    target: SemanticDataflowIdentity,
  ): SemanticDataflowFact | undefined => {
    const option = relationFirstOption(
      closure,
      candidate => candidate.kind === 'reaches'
        && relationEqual(identityKey(candidate.source), identityKey(source))
        && relationEqual(identityKey(candidate.target), identityKey(target)),
    );
    return relationOptionFold(option, () => undefined, value => value);
  };

  const appendTransitive = (
    candidates: readonly SemanticDataflowFact[],
    index = 0,
    output: readonly SemanticDataflowDerivation[] = [],
  ): readonly SemanticDataflowDerivation[] => relationResolve(
    relationEqual(index, candidates.length),
    () => output,
    () => {
      const conclusion = candidates[index];
      if (conclusion.kind !== 'reaches' || relationAnyMatch(reachSeeds, seed => factKey(seed.conclusion) === factKey(conclusion))) {
        return appendTransitive(candidates, index + 1, output);
      }
      const leftOption = relationFirstOption(
        closure,
        candidate => candidate.kind === 'reaches'
          && relationEqual(identityKey(candidate.target), identityKey(conclusion.source)),
      );
      const left = relationOptionFold(leftOption, () => undefined, value => value);
      if (left === undefined || left.kind !== 'reaches') {
        return appendTransitive(candidates, index + 1, output);
      }
      const right = findReach(left.target, conclusion.target);
      if (right === undefined || right.kind !== 'reaches') {
        return appendTransitive(candidates, index + 1, output);
      }
      const witness = Object.freeze({
        kind: 'semantic_dataflow_derivation' as const,
        rule: ruleName('semantic-dataflow-reach-transitive'),
        witness: witnessName(`reach-transitive:${identityKey(conclusion.source)}:${identityKey(conclusion.target)}`),
        premises: Object.freeze([left, right]),
        conclusion,
      });
      return appendTransitive(candidates, index + 1, [...output, witness]);
    },
  );

  const transitive = appendTransitive(closure);
  return Object.freeze(
    relationSelect(
      [...base, ...reachSeeds, ...transitive],
      (derivation, index, all) => relationEqual(
        index,
        relationIndexOf(all, candidate => relationEqual(derivationKey(candidate), derivationKey(derivation))),
      ),
    ),
  );
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
    paths, fixedPoint: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', reasoningContract: semanticReasoningContract('declarative_relation_rewrite_fixed_point'), authority: 'semantic_dataflow_judgment', closed: true,
  });
};


