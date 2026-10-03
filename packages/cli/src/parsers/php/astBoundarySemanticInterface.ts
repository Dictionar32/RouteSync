/**
 * Highest PHP parser boundary: grammar observation -> canonical AST judgment.
 *
 * The parser tree is evidence. The canonical AST ADT plus its derivation facts
 * are the semantic authority exposed to the rest of RouteSync.
 */
import type { PhpAstNode } from '@routesync/core';
import { relationOptionFold, relationVariant } from '@routesync/core';
import type { PhpGrammarNode } from './ast/grammar';

export type PhpAstBoundaryRelation =
    | 'grammar_observed'
    | 'ast_adapted'
    | 'source_preserved'
    | 'parser_gap';

export type PhpAstBoundaryFact = Readonly<{
    readonly kind: 'php_ast_boundary_fact';
    readonly relation: PhpAstBoundaryRelation;
    readonly value: string;
}>;

export type PhpAstBoundaryJudgment = Readonly<{
    readonly kind: 'php_ast_boundary_judgment';
    readonly grammarKind: PhpGrammarNode['kind'];
    readonly ast: PhpAstNode;
    readonly facts: readonly PhpAstBoundaryFact[];
    readonly closure: 'closed';
    readonly reasoning: 'typed_grammar_to_canonical_ast';
    readonly authority: 'php_ast_boundary_judgment';
    readonly closed: true;
}>;

export const phpAstBoundaryFact = (
    relation: PhpAstBoundaryRelation,
    value: string,
): PhpAstBoundaryFact => Object.freeze({
    kind: 'php_ast_boundary_fact',
    relation,
    value,
});

export const phpAstBoundaryJudgment = (
    grammar: PhpGrammarNode,
    ast: PhpAstNode,
    sourcePreserved: boolean,
): PhpAstBoundaryJudgment => Object.freeze({
    kind: 'php_ast_boundary_judgment',
    grammarKind: grammar.kind,
    ast,
    facts: Object.freeze([
        phpAstBoundaryFact('grammar_observed', grammar.kind),
        phpAstBoundaryFact('ast_adapted', ast.kind),
        phpAstBoundaryFact('source_preserved', String(sourcePreserved)),
        ...relationOptionFold(
            relationVariant(ast, 'unsupported'),
            () => [],
            value => [phpAstBoundaryFact('parser_gap', value.reason.kind)],
        ),
    ]),
    closure: 'closed',
    reasoning: 'typed_grammar_to_canonical_ast',
    authority: 'php_ast_boundary_judgment',
    closed: true,
});
