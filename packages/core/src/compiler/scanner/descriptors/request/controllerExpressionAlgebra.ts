/**
 * Algebra for the canonical controller expression vocabulary.
 *
 * Scanner consumers must operate on the domain expression ADT rather than
 * maintaining a second scanner-specific semantic expression contract.
 */
import { relationGate } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
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
    const v = expression;
    return relationGate(relationEqual(v.kind, 'literal'), () => visitor.literal(v as Extract<ControllerExpression, { readonly kind: 'literal' }>),
      () => relationGate(relationEqual(v.kind, 'variable'), () => visitor.variable(v as Extract<ControllerExpression, { readonly kind: 'variable' }>),
      () => relationGate(relationEqual(v.kind, 'class_reference'), () => visitor.class_reference(v as Extract<ControllerExpression, { readonly kind: 'class_reference' }>),
      () => relationGate(relationEqual(v.kind, 'property_access'), () => visitor.property_access(v as Extract<ControllerExpression, { readonly kind: 'property_access' }>),
      () => relationGate(relationEqual(v.kind, 'method_call'), () => visitor.method_call(v as Extract<ControllerExpression, { readonly kind: 'method_call' }>),
      () => relationGate(relationEqual(v.kind, 'static_call'), () => visitor.static_call(v as Extract<ControllerExpression, { readonly kind: 'static_call' }>),
      () => relationGate(relationEqual(v.kind, 'construct'), () => visitor.construct(v as Extract<ControllerExpression, { readonly kind: 'construct' }>),
      () => relationGate(relationEqual(v.kind, 'instance_of'), () => visitor.instance_of(v as Extract<ControllerExpression, { readonly kind: 'instance_of' }>),
      () => relationGate(relationEqual(v.kind, 'function_call'), () => visitor.function_call(v as Extract<ControllerExpression, { readonly kind: 'function_call' }>),
      () => relationGate(relationEqual(v.kind, 'array_access'), () => visitor.array_access(v as Extract<ControllerExpression, { readonly kind: 'array_access' }>),
      () => relationGate(relationEqual(v.kind, 'resource_single'), () => visitor.resource_single(v as Extract<ControllerExpression, { readonly kind: 'resource_single' }>),
      () => relationGate(relationEqual(v.kind, 'resource_collection'), () => visitor.resource_collection(v as Extract<ControllerExpression, { readonly kind: 'resource_collection' }>),
      () => relationGate(relationEqual(v.kind, 'array'), () => visitor.array(v as Extract<ControllerExpression, { readonly kind: 'array' }>),
      () => relationGate(relationEqual(v.kind, 'ternary'), () => visitor.ternary(v as Extract<ControllerExpression, { readonly kind: 'ternary' }>),
      () => relationGate(relationEqual(v.kind, 'short_ternary'), () => visitor.short_ternary(v as Extract<ControllerExpression, { readonly kind: 'short_ternary' }>),
      () => relationGate(relationEqual(v.kind, 'null_coalesce'), () => visitor.null_coalesce(v as Extract<ControllerExpression, { readonly kind: 'null_coalesce' }>),
      () => relationGate(relationEqual(v.kind, 'binary'), () => visitor.binary(v as Extract<ControllerExpression, { readonly kind: 'binary' }>),
      () => relationGate(relationEqual(v.kind, 'unary'), () => visitor.unary(v as Extract<ControllerExpression, { readonly kind: 'unary' }>),
      () => relationGate(relationEqual(v.kind, 'cast'), () => visitor.cast(v as Extract<ControllerExpression, { readonly kind: 'cast' }>),
      () => relationGate(relationEqual(v.kind, 'match'), () => visitor.match(v as Extract<ControllerExpression, { readonly kind: 'match' }>),
      () => relationGate(relationEqual(v.kind, 'closure'), () => visitor.closure(v as Extract<ControllerExpression, { readonly kind: 'closure' }>),
      () => relationGate(relationEqual(v.kind, 'arrow_function'), () => visitor.arrow_function(v as Extract<ControllerExpression, { readonly kind: 'arrow_function' }>),
      () => relationGate(relationEqual(v.kind, 'unsupported'), () => visitor.unsupported(v as Extract<ControllerExpression, { readonly kind: 'unsupported' }>), () => { throw Error(`Unhandled controller expression kind: ${v.kind}`); })))))))))))))))))))))));
}
