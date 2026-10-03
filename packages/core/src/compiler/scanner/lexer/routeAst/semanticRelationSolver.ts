import { project, retain, expand, accumulate, visit } from './semanticRelationalCollections';
import { compileSemanticRelationExecutionPlans, type SemanticRelationExecutionPlan, type SemanticRelationPlanStep } from './semanticRelationalExecutionPlan';
import { SemanticRelationStore } from './semanticRelationStore';
import { relationResolve, relationFirst, relationOptionMap, relationCatalogValueOr, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual, relationIsSome, relationIsNone, relationNone, relationSome, relationNotEqual, relationAll } from '../../../../semantic/kernel/semanticRelations';
import { relationEvery, relationSome as relationAny } from '../../../../semantic/kernel/relationalSequence';
import { relationContains, relationInsert, relationUnique, type RelationMembership } from '../../../../semantic/kernel/relationMembership';

/** Canonical semantic relation execution substrate. Absence is a relation witness. */
export interface SemanticNullAtom { readonly kind: 'semantic_null' }
export const semanticNullAtom: SemanticNullAtom = Object.freeze({ kind: 'semantic_null' });
export type SemanticRelationAtom = string | number | boolean | SemanticNullAtom;
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

type Bindings = Readonly<Record<string, SemanticRelationAtom>>;
type Match = RelationOption<Bindings>;
type FactIndex<R extends string> = SemanticRelationStore<R>;
type DeltaMatch<R extends string> = { readonly bindings: Bindings; readonly premises: readonly SemanticRelation<R>[] };
type VariableTerm = SemanticRelationVariable;

const isVariable = (value: SemanticRelationAtom | VariableTerm): value is VariableTerm => relationAll([Object.is(typeof value, 'object'), 'variable' in value]);
const lookupBinding = (bindings: Bindings, variable: string): RelationOption<SemanticRelationAtom> =>
    relationOptionMap(relationFirst(Object.entries(bindings), ([name]) => relationEqual(name, variable)), entry => entry[1]);

const bind = (bindings: Bindings, variable: string, value: SemanticRelationAtom): Match => {
    const existing = lookupBinding(bindings, variable);
    return relationResolve(
        relationIsSome(existing),
        () => relationResolve(relationEqual(existing.value, value), () => relationSome(bindings), () => relationNone()),
        () => relationSome(Object.freeze({ ...bindings, [variable]: value })),
    );
};

const matchTerms = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: Bindings, index = 0): Match =>
    relationResolve(
        index >= pattern.arguments.length,
        () => relationSome(bindings),
        () => {
            const term = pattern.arguments[index];
            const value = fact.arguments[index];
            return relationResolve(
                isVariable(term),
                () => {
                    const next = bind(bindings, term.variable, value);
                    return relationResolve(relationIsSome(next), () => matchTerms(fact, pattern, next.value, index + 1), () => relationNone());
                },
                () => relationResolve(relationEqual(term, value), () => matchTerms(fact, pattern, bindings, index + 1), () => relationNone()),
            );
        },
    );

const matchPattern = <R extends string>(fact: SemanticRelation<R>, pattern: SemanticRelationPattern<R>, bindings: Bindings): Match =>
    relationResolve(
        relationAll([relationEqual(fact.relation, pattern.relation), relationEqual(fact.arguments.length, pattern.arguments.length)]),
        () => matchTerms(fact, pattern, bindings),
        () => relationNone(),
    );

const relationKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;
const patternIndexKey = <R extends string>(pattern: SemanticRelationPattern<R>): string => `${pattern.relation}/${pattern.arguments.length}`;
const factIndexKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}/${fact.arguments.length}`;

const instantiate = <R extends string>(pattern: SemanticRelationPattern<R>, bindings: Bindings): RelationOption<SemanticRelation<R>> => {
    const resolved = project(pattern.arguments, term => relationResolve(isVariable(term), () => lookupBinding(bindings, term.variable), () => relationSome(term)));
    const values = project(resolved, option => relationResolve(relationIsSome(option), () => option.value, () => semanticNullAtom));
    const complete = relationEvery(resolved, relationIsSome);
    return relationResolve(
        relationAny([relationEqual(pattern.polarity, 'negative'), relationNotEqual(complete, true)]),
        () => relationNone(),
        () => relationSome(Object.freeze({ relation: pattern.relation, arguments: Object.freeze(values) })),
    );
};

const buildIndex = <R extends string>(facts: readonly SemanticRelation<R>[]): FactIndex<R> => SemanticRelationStore.from(facts);
const patternIsNegative = <R extends string>(pattern: SemanticRelationPattern<R>): boolean => relationEqual(pattern.polarity, 'negative');
const patternMatchesAnyFact = <R extends string>(index: FactIndex<R>, pattern: SemanticRelationPattern<R>, bindings: Bindings): boolean =>
    relationAny(index.bucket(pattern.relation, pattern.arguments.length), candidate => relationIsSome(matchPattern(candidate, pattern, bindings)));

const extendPositiveState = <R extends string>(index: FactIndex<R>, pattern: SemanticRelationPattern<R>, states: readonly DeltaMatch<R>[]): readonly DeltaMatch<R>[] => {
    const candidates = index.bucket(pattern.relation, pattern.arguments.length);
    return expand(states, state => expand(candidates, candidate => {
        const bindings = matchPattern(candidate, pattern, state.bindings);
        return relationResolve(relationIsSome(bindings), () => [{ bindings: bindings.value, premises: [...state.premises, candidate] }], () => []);
    }));
};

const applyPattern = <R extends string>(index: FactIndex<R>, anchor: SemanticRelationPattern<R>, states: readonly DeltaMatch<R>[], patterns: readonly SemanticRelationPattern<R>[], position = 0): readonly DeltaMatch<R>[] => {
    const pattern = relationFirst(patterns, (_entry, index) => relationEqual(index, position));
    return relationResolve(
        relationIsNone(pattern),
        () => states,
        () => relationResolve(
            relationEqual(pattern.value, anchor),
            () => applyPattern(index, anchor, states, patterns, position + 1),
            () => relationResolve(
                patternIsNegative(pattern.value),
                () => applyPattern(index, anchor, retain(states, state => relationNotEqual(patternMatchesAnyFact(index, pattern.value, state.bindings), true)), patterns, position + 1),
                () => applyPattern(index, anchor, extendPositiveState(index, pattern.value, states), patterns, position + 1),
            ),
        ),
    );
};

const enumerateAnchorMatches = <R extends string>(index: FactIndex<R>, anchor: SemanticRelationPattern<R>, patterns: readonly SemanticRelationPattern<R>[], delta: readonly SemanticRelation<R>[]): readonly DeltaMatch<R>[] =>
    expand(retain(delta, fact => relationEqual(factIndexKey(fact), patternIndexKey(anchor))), fact => {
        const bindings = matchPattern(fact, anchor, Object.freeze({}));
        return relationResolve(relationIsSome(bindings), () => applyPattern(index, anchor, [{ bindings: bindings.value, premises: [fact] }], patterns), () => []);
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
const advanceStrata = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[], strata: RelationStrata<R>): { readonly changed: boolean; readonly strata: RelationStrata<R> } =>
    accumulate(plans, (state, plan) => accumulate(headRelations(plan), (inner, head) => {
        const required = dependencyRequired(plan, state.strata);
        const current = relationCatalogValueOr(state.strata, head, 0);
        return relationResolve(required > current,
            () => ({ changed: true, strata: [...retain(state.strata, ([key]) => relationNotEqual(key, head)), [head, required] as const] }),
            () => ({ changed: inner.changed, strata: inner.strata }));
    }, { changed: false, strata }));
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
        const key = patternIndexKey(anchor.value.pattern);
        const bucket = relationCatalogValueOr(planIndex, key, []);
        const nextBucket = [...bucket, plan];
        return [...retain(planIndex, ([candidate]) => relationNotEqual(candidate, key)), [key, Object.freeze(nextBucket)] as const];
    }, () => planIndex);
};
const buildPlanIndex = <R extends string>(plans: readonly SemanticRelationExecutionPlan<R>[]): PlanIndex<R> => accumulate(plans, (index, plan) => addPlanIndex(index, plan), [] as PlanIndex<R>);
const collectApplicablePlans = <R extends string>(delta: readonly SemanticRelation<R>[], planIndex: PlanIndex<R>): readonly SemanticRelationExecutionPlan<R>[] => relationUnique(expand(delta, fact => relationCatalogValueOr(planIndex, factIndexKey(fact), [])));
const deriveFromPlan = <R extends string>(plan: SemanticRelationExecutionPlan<R>, matches: readonly DeltaMatch<R>[]): readonly SemanticRelationDerivation<R>[] => expand(matches, match => expand(plan.emissions, step => {
    const fact = instantiate(step.pattern, match.bindings);
    return relationResolve(relationIsSome(fact), () => [{ fact: fact.value, ruleId: plan.ruleId, premises: match.premises, bindings: match.bindings }], () => []);
}));
const deduplicateDerivations = <R extends string>(derivations: readonly SemanticRelationDerivation<R>[], seen: RelationMembership<string>): readonly SemanticRelationDerivation<R>[] => {
    const keys = relationUnique(project(derivations, derivation => relationKey(derivation.fact)));
    return project(keys, key => relationOptionFold(relationFirst(derivations, derivation => relationEqual(relationKey(derivation.fact), key)), () => { throw Error('Semantic derivation key disappeared.'); }, derivation => derivation));
};
const planPatterns = <R extends string>(plan: SemanticRelationExecutionPlan<R>, index = 0, output: readonly SemanticRelationPattern<R>[] = []): readonly SemanticRelationPattern<R>[] => {
    const step = relationFirst(plan.premises, (_entry, current) => relationEqual(current, index));
    return relationResolve(relationIsSome(step), () => planPatterns(plan, index + 1, [...output, step.value.pattern]), () => output);
};
const consumePlans = <R extends string>(ordered: readonly SemanticRelationExecutionPlan<R>[], applicable: readonly SemanticRelationExecutionPlan<R>[], index: FactIndex<R>, delta: readonly SemanticRelation<R>[]): readonly SemanticRelationDerivation<R>[] => expand(retain(ordered, plan => relationContains(applicable, plan)), plan => deriveFromPlan(plan, enumerateDeltaMatches(index, planPatterns(plan), delta)));

type PositiveState<R extends string> = { readonly facts: SemanticRelation<R>[]; readonly seen: RelationMembership<string>; readonly index: SemanticRelationStore<R>; readonly agenda: SemanticRelation<R>[]; readonly derivations: SemanticRelationDerivation<R>[]; readonly rounds: number };
const saturatePositive = <R extends string>(state: PositiveState<R>, ordered: readonly SemanticRelationExecutionPlan<R>[], planIndex: PlanIndex<R>, maxRounds: number): PositiveState<R> => relationResolve(relationAny([relationEqual(state.agenda.length, 0), state.rounds >= maxRounds]), () => state, () => {
    const delta = state.agenda.splice(0, state.agenda.length);
    const applicable = collectApplicablePlans(delta, planIndex);
    const derivations = deduplicateDerivations(consumePlans(ordered, applicable, state.index, delta), state.seen);
    visit(derivations, derivation => { state.facts.push(derivation.fact); state.agenda.push(derivation.fact); state.index.add(derivation.fact); });
    state.derivations.push(...derivations);
    return saturatePositive({ ...state, rounds: state.rounds + 1 }, ordered, planIndex, maxRounds);
});
const solvePositiveStratum = <R extends string>(seed: readonly SemanticRelation<R>[], plans: readonly SemanticRelationExecutionPlan<R>[], maxRounds: number): SemanticRelationSolveResult<R> => {
    const state: PositiveState<R> = { facts: [...seed], seen: relationUnique(project(seed, relationKey)), index: buildIndex(seed), agenda: [...seed], derivations: [], rounds: 0 };
    const settled = saturatePositive(state, plans, buildPlanIndex(plans), maxRounds);
    return Object.freeze({ facts: Object.freeze(settled.facts), derivations: Object.freeze(settled.derivations), rounds: settled.rounds, saturated: relationEqual(settled.agenda.length, 0) });
};
const solveStrata = <R extends string>(seed: readonly SemanticRelation<R>[], plans: readonly SemanticRelationExecutionPlan<R>[], strata: RelationStrata<R>, maxStratum: number, maxRounds: number, stratum = 0, facts: readonly SemanticRelation<R>[] = seed, derivations: readonly SemanticRelationDerivation<R>[] = [], totalRounds = 0, saturated = true): SemanticRelationSolveResult<R> => {
    const stratumPlans = retain(plans, plan => relationAny(headRelations(plan), relation => relationEqual(relationCatalogValueOr(strata, relation, 0), stratum)));
    const result = relationResolve(relationEqual(stratumPlans.length, 0), () => ({ facts, derivations: [], rounds: 0, saturated: true }), () => solvePositiveStratum(facts, stratumPlans, maxRounds));
    const next = stratum + 1;
    return relationResolve(next > maxStratum, () => Object.freeze({ facts: Object.freeze(result.facts), derivations: Object.freeze([...derivations, ...result.derivations]), rounds: totalRounds + result.rounds, saturated: relationAll([saturated, result.saturated]) }), () => solveStrata(seed, plans, strata, maxStratum, maxRounds, next, result.facts, [...derivations, ...result.derivations], totalRounds + result.rounds, relationAll([saturated, result.saturated])));
};
export const solveSemanticRelationsDetailed = <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly SemanticRelationRewrite<R>[], maxRounds = 1024): SemanticRelationSolveResult<R> => {
    const plans = compileSemanticRelationExecutionPlans(rules);
    const strata = ruleDependencies(plans);
    const maxStratum = Math.max(0, ...strata.values());
    return solveStrata(seed, plans, strata, maxStratum, maxRounds);
};
export const solveSemanticRelations = <R extends string>(seed: readonly SemanticRelation<R>[], rules: readonly SemanticRelationRewrite<R>[], maxRounds = 1024): readonly SemanticRelation<R>[] => solveSemanticRelationsDetailed(seed, rules, maxRounds).facts;