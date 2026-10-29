/**
 * Phase 671 — closed Route Syntax Semantic Interface.
 *
 * Route syntax is exposed as a contract/judgment/proof boundary. Consumers
 * do not inspect cursor state to decide semantic meaning; they consume this
 * interface and its closed fact algebra. Laravel spellings remain evidence,
 * while semantic decisions are represented as relations.
 */
import type { LaravelRouteMethod } from './routeDeclarationAst';
import type { TokenCursor } from './relationalSyntaxCursor';
import {
    routeSyntaxSemanticJudgmentFactory,
    type RouteSyntaxSemanticFact,
    type RouteSyntaxSemanticJudgment,
    type RouteSyntaxSemanticRelation,
} from './semanticRouteSyntaxRelations';
import { relationProject, relationUnique } from '../../../../semantic/relations/relationalSequence';

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

const ROUTE_SYNTAX_RELATIONS: readonly RouteSyntaxSemanticRelation[] = Object.freeze([
        'syntax_observes_path',
        'syntax_observes_constraint',
        'syntax_observes_target',
        'syntax_observes_invocation',
]);

const CONTRACT: RouteSyntaxSemanticContract = Object.freeze({
    kind: 'route_syntax_semantic_contract',
    source: 'laravel_route_syntax',
    authority: 'route_syntax_semantic_judgment',
    relations: ROUTE_SYNTAX_RELATIONS,
    closure: 'least_fixed_point',
    rewriteEngine: 'semantic_rewrite_engine',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    closed: true,
});

const proofRelation = (fact: RouteSyntaxSemanticFact): RouteSyntaxSemanticRelation => fact.continueForProofRelation({
    routePath: () => 'syntax_observes_path',
    routeConstraint: () => 'syntax_observes_constraint',
    routeTarget: () => 'syntax_observes_target',
    routeInvocation: () => 'syntax_observes_invocation',
});

const proofs = (facts: readonly RouteSyntaxSemanticFact[]): readonly RouteSyntaxSemanticProof[] => Object.freeze(
    relationUnique(relationProject(facts, fact => Object.freeze({
        kind: 'route_syntax_semantic_proof',
        relation: proofRelation(fact),
        status: 'discharged',
        witness: 'route_syntax_judgment',
    }))),
);

export interface RouteSyntaxSemanticInterfaceFactoryInterface {
    readonly create: (judgment: RouteSyntaxSemanticJudgment) => RouteSyntaxSemanticInterface;
    readonly createAt: (cursor: TokenCursor, method: LaravelRouteMethod) => RouteSyntaxSemanticInterface;
    readonly contract: () => RouteSyntaxSemanticContract;
}

const createRouteSyntaxSemanticInterface = (judgment: RouteSyntaxSemanticJudgment): RouteSyntaxSemanticInterface => Object.freeze({
    kind: 'route_syntax_semantic_interface',
    contract: CONTRACT,
    judgment,
    facts: Object.freeze(judgment.facts),
    proofs: proofs(judgment.facts),
    closed: true,
});

export const routeSyntaxSemanticInterfaceFactory: RouteSyntaxSemanticInterfaceFactoryInterface = Object.freeze({
    create: createRouteSyntaxSemanticInterface,
    createAt: (cursor, method) => createRouteSyntaxSemanticInterface(routeSyntaxSemanticJudgmentFactory.create(cursor, method)),
    contract: () => CONTRACT,
});
