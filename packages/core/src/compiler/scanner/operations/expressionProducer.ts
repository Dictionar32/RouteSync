import type { ExpressionAst } from '../../../types/upstream/ast';
import type { ExpressionFromPhpAstOperationInterface, ExpressionProducerInput, ExpressionProducerInterface } from '../../../types/upstream/expressionProducerInterface';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import { expressionAstFromPhpAst } from './expressionAstCanonical';
import { phpAstExpressionSemanticAuthority } from '../lexer/routeAst/phpAstExpressionSemanticAuthority';

/**
 * Source → ExpressionAst producer boundary.
 *
 * The input contains only source syntax plus provenance. The producer owns the
 * syntax-to-semantic Expression mapping and immediately packages that datum as
 * the canonical ExpressionAst. A caller must not pre-build Expression and pass
 * it through this boundary.
 */

/**
 * Canonical generic PHP-expression lowering used by domain producers.
 * Domain producers keep ownership of their own semantics; they delegate only
 * the PHP expression syntax itself to this boundary.
 */
export const expressionFromPhpAst: ExpressionFromPhpAstOperationInterface<PhpAstValue> = {
    project: input => phpAstExpressionSemanticAuthority.derive({
        kind: 'php_ast_expression_evidence',
        evidence: input.syntax,
        sourceFile: input.sourceFile,
        classContext: { kind: 'none' },
    }),
};

export const expressionProducer: ExpressionProducerInterface<PhpAstValue> = {
    produce(input: ExpressionProducerInput<PhpAstValue>): ExpressionAst {
        const expression = expressionFromPhpAst.project({ syntax: input.syntax, sourceFile: input.source.file });
        return expressionAstFromPhpAst.project(
            { syntax: input.syntax, expression, origin: input.origin, sourceFile: input.source.file },
        );
    },
};
