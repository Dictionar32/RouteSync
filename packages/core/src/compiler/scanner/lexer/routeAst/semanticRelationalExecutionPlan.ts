import { relationResolve, relationFirstOption, relationOptionFold, relationProject, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationEqual } from '../../../../semantic/kernel/semanticRelations';
/**
 * Phase 297 — executable relational IR.
 *
 * Rewrite declarations are compiled into a closed relational plan before the
 * solver runs. The solver consumes this plan rather than interpreting the
 * rewrite declaration itself. The plan is therefore the execution authority.
 */
import type { SemanticRelationPattern, SemanticRelationRewrite, } from './semanticRelationSolver';

export type SemanticRelationPlanSort = 'entity' | 'predicate' | 'value' | 'effect' | 'resource' | 'state' | 'relation-target';
export interface SemanticRelationPlanSchema<R extends string = string> {
    readonly relation: R;
    readonly arity: number;
    readonly sorts: readonly SemanticRelationPlanSort[];
    readonly indexes: readonly number[];
}
export type SemanticRelationPlanStep<R extends string = string> = Readonly<{
    readonly kind: 'scan' | 'join' | 'anti-join' | 'emit';
    readonly relation: R;
    readonly arity: number;
    readonly polarity: 'positive' | 'negative';
    readonly variables: readonly string[];
    readonly pattern: SemanticRelationPattern<R>;
    readonly schema: SemanticRelationPlanSchema<R>;
    readonly joinKeys: readonly number[];
}>;
export interface SemanticRelationExecutionPlan<R extends string = string> {
    readonly ruleId: string;
    readonly priority: number;
    readonly anchor: RelationOption<SemanticRelationPattern<R>>;
    readonly premises: readonly SemanticRelationPlanStep<R>[];
    readonly emissions: readonly SemanticRelationPlanStep<R>[];
}
const variablesOf = <R extends string>(pattern: SemanticRelationPattern<R>): readonly string[] => {
    const collect = (index: number, output: readonly string[]): readonly string[] => relationResolve(
        index >= pattern.arguments.length,
        () => output,
        () => {
            const term = pattern.arguments[index];
            const isObjectTerm = relationEqual(Object.prototype.toString.call(term), '[object Object]');
            const variable = relationResolve(
                isObjectTerm,
                () => relationResolve('variable' in (term as object), () => (term as SemanticRelationPattern<R>['arguments'][number] & { readonly variable: string }).variable, () => ''),
                () => '',
            );
            return relationResolve(relationEqual(variable.length, 0), () => collect(index + 1, output), () => collect(index + 1, [...output, variable]));
        },
    );
    return Object.freeze(collect(0, []));
};
const inferSort = (index: number): SemanticRelationPlanSort => relationResolve(relationEqual(index, 0), () => 'entity', () => 'value');
const schemaFor = <R extends string>(pattern: SemanticRelationPattern<R>): SemanticRelationPlanSchema<R> => Object.freeze({
    relation: pattern.relation,
    arity: pattern.arguments.length,
    sorts: relationProject(pattern.arguments, (_term, index) => inferSort(index)),
    indexes: relationProject(pattern.arguments, (_term, index) => index),
});
const joinKeysOf = <R extends string>(pattern: SemanticRelationPattern<R>): readonly number[] => relationProject(pattern.arguments, (_term, index) => index);
const polarityOf = <R extends string>(pattern: SemanticRelationPattern<R>): 'positive' | 'negative' => relationResolve(
    relationEqual(pattern.polarity, 'negative'),
    () => 'negative',
    () => 'positive',
);
const stepFor = <R extends string>(kind: SemanticRelationPlanStep<R>['kind'], pattern: SemanticRelationPattern<R>): SemanticRelationPlanStep<R> => Object.freeze({
    kind,
    relation: pattern.relation,
    arity: pattern.arguments.length,
    polarity: polarityOf(pattern),
    variables: variablesOf(pattern),
    pattern,
    schema: schemaFor(pattern),
    joinKeys: joinKeysOf(pattern),
});
const positive = <R extends string>(pattern: SemanticRelationPattern<R>): boolean => relationResolve(relationEqual(polarityOf(pattern), 'negative'), () => false, () => true);
const chooseAnchor = <R extends string>(patterns: readonly SemanticRelationPattern<R>[]): RelationOption<SemanticRelationPattern<R>> => relationFirstOption(patterns, positive);
const withoutAnchor = <R extends string>(patterns: readonly SemanticRelationPattern<R>[], anchor: RelationOption<SemanticRelationPattern<R>>, index = 0, output: readonly SemanticRelationPattern<R>[] = []): readonly SemanticRelationPattern<R>[] => {
    const pattern = patterns[index];
    return relationResolve(index >= patterns.length, () => output, () => relationResolve(relationOptionFold(anchor, () => false, value => relationEqual(value, pattern)), () => withoutAnchor(patterns, anchor, index + 1, output), () => withoutAnchor(patterns, anchor, index + 1, [...output, pattern])));
};
const compilePremises = <R extends string>(anchor: RelationOption<SemanticRelationPattern<R>>, patterns: readonly SemanticRelationPattern<R>[]): readonly SemanticRelationPlanStep<R>[] => {
    const ordered = relationOptionFold(anchor, () => patterns, value => [value, ...withoutAnchor(patterns, anchor)]);
    const compileAt = (index: number, output: readonly SemanticRelationPlanStep<R>[]): readonly SemanticRelationPlanStep<R>[] => {
        const pattern = ordered[index];
        return relationResolve(index >= ordered.length, () => output, () => {
            const firstPositive = relationAll([relationEqual(index, 0), !relationEqual(pattern.polarity, 'negative')]);
            const kind = relationResolve(firstPositive, () => 'scan' as const, () => relationResolve(relationEqual(pattern.polarity, 'negative'), () => 'anti-join' as const, () => 'join' as const));
            return compileAt(index + 1, [...output, stepFor(kind, pattern)]);
        });
    };
    return Object.freeze(compileAt(0, []));
};
const compileEmissions = <R extends string>(patterns: readonly SemanticRelationPattern<R>[]): readonly SemanticRelationPlanStep<R>[] => {
    const compileAt = (index: number, output: readonly SemanticRelationPlanStep<R>[]): readonly SemanticRelationPlanStep<R>[] =>
        relationResolve(index >= patterns.length, () => output, () => compileAt(index + 1, [...output, stepFor('emit', patterns[index])]));
    return Object.freeze(compileAt(0, []));
};
export const compileSemanticRelationExecutionPlan = <R extends string>(rule: SemanticRelationRewrite<R>): SemanticRelationExecutionPlan<R> => {
    const anchor = chooseAnchor(rule.when);
    return Object.freeze({
        ruleId: rule.id,
        priority: rule.priority,
        anchor,
        premises: compilePremises(anchor, rule.when),
        emissions: compileEmissions(rule.then),
    });
};
export const compileSemanticRelationExecutionPlans = <R extends string>(rules: readonly SemanticRelationRewrite<R>[]): readonly SemanticRelationExecutionPlan<R>[] => {
    const compileAt = (index: number, output: readonly SemanticRelationExecutionPlan<R>[]): readonly SemanticRelationExecutionPlan<R>[] =>
        relationResolve(index >= rules.length, () => output, () => compileAt(index + 1, [...output, compileSemanticRelationExecutionPlan(rules[index])]));
    return Object.freeze([...compileAt(0, [])].sort((left, right) => right.priority - left.priority));
};
