/**
 * Phase 671 — closed Route Syntax Semantic Interface.
 *
 * Route syntax is exposed as a contract/judgment/proof boundary. Consumers
 * do not inspect cursor state to decide semantic meaning; they consume this
 * interface and its closed fact algebra. Laravel spellings remain evidence,
 * while semantic decisions are represented as relations.
 */
import type { LaravelRouteMethod } from './routeDeclarationAst';
import type { TokenCursor } from '../../../../semantic/kernel/syntax/relationalSyntaxCursor';
import {
    routeSyntaxSemanticJudgment,
    type RouteSyntaxSemanticFact,
    type RouteSyntaxSemanticJudgment,
} from './semanticRouteSyntaxRelations';
import { relationEqual, relationResolve } from '../../../../semantic/kernel/semanticRelations';
import { relationOptionFold, relationProject, relationUnique } from '../../../../semantic/kernel/relationalSequence';

export type RouteSyntaxSemanticRelation =
    | 'syntax_observes_path'
    | 'syntax_observes_constraint'
    | 'syntax_observes_target'
    | 'syntax_observes_invocation';

export type RouteSyntaxSemanticProof = Readonly<{
    readonly kind: 'route_syntax_semantic_proof';
    readonly relation: RouteSyntaxSemanticRelation;
    readonly status: 'obligation' | 'discharged';
    readonly witness: 'route_syntax_judgment';
}>;

export type RouteSyntaxSemanticContract = Readonly<{
    readonly kind: 'route_syntax_semantic_contract';
    readonly source: 'laravel_route_syntax';
    readonly authority: 'route_syntax_semantic_judgment';
    readonly relations: readonly RouteSyntaxSemanticRelation[];
    readonly closure: 'least_fixed_point';
    readonly rewriteEngine: 'semantic_rewrite_engine';
    readonly reasoning: 'declarative_relation_rewrite_fixed_point';
    readonly closed: true;
}>;

export type RouteSyntaxSemanticInterface = Readonly<{
    readonly kind: 'route_syntax_semantic_interface';
    readonly contract: RouteSyntaxSemanticContract;
    readonly judgment: RouteSyntaxSemanticJudgment;
    readonly facts: readonly RouteSyntaxSemanticFact[];
    readonly proofs: readonly RouteSyntaxSemanticProof[];
    readonly closed: true;
}>;

const CONTRACT: RouteSyntaxSemanticContract = Object.freeze({
    kind: 'route_syntax_semantic_contract',
    source: 'laravel_route_syntax',
    authority: 'route_syntax_semantic_judgment',
    relations: Object.freeze([
        'syntax_observes_path',
        'syntax_observes_constraint',
        'syntax_observes_target',
        'syntax_observes_invocation',
    ]),
    closure: 'least_fixed_point',
    rewriteEngine: 'semantic_rewrite_engine',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    closed: true,
});

const proofRelation = (fact: RouteSyntaxSemanticFact): RouteSyntaxSemanticRelation => {
    const relation = relationProject([
        ['route_path', 'syntax_observes_path'],
        ['route_constraint', 'syntax_observes_constraint'],
        ['route_target', 'syntax_observes_target'],
        ['route_invocation', 'syntax_observes_invocation'],
    ] as const, ([kind, value]) => relationResolve(relationEqual(fact.kind, kind), () => value, () => 'syntax_observes_invocation'));
    return relationOptionFold(relationProject(relation, value => value), () => 'syntax_observes_invocation', value => value);
};

const proofs = (facts: readonly RouteSyntaxSemanticFact[]): readonly RouteSyntaxSemanticProof[] => Object.freeze(
    relationUnique(relationProject(facts, fact => Object.freeze({
        kind: 'route_syntax_semantic_proof',
        relation: proofRelation(fact),
        status: 'discharged',
        witness: 'route_syntax_judgment',
    }))),
);

export const routeSyntaxSemanticInterface = (judgment: RouteSyntaxSemanticJudgment): RouteSyntaxSemanticInterface => Object.freeze({
    kind: 'route_syntax_semantic_interface',
    contract: CONTRACT,
    judgment,
    facts: Object.freeze(judgment.facts),
    proofs: proofs(judgment.facts),
    closed: true,
});

export const routeSyntaxSemanticInterfaceAt = (
    cursor: TokenCursor,
    method: LaravelRouteMethod,
): RouteSyntaxSemanticInterface => routeSyntaxSemanticInterface(routeSyntaxSemanticJudgment(cursor, method));

export const routeSyntaxSemanticContract = (): RouteSyntaxSemanticContract => CONTRACT;
