/**
 * Canonical semantic decision engine.
 *
 * Semantic authority is a relation of candidates and facts. Evaluation is
 * expressed through relation primitives; source-language control constructs
 * are never part of this layer's vocabulary.
 */
import { relationAll, relationFirstOption, relationOptionMap, type RelationOption } from './relationalSequence';

export type SemanticRequirement = Readonly<{ readonly id: string; readonly satisfied: boolean }>;
export type SemanticExclusion = Readonly<{ readonly id: string; readonly active: boolean }>;
export type SemanticDependency = Readonly<{ readonly id: string; readonly available: boolean }>;

export type DecisionCandidate<T> = Readonly<{
  readonly id: string;
  readonly value: T;
  readonly requirements: readonly SemanticRequirement[];
  readonly exclusions: readonly SemanticExclusion[];
  readonly dependencies: readonly SemanticDependency[];
}>;

export type DecisionWitness<T> = Readonly<{ readonly id: string; readonly value: T }>;

const sequenceBranch = <T>(done: boolean, terminal: () => T, recursive: () => T): T => [recursive, terminal][Number(done)]();

const requirementFacts = (values: readonly SemanticRequirement[], index = 0): readonly boolean[] =>
  sequenceBranch(index >= values.length, () => [], () => [values[index].satisfied, ...requirementFacts(values, index + 1)]);

const exclusionFacts = (values: readonly SemanticExclusion[], index = 0): readonly boolean[] =>
  sequenceBranch(index >= values.length, () => [], () => [!values[index].active, ...exclusionFacts(values, index + 1)]);

const dependencyFacts = (values: readonly SemanticDependency[], index = 0): readonly boolean[] =>
  sequenceBranch(index >= values.length, () => [], () => [values[index].available, ...dependencyFacts(values, index + 1)]);

export const candidateAdmissible = <T>(candidate: DecisionCandidate<T>): boolean =>
  relationAll([relationAll(requirementFacts(candidate.requirements)), relationAll(exclusionFacts(candidate.exclusions)), relationAll(dependencyFacts(candidate.dependencies))]);

export const solveDecision = <T>(candidates: readonly DecisionCandidate<T>[]): RelationOption<DecisionWitness<T>> =>
  relationOptionMap(
    relationFirstOption(candidates, candidateAdmissible),
    candidate => Object.freeze({ id: candidate.id, value: candidate.value }),
  );

export const requirement = (id: string, satisfied: boolean): SemanticRequirement => Object.freeze({ id, satisfied });
export const exclusion = (id: string, active: boolean): SemanticExclusion => Object.freeze({ id, active });
export const dependency = (id: string, available: boolean): SemanticDependency => Object.freeze({ id, available });

export const decisionCandidate = <T>(
  id: string,
  value: T,
  requirements: readonly SemanticRequirement[] = Object.freeze([]),
  exclusions: readonly SemanticExclusion[] = Object.freeze([]),
  dependencies: readonly SemanticDependency[] = Object.freeze([]),
): DecisionCandidate<T> => Object.freeze({ id, value, requirements, exclusions, dependencies });
