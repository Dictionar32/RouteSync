import type { ExpressionAst, ExpressionOrigin } from '../../../types/upstream/ast';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { expressionAstFromPhpAst } from './expressionAstCanonical';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';

/**
 * Source → ExpressionAst producer boundary.
 *
 * The input contains only source syntax plus provenance. The producer owns the
 * syntax-to-semantic Expression mapping and immediately packages that datum as
 * the canonical ExpressionAst. A caller must not pre-build Expression and pass
 * it through this boundary.
 */
export type ExpressionProducerInput = {
    readonly syntax: PhpAstValue;
    readonly origin: ExpressionOrigin;
    readonly source: SourceSpan;
};

export interface ExpressionProducer {
    produce(input: ExpressionProducerInput): ExpressionAst;
}

export const expressionProducer: ExpressionProducer = {
    produce(input): ExpressionAst {
        const expression = mapResourcePhpAstToUpstream(
            input.syntax,
            input.source.file.value.value,
        );
        return expressionAstFromPhpAst(
            input.syntax,
            expression,
            input.origin,
            input.source.file.value.value,
        );
    },
};
