import { project, retain, expand, accumulate, visit } from './semanticRelationalCollections';
import { compileSemanticRelationExecutionPlans, type SemanticRelationExecutionPlan, type SemanticRelationPlanStep } from './semanticRelationalExecutionPlan';
import { relationResolve, relationFirst, relationOptionMap, relationOptionFold, relationCatalogValueOr, relationRefine, type RelationOption } from './relationalSequence';
import { relationAny, relationEqual, relationIsSome, relationIsNone, relationNone, relationSome, relationNotEqual } from './semanticRelations';
import { relationAll, relationEvery, relationAnyMatch } from './relationalSequence';
import { relationContains, relationInsert, relationUnique, type RelationMembership } from './relationMembership';

/** Canonical semantic relation execution substrate. Absence is a relation witness. */
import { semanticNullAtom, type RelationAtom, type SemanticRelationAtom } from './semanticRelationalAlgebra';
export type SemanticNullAtom = Extract<RelationAtom, { readonly kind: 'semantic_null' }>;
export { semanticNullAtom };
export type { SemanticRelationAtom } from './semanticRelationalAlgebra';
export interface SemanticRelation<R extends string = string> { readonly relation: R; readonly arguments: readonly SemanticRelationAtom[] }
export interface SemanticRelationVariable { readonly variable: string }
export type SemanticRelationPattern<R extends string = string> = Readonly<{
    readonly relation: R;
    readonly arguments: readonly (SemanticRelationAtom | SemanticRelationVariable)[];
    readonly polarity?: 'positive' | 'negative';
}>;
export interface SemanticRelationRewrite<R extends string = string> {
    readonly id: string;
    readonly priority: number;
    readonly when: readonly SemanticRelationPattern<R>[];
    readonly then: readonly SemanticRelationPattern<R>[];
}
export interface SemanticRelationRewriteResult<R extends string = string> { readonly ruleId: string; readonly bindings: Readonly<Record<string, SemanticRelationAtom>>; readonly produced: readonly SemanticRelation<R>[] }
export interface SemanticRelationDerivation<R extends string = string> { readonly fact: SemanticRelation<R>; readonly ruleId: string; readonly premises: readonly SemanticRelation<R>[]; readonly bindings: Readonly<Record<string, SemanticRelationAtom>> }
export interface SemanticRelationSolveResult<R extends string = string> { readonly facts: readonly SemanticRelation<R>[]; readonly derivations: readonly SemanticRelationDerivation<R>[]; readonly rounds: number; readonly saturated: boolean }

export type SemanticRelationBindings = Readonly<Record<string, SemanticRelationAtom>>;
type Match = RelationOption<SemanticRelationBindings>;
type FactIndex<R extends string> = Readonly<{ readonly facts: readonly SemanticRelation<R>[] }>;
type DeltaMatch<R extends string> = { readonly bindings: SemanticRelationBindings; readonly premises: readonly SemanticRelation<R>[] };
type VariableTerm = SemanticRelationVariable;

const isVariable = (value: SemanticRelationAtom | VariableTerm): value is VariableTerm => relationResolve(Object.is(typeof value, 'object'), () => Object.prototype.hasOwnProperty.call(value, 'variable'), () => false);
export const semanticRelationVariableOption = (term: SemanticRelationAtom | VariableTerm): RelationOption<VariableTerm> => relationRefine(term, isVariable);
export const semanticRelationAtomOption = (term: SemanticRelationAtom | VariableTerm): RelationOption<SemanticRelationAtom> => relationRefine(term, (candidate): candidate is SemanticRelationAtom => !isVariable(candidate));
const lookupBinding = (bindings: SemanticRelationBindings, variable: string): RelationOption<SemanticRelationAtom> =>
    relationOptionMap(relationFirst(Object.entries(bindings), ([name]) => relationEqual(name, variable)), entry => entry[1]);

const bind = (bindings: SemanticRelationBindings, variable: string, value: SemanticRelationAtom): Match => {
    const existing = lookupBinding(bindings, variable);
    return relationOptionFold(existing, () => relationSome(Object.freeze({ ...bindings, [variable]: value })), existingValue => relationResolve(relationEqual(existingValue, value), () => relationSome(bindings), () => relationNone()));
};

const matchTerms = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: SemanticRelationBindings, index = 0): Match =>
    relationResolve(
        index >= pattern.arguments.length,
        () => relationSome(bindings),
        () => {
            const term = pattern.arguments[index];
            const value = fact.arguments[index];
            return relationOptionFold<VariableTerm, Match, Match>(semanticRelationVariableOption(term), () => relationResolve(relationEqual(term, value), () => matchTerms(fact, pattern, bindings, index + 1), () => relationNone()), (variable: VariableTerm) => relationOptionFold(bind(bindings, variable.variable, value), () => relationNone(), (next: SemanticRelationBindings) => matchTerms(fact, pattern, next, index + 1)));
        },
    );

export const matchSemanticRelationPattern = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: SemanticRelationBindings): Match =>
    relationResolve(
        relationAll([relationEqual(fact.relation, pattern.relation), relationEqual(fact.arguments.length, pattern.arguments.length)]),
        () => matchTerms(fact, pattern, bindings),
        () => relationNone(),
    );

const relationKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;
const patternIndexKey = <R extends string>(pattern: SemanticRelationPattern<R>): string => `${pattern.relation}/${pattern.arguments.length}`;
const factIndexKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}/${fact.arguments.length}`;

export const instantiateSemanticRelationPattern = <R extends string>(pattern: SemanticRelationPattern<R>, bindings: SemanticRelationBindings): RelationOption<SemanticRelation<R>> => {
    const resolved = project(pattern.arguments, term => relationOptionFold(semanticRelationVariableOption(term), () => relationOptionFold(semanticRelationAtomOption(term), () => relationNone<SemanticRelationAtom>(), atom => relationSome(atom)), variable => lookupBinding(bindings, variable.variable)));
    const values = project(resolved, option => relationOptionFold(option, () => semanticNullAtom, value => value));
    const complete = relationEvery(resolved, option => relationIsSome(option));
    return relationResolve(
        relationAny([relationEqual(pattern.polarity, 'negative'), relationNotEqual(complete, true)]),
        () => relationNone(),
        () => relationSome(Object.freeze({ relation: pattern.relation, arguments: Object.freeze(values) })),
    );
};

const buildIndex = <R extends string>(facts: readonly SemanticRelation<R>[]): FactIndex<R> => Object.freeze({ facts: Object.freeze([...facts]) });
const patternIsNegative = <R extends string>(pattern: SemanticRelationPattern<R>): boolean => relationEqual(pattern.polarity, 'negative');
const patternMatchesAnyFact = <R extends string>(index: FactIndex<R>, pattern: SemanticRelationPattern<R>, bindings: SemanticRelationBindings): boolean =>
    relationAnyMatch(retain(index.facts, fact => relationAll([relationEqual(fact.relation, pattern.relation), relationEqual(fact.arguments.length, pattern.arguments.length)])), candidate => relationIsSome(matchSemanticRelationPattern(candidate, pattern, bindings)));

const extendPositiveState = <R extends string>(index: FactIndex<R>, pattern: SemanticRelationPattern<R>, states: readonly DeltaMatch<R>[]): readonly DeltaMatch<R>[] => {
    const candidates = retain(index.facts, fact => relationAll([relationEqual(fact.relation, pattern.relation), relationEqual(fact.arguments.length, pattern.arguments.length)]));
    return expand(states, state => expand(candidates, candidate => {
        const bindings = matchSemanticRelationPattern(candidate, pattern, state.bindings);
        return relationOptionFold(bindings, () => [], value => [{ bindings: value, premises: [...state.premises, candidate] }]);
    }));
};

const applyPattern = <R extends string>(index: FactIndex<R>, anchor: SemanticRelationPattern<R>, states: readonly DeltaMatch<R>[], patterns: readonly SemanticRelationPattern<R>[], position = 0): readonly DeltaMatch<R>[] => {
    const pattern = relationFirst(patterns, (_entry, index) => relationEqual(index, position));
    return relationOptionFold(pattern, () => states, candidate => relationResolve(
        relationEqual(candidate, anchor),
        () => applyPattern(index, anchor, states, patterns, position + 1),
        () => relationResolve(
            patternIsNegative(candidate),
            () => applyPattern(index, anchor, retain(states, state => relationNotEqual(patternMatchesAnyFact(index, candidate, state.bindings), true)), patterns, position + 1),
            () => applyPattern(index, anchor, extendPositiveState(index, candidate, states), patterns, position + 1),
        ),
    ));
};

const enumerateAnchorMatches = <R extends string>(index: FactIndex<R>, anchor: SemanticRelationPattern<R>, patterns: readonly SemanticRelationPattern<R>[], delta: readonly SemanticRelation<R>[]): readonly DeltaMatch<R>[] =>
    expand(retain(delta, fact => relationEqual(factIndexKey(fact), patternIndexKey(anchor))), fact => {
        const bindings = matchSemanticRelationPattern(fact, anchor, Object.freeze({}));
        return relationOptionFold(bindings, () => [], value => applyPattern(index, anchor, [{ bindings: value, premises: [fact] }], patterns));
    });

const uniqueMatches = <R extends string>(matches: readonly DeltaMatch<R>[]): readonly DeltaMatch<R>[] => {
    let seen: RelationMembership<string> = [];
    return project(retain(matches, match => {
        const premiseKeys = [...project(match.premises, relationKey)].sort().join('|');
        const bindingKey = project([...Object.entries(match.bindings)].sort(([a], [b]) => a.localeCompare(b)), ([name, value]) => `${name}=${JSON.stringify(value)}`).join('|');
        const key = `${premiseKeys}::${bindingKey}`;
        return relationResolve(relationContains(seen, key), () => false, () => { seen = relationInsert(seen, key); return true; });
    }), match => ({ ...match, premises: Object.freeze([...match.premises]) }));
};

const enumerateDeltaMatches = <R extends string>(index: FactIndex<R>, patterns: readonly SemanticRelationPattern<R>[], delta: readonly SemanticRelation<R>[]): readonly DeltaMatch<R>[] => {
    const positivePatterns = retain(patterns, pattern => relationNotEqual(patternIsNegative(pattern), true));
    return uniqueMatches(expand(positivePatterns, anchor => enumerateAnchorMatches(index, anchor, patterns, delta)));
};

export const applySemanticRelationRewrites = <R extends string>(facts: readonly SemanticRelation<R>[], rules: readonly SemanticRelationRewrite<R>[]): readonly SemanticRelation<R>[] => {
    const result = solveSemanticRelationsDetailed(facts, rules, 1);
    const seeds = relationUnique(project(facts, relationKey));
    return Object.freeze(retain(result.facts, fact => relationNotEqual(relationContains(seeds, relationKey(fact)), true)));
};

const headRelations = <R extends string>(plan: SemanticRelationExecutionPlan<R>): readonly R[] => Object.freeze(relationUnique(project(plan.emissions, step => step.relation)));
type RelationStrata<R extends string> = readonly (readonly [R, number])[];
type PlanIndex<R extends string> = readonly (readonly [string, readonly SemanticRelationExecutionPlan<R>[]])[];
const dependencyRequired = <R extends string>(plan: SemanticRelationExecutionPlan<R>, strata: RelationStrata<R>): number => {
    const positiveMax = Math.max(0, ...project(retain(plan.premises, step => relationNotEqual(step.polarity, 'negative')), step => relationCatalogValueOr(strata, step.relation, 0)));
    const negativeMax = Math.max(-1, ...project(retain(plan.premises, step => relationEqual(step.polarity, 'negative')), step => relationCatalogValueOr(strata, step.relation, 0)));
    return Math.max(positiveMax, negativeMax + 1);
};
const seedStrata = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[]): RelationStrata<R> =>
    relationUnique(project(expand(plans, headRelations), relation => [relation, 0] as const));
const advanceStrata = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[], strata: RelationStrata<R>): { readonly changed: boolean; readonly strata: RelationStrata<R> } => {
    const initialState: { readonly changed: boolean; readonly strata: RelationStrata<R> } = { changed: false, strata };
    return accumulate(plans, (state, plan) => accumulate(headRelations(plan), (inner: { readonly changed: boolean; readonly strata: RelationStrata<R> }, head: R) => {
        const required = dependencyRequired(plan, inner.strata);
        const current = relationCatalogValueOr(inner.strata, head, 0);
        return relationResolve(required > current,
            () => ({ changed: true, strata: [...retain(inner.strata, ([key]) => relationNotEqual(key, head)), [head, required] as const] }),
            () => inner);
    }, state), initialState);
};
const settleStrata = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[], strata: RelationStrata<R>, rounds: number, limit: number): RelationStrata<R> => {
    const state = advanceStrata(plans, strata);
    return relationResolve(!state.changed, () => state.strata, () => relationResolve(rounds >= limit,
        () => { throw Error('Semantic relation program contains a non-stratified negative dependency cycle.'); },
        () => settleStrata(plans, state.strata, rounds + 1, limit)));
};
const ruleDependencies = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[]): RelationStrata<R> => settleStrata(plans, seedStrata(plans), 0, plans.length * Math.max(1, plans.length) + 1);
const addPlanIndex = <R extends string>(planIndex: PlanIndex<R>, plan: SemanticRelationExecutionPlan<R>): PlanIndex<R> => {
    const anchor = relationFirst(plan.premises, step => relationEqual(step.kind, 'scan'));
    return relationResolve(relationIsSome(anchor), () => {
        const key = relationOptionFold(anchor, () => '', value => patternIndexKey(value.pattern));
        const bucket = relationCatalogValueOr(planIndex, key, []);
        const nextBucket = [...bucket, plan];
        return [...retain(planIndex, ([candidate]) => relationNotEqual(candidate, key)), [key, Object.freeze(nextBucket)] as const];
    }, () => planIndex);
};
const buildPlanIndex = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[]): PlanIndex<R> => accumulate(plans, (index, plan) => addPlanIndex(index, plan), [] as PlanIndex<R>);
const collectApplicablePlans = <R extends string>(delta: readonly SemanticRelation<R>[], planIndex: PlanIndex<R>): readonly SemanticRelationExecutionPlan<R>[] => relationUnique(expand(delta, fact => relationCatalogValueOr(planIndex, factIndexKey(fact), [])));
const deriveFromPlan = <R extends string>(plan: SemanticRelationExecutionPlan<R>, matches: readonly DeltaMatch<R>[]): readonly SemanticRelationDerivation<R>[] => expand(matches, match => expand(plan.emissions, step => {
    const fact = instantiateSemanticRelationPattern(step.pattern, match.bindings);
    return relationOptionFold(fact, () => [], value => [{ fact: value, ruleId: plan.ruleId, premises: match.premises, bindings: match.bindings }]);
}));
const deduplicateDerivations = <R extends string>(derivations: readonly SemanticRelationDerivation<R>[], seen: RelationMembership<string>): readonly SemanticRelationDerivation<R>[] => {
    const keys = relationUnique(project(derivations, derivation => relationKey(derivation.fact)));
    return project(keys, key => relationOptionFold(relationFirst(derivations, derivation => relationEqual(relationKey(derivation.fact), key)), () => { throw Error('Semantic derivation key disappeared.'); }, derivation => derivation));
};
const planPatterns = <R extends string>(plan: SemanticRelationExecutionPlan<R>, index = 0, output: readonly SemanticRelationPattern<R>[] = []): readonly SemanticRelationPattern<R>[] => {
    const step = relationFirst(plan.premises, (_entry, current) => relationEqual(current, index));
    return relationOptionFold(step, () => output, value => planPatterns(plan, index + 1, [...output, value.pattern]));
};
const consumePlans = <R extends string>(ordered: readonly SemanticRelationExecutionPlan<R>[], applicable: readonly SemanticRelationExecutionPlan<R>[], index: FactIndex<R>, delta: readonly SemanticRelation<R>[]): readonly SemanticRelationDerivation<R>[] => expand(retain(ordered, plan => relationContains(applicable, plan)), plan => deriveFromPlan(plan, enumerateDeltaMatches(index, planPatterns(plan), delta)));

type PositiveState<R extends string> = { readonly facts: SemanticRelation<R>[]; readonly seen: RelationMembership<string>; readonly index: FactIndex<R>; readonly agenda: SemanticRelation<R>[]; readonly derivations: SemanticRelationDerivation<R>[]; readonly rounds: number };
const saturatePositive = <R extends string>(state: PositiveState<R>, ordered: readonly SemanticRelationExecutionPlan<R>[], planIndex: PlanIndex<R>, maxRounds: number): PositiveState<R> => relationResolve(relationAny([relationEqual(state.agenda.length, 0), state.rounds >= maxRounds]), () => state, () => {
    const delta = Object.freeze([...state.agenda]);
    const applicable = collectApplicablePlans(delta, planIndex);
    const derivations = deduplicateDerivations(consumePlans(ordered, applicable, state.index, delta), state.seen);
    const nextFacts = Object.freeze([...state.facts, ...project(derivations, derivation => derivation.fact)]);
    const nextAgenda = Object.freeze(project(derivations, derivation => derivation.fact));
    const nextIndex = buildIndex(nextFacts);
    const nextDerivations = Object.freeze([...state.derivations, ...derivations]);
    return saturatePositive({ facts: nextFacts as SemanticRelation<R>[], seen: state.seen, index: nextIndex, agenda: nextAgenda as SemanticRelation<R>[], derivations: nextDerivations as SemanticRelationDerivation<R>[], rounds: state.rounds + 1 }, ordered, planIndex, maxRounds);
});
const solvePositiveStratum = <R extends string>(seed: readonly SemanticRelation<R>[], plans: readonly SemanticRelationExecutionPlan<R>[], maxRounds: number): SemanticRelationSolveResult<R> => {
    const state: PositiveState<R> = { facts: [...seed], seen: relationUnique(project(seed, relationKey)), index: buildIndex(seed), agenda: [...seed], derivations: [], rounds: 0 };
    const settled = saturatePositive(state, plans, buildPlanIndex(plans), maxRounds);
    return Object.freeze({ facts: Object.freeze(settled.facts), derivations: Object.freeze(settled.derivations), rounds: settled.rounds, saturated: relationEqual(settled.agenda.length, 0) });
};
const solveStrata = <R extends string>(seed: readonly SemanticRelation<R>[], plans: readonly SemanticRelationExecutionPlan<R>[], strata: RelationStrata<R>, maxStratum: number, maxRounds: number, stratum = 0, facts: readonly SemanticRelation<R>[] = seed, derivations: readonly SemanticRelationDerivation<R>[] = [], totalRounds = 0, saturated = true): SemanticRelationSolveResult<R> => {
    const stratumPlans = retain(plans, plan => relationAnyMatch(headRelations(plan), relation => relationEqual(relationCatalogValueOr(strata, relation, 0), stratum)));
    const result = relationResolve(relationEqual(stratumPlans.length, 0), () => ({ facts, derivations: [], rounds: 0, saturated: true }), () => solvePositiveStratum(facts, stratumPlans, maxRounds));
    const next = stratum + 1;
    return relationResolve(next > maxStratum, () => Object.freeze({ facts: Object.freeze(result.facts), derivations: Object.freeze([...derivations, ...result.derivations]), rounds: totalRounds + result.rounds, saturated: relationAll([saturated, result.saturated]) }), () => solveStrata(seed, plans, strata, maxStratum, maxRounds, next, result.facts, [...derivations, ...result.derivations], totalRounds + result.rounds, relationAll([saturated, result.saturated])));
};
export const solveSemanticRelationsDetailed = <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly SemanticRelationRewrite<R>[], maxRounds = 1024): SemanticRelationSolveResult<R> => {
    const plans = compileSemanticRelationExecutionPlans(rules);
    const strata = ruleDependencies(plans);
    const maxStratum = Math.max(0, ...project(strata, ([, value]) => value));
    return solveStrata(seed, plans, strata, maxStratum, maxRounds);
};
export const solveSemanticRelations = <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly SemanticRelationRewrite<R>[], maxRounds = 1024): readonly SemanticRelation<R>[] => solveSemanticRelationsDetailed(seed, rules, maxRounds).facts;