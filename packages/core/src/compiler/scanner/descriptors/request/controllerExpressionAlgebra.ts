/**
 * Algebra for the canonical controller expression vocabulary.
 *
 * Scanner consumers must operate on the domain expression ADT rather than
 * maintaining a second scanner-specific semantic expression contract.
 */
import { relationVariantFold } from '../../../../semantic/foundation/relationalSequence';
import type { ControllerExpression } from '../../../../types/domain/controllerExpression';
import type { RelationVariant } from '../../../../semantic/foundation/relationalSequence';

type Handler<R, K extends ControllerExpression['kind']> = (
    expression: RelationVariant<ControllerExpression, K>
) => R;

export type ControllerExpressionVisitor<R> = {
    readonly [K in ControllerExpression['kind']]: Handler<R, K>;
};

export function matchControllerExpression<R>(
    expression: ControllerExpression,
    visitor: ControllerExpressionVisitor<R>
): R {
    const fallback = () => { throw Error(`Unhandled controller expression kind: ${expression.kind}`); };
    return relationVariantFold(expression, 'literal', () => relationVariantFold(expression, 'variable', () => relationVariantFold(expression, 'class_reference', () => relationVariantFold(expression, 'property_access', () => relationVariantFold(expression, 'method_call', () => relationVariantFold(expression, 'static_call', () => relationVariantFold(expression, 'construct', () => relationVariantFold(expression, 'instance_of', () => relationVariantFold(expression, 'function_call', () => relationVariantFold(expression, 'array_access', () => relationVariantFold(expression, 'resource_single', () => relationVariantFold(expression, 'resource_collection', () => relationVariantFold(expression, 'array', () => relationVariantFold(expression, 'ternary', () => relationVariantFold(expression, 'short_ternary', () => relationVariantFold(expression, 'null_coalesce', () => relationVariantFold(expression, 'binary', () => relationVariantFold(expression, 'unary', () => relationVariantFold(expression, 'cast', () => relationVariantFold(expression, 'match', () => relationVariantFold(expression, 'closure', () => relationVariantFold(expression, 'arrow_function', () => relationVariantFold(expression, 'unsupported', () => fallback, visitor.unsupported), visitor.arrow_function), visitor.closure), visitor.match), visitor.cast), visitor.unary), visitor.binary), visitor.null_coalesce), visitor.short_ternary), visitor.ternary), visitor.array), visitor.resource_collection), visitor.resource_single), visitor.array_access), visitor.function_call), visitor.instance_of), visitor.construct), visitor.static_call), visitor.method_call), visitor.property_access), visitor.class_reference), visitor.variable), visitor.literal);
}
