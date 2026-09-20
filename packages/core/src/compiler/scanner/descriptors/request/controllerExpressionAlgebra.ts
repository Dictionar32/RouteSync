/** Exhaustive eliminator for controller semantic expressions. */
import type { ControllerExpressionContract } from './controllerExpressionContract';

type Handler<R, K extends ControllerExpressionContract['kind']> = (
    expression: Extract<ControllerExpressionContract, { readonly kind: K }>
) => R;

export type ControllerExpressionVisitor<R> = {
    readonly [K in ControllerExpressionContract['kind']]: Handler<R, K>;
};

export function matchControllerExpression<R>(
    expression: ControllerExpressionContract,
    visitor: ControllerExpressionVisitor<R>
): R {
    const handler = visitor[expression.kind] as Handler<R, ControllerExpressionContract['kind']>;
    return handler(expression as never);
}
