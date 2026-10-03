import { project, retain, expand, accumulate } from './semanticRelationalCollections';
import { relationResolve, relationFirst, relationOptionMap, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual, relationIsSome, relationNone, relationSome } from '../../../../semantic/kernel/semanticRelations';
import type { SemanticRelation, SemanticRelationAtom, SemanticRelationPattern, SemanticRelationVariable } from './semanticRelationSolver';
export type { SemanticRelation } from './semanticRelationSolver';

/** Relation-level rewrite engine. Rewriting is monotone saturation over facts. */
export interface SemanticRewrite<R extends string = string> {
    readonly id: string;
    readonly priority: number;
    readonly when: readonly SemanticRelationPattern<R>[];
    readonly replace: readonly SemanticRelationPattern<R>[];
}
export interface SemanticRewriteResult<R extends string = string> {
    readonly facts: readonly SemanticRelation<R>[];
    readonly appliedRules: readonly string[];
    readonly rounds: number;
    readonly saturated: boolean;
}

type Bindings = Readonly<Record<string, SemanticRelationAtom>>;
const isVariable = (term: SemanticRelationAtom | SemanticRelationVariable): term is SemanticRelationVariable => relationAll([relationEqual(typeof term, 'object'), Object.prototype.hasOwnProperty.call(term, 'variable')]);
const lookup = (bindings: Bindings, variable: string): RelationOption<SemanticRelationAtom> => relationOptionMap(relationFirst(Object.entries(bindings), ([name]) => relationEqual(name, variable)), entry => entry[1]);
const key = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;

const matchTerms = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: Bindings, index = 0): RelationOption<Bindings> => relationResolve(
    index >= pattern.arguments.length,
    () => relationSome(bindings),
    () => {
        const term = pattern.arguments[index];
        const value = fact.arguments[index];
        return relationResolve(isVariable(term),
            () => {
                const previous = lookup(bindings, term.variable);
                return relationResolve(relationIsSome(previous),
                    () => relationResolve(relationEqual(previous.value, value), () => matchTerms(fact, pattern, bindings, index + 1), () => relationNone()),
                    () => matchTerms(fact, pattern, Object.freeze({ ...bindings, [term.variable]: value }), index + 1));
            },
            () => relationResolve(relationEqual(term, value), () => matchTerms(fact, pattern, bindings, index + 1), () => relationNone()),
        );
    },
);

const match = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: Bindings): RelationOption<Bindings> => relationResolve(
    relationAny([relationEqual(pattern.polarity, 'negative'), !relationEqual(fact.relation, pattern.relation), !relationEqual(fact.arguments.length, pattern.arguments.length)]),
    () => relationNone(),
    () => matchTerms(fact, pattern, bindings),
);

const instantiate = <R extends string>(pattern: SemanticRelationPattern<R>, bindings: Bindings): RelationOption<SemanticRelation<R>> => {
    const options = project(pattern.arguments, term => relationResolve(isVariable(term), () => lookup(bindings, term.variable), () => relationSome(term)));
    return relationResolve(
        relationAny([relationEqual(pattern.polarity, 'negative'), relationAny(project(options, option => !relationIsSome(option)))]),
        () => relationNone(),
        () => relationSome(Object.freeze({ relation: pattern.relation, arguments: Object.freeze(project(options, option => option.value)) })),
    );
};

const bindingsForPattern = <R extends string>(facts: readonly SemanticRelation<R>[], pattern: SemanticRelationPattern<R>, states: readonly Bindings[]): readonly Bindings[] => expand(states, state => expand(retain(facts, fact => relationAll([relationEqual(fact.relation, pattern.relation), relationEqual(fact.arguments.length, pattern.arguments.length)])), fact => {
    const next = match(fact, pattern, state);
    return relationResolve(relationIsSome(next), () => [next.value], () => []);
}));
const bindingsForRule = <R extends string>(facts: readonly SemanticRelation<R>[], patterns: readonly SemanticRelationPattern<R>[]): readonly Bindings[] => accumulate(retain(patterns, pattern => !relationEqual(pattern.polarity, 'negative')), (states, pattern) => bindingsForPattern(facts, pattern, states), [Object.freeze({})]);
const replacements = <R extends string>(rule: SemanticRewrite<R>, bindings: Bindings): readonly SemanticRelation<R>[] => expand(rule.replace, pattern => {
    const fact = instantiate(pattern, bindings);
    return relationResolve(relationIsSome(fact), () => [fact.value], () => []);
});

export const rewriteSemanticRelations = <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly SemanticRewrite<R>[], maxRounds = 128): SemanticRewriteResult<R> => {
    const ordered = [...rules].sort((a, b) => b.priority - a.priority);
    const settle = (facts: readonly SemanticRelation<R>[], appliedRules: readonly string[], rounds: number): SemanticRewriteResult<R> => {
        const existing = relationUnique(project(facts, key));
        const produced = expand(ordered, rule => expand(bindingsForRule(facts, rule.when), bindings => project(retain(replacements(rule, bindings), fact => relationEqual(relationContains(existing, key(fact)), false)), fact => ({ fact, ruleId: rule.id }))));
        const unique = retain(produced, (item, index, all) => relationEqual(all.findIndex(candidate => relationEqual(key(candidate.fact), key(item.fact))), index));
        const nextFacts = [...facts, ...project(unique, item => item.fact)];
        const nextRules = [...appliedRules, ...project(unique, item => item.ruleId)];
        const saturated = relationEqual(unique.length, 0);
        return relationResolve(relationAny([saturated, rounds >= maxRounds]), () => Object.freeze({ facts: Object.freeze(nextFacts), appliedRules: Object.freeze(nextRules), rounds: rounds + 1, saturated }), () => settle(nextFacts, nextRules, rounds + 1));
    };
    return settle(seed, [], 0);
};