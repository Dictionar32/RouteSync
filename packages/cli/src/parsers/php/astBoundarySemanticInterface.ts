/**
 * Highest PHP parser boundary: grammar observation -> canonical AST judgment.
 *
 * Parser grammar remains evidence. The boundary judgment owns domain operations
 * for continuing with a supported AST or an explicit parser-gap AST.
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

export interface PhpAstBoundaryJudgmentHandlers<Result> {
    readonly onAdapted: (judgment: PhpAstBoundaryJudgment) => Result;
    readonly onParserGap: (judgment: PhpAstBoundaryJudgment) => Result;
}

export interface PhpAstBoundaryJudgment {
    readonly kind: 'php_ast_boundary_judgment';
    readonly grammarKind: PhpGrammarNode['kind'];
    readonly ast: PhpAstNode;
    readonly facts: readonly PhpAstBoundaryFact[];
    readonly closure: 'closed';
    readonly authority: 'php_ast_boundary_judgment';
    readonly closed: true;
    readonly continueWith: <Result>(handlers: PhpAstBoundaryJudgmentHandlers<Result>) => Result;
}

export interface PhpAstBoundaryOperationsInterface {
    readonly fact: (relation: PhpAstBoundaryRelation, value: string) => PhpAstBoundaryFact;
    readonly judgment: (
        grammar: PhpGrammarNode,
        ast: PhpAstNode,
        sourcePreserved: boolean,
    ) => PhpAstBoundaryJudgment;
}

/** Interface-first runtime operations; no exported free-function constructors. */
export const phpAstBoundaryOperations: PhpAstBoundaryOperationsInterface = Object.freeze({
    fact: (relation: PhpAstBoundaryRelation, value: string): PhpAstBoundaryFact => Object.freeze({
        kind: 'php_ast_boundary_fact',
        relation,
        value,
    }),
    judgment: (
        grammar: PhpGrammarNode,
        ast: PhpAstNode,
        sourcePreserved: boolean,
    ): PhpAstBoundaryJudgment => {
        const judgment: PhpAstBoundaryJudgment = Object.freeze({
            kind: 'php_ast_boundary_judgment',
            grammarKind: grammar.kind,
            ast,
            facts: Object.freeze([
                phpAstBoundaryOperations.fact('grammar_observed', grammar.kind),
                phpAstBoundaryOperations.fact('ast_adapted', ast.kind),
                phpAstBoundaryOperations.fact('source_preserved', String(sourcePreserved)),
                ...relationOptionFold(
                    relationVariant(ast, 'unsupported'),
                    () => [],
                    value => [phpAstBoundaryOperations.fact('parser_gap', value.reason.kind)],
                ),
            ]),
            closure: 'closed',
            authority: 'php_ast_boundary_judgment',
            closed: true,
            continueWith: <Result>(handlers: PhpAstBoundaryJudgmentHandlers<Result>): Result =>
                ast.kind === 'unsupported'
                    ? handlers.onParserGap(judgment)
                    : handlers.onAdapted(judgment),
        });
        return judgment;
    },
});
