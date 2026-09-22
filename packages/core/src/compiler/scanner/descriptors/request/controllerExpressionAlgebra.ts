/**
 * Algebra for the canonical controller expression vocabulary.
 *
 * Scanner consumers must operate on the domain expression ADT rather than
 * maintaining a second scanner-specific semantic expression contract.
 */
import type { ControllerExpression } from '../../../../types/domain/controllerExpression';

type Handler<R, K extends ControllerExpression['kind']> = (
    expression: Extract<ControllerExpression, { readonly kind: K }>
) => R;

export type ControllerExpressionVisitor<R> = {
    readonly [K in ControllerExpression['kind']]: Handler<R, K>;
};

export function matchControllerExpression<R>(
    expression: ControllerExpression,
    visitor: ControllerExpressionVisitor<R>
): R {
    switch (expression.kind) {
        case 'literal':
            return visitor.literal(expression);
        case 'variable':
            return visitor.variable(expression);
        case 'class_reference':
            return visitor.class_reference(expression);
        case 'property_access':
            return visitor.property_access(expression);
        case 'method_call':
            return visitor.method_call(expression);
        case 'static_call':
            return visitor.static_call(expression);
        case 'construct':
            return visitor.construct(expression);
        case 'instance_of':
            return visitor.instance_of(expression);
        case 'function_call':
            return visitor.function_call(expression);
        case 'array_access':
            return visitor.array_access(expression);
        case 'resource_single':
            return visitor.resource_single(expression);
        case 'resource_collection':
            return visitor.resource_collection(expression);
        case 'array':
            return visitor.array(expression);
        case 'ternary':
            return visitor.ternary(expression);
        case 'short_ternary':
            return visitor.short_ternary(expression);
        case 'null_coalesce':
            return visitor.null_coalesce(expression);
        case 'binary':
            return visitor.binary(expression);
        case 'unary':
            return visitor.unary(expression);
        case 'cast':
            return visitor.cast(expression);
        case 'match':
            return visitor.match(expression);
        case 'closure':
            return visitor.closure(expression);
        case 'arrow_function':
            return visitor.arrow_function(expression);
        case 'unsupported':
            return visitor.unsupported(expression);
    }
}
