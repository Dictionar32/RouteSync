import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { Expression } from '../../../../types/upstream/expression';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';

/**
 * Model accessor expressions enter the semantic kernel as the canonical upstream
 * Expression ADT. The model scanner no longer owns a parallel expression algebra.
 */
export function resolveModelAccessorReturnExpression(
    ast: PhpAstValue,
    sourceFile: string = '<model-accessor>',
): Expression {
    return mapResourcePhpAstToUpstream(ast, sourceFile);
}
