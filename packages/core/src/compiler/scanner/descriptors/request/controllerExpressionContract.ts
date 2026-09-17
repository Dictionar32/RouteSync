/** Semantic expression ADT resolved from Laravel expression AST. */
import type { AstIdentifier, PhpAstValue } from '../../lexer/phpAstTypes';
import { matchPhpAstValue } from '../../lexer/phpAstAlgebra';

export interface ControllerPropertyPath {
    readonly root: AstIdentifier;
    readonly steps: readonly AstIdentifier[];
}

export type ControllerExpressionContract =
    | { readonly kind: 'literal'; readonly literalType: 'string' | 'number' | 'boolean' | 'null'; readonly value: string | number | boolean | null }
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'class_reference'; readonly className: AstIdentifier }
    | { readonly kind: 'property_access'; readonly target: ControllerPropertyPath; readonly property: AstIdentifier; readonly nullsafe: boolean }
    | { readonly kind: 'method_call'; readonly target: ControllerPropertyPath; readonly method: AstIdentifier; readonly arguments: readonly ControllerExpressionContract[]; readonly nullsafe: boolean }
    | { readonly kind: 'static_call'; readonly className: AstIdentifier; readonly method: AstIdentifier; readonly arguments: readonly ControllerExpressionContract[] }
    | { readonly kind: 'resource'; readonly resourceName: AstIdentifier; readonly collection: boolean; readonly argument: ControllerExpressionContract }
    | { readonly kind: 'object'; readonly properties: readonly ControllerExpressionProperty[] }
    | { readonly kind: 'ternary'; readonly condition: ControllerExpressionContract; readonly trueBranch: ControllerExpressionContract; readonly falseBranch: ControllerExpressionContract }
    | { readonly kind: 'unknown' };

export interface ControllerExpressionProperty {
    readonly name: AstIdentifier;
    readonly value: ControllerExpressionContract;
}

export function resolveControllerExpression(value: PhpAstValue): ControllerExpressionContract {
    return matchPhpAstValue<ControllerExpressionContract>(value, {
        literal: v => ({ kind: 'literal', literalType: v.literalType, value: v.value }),
        variableReference: v => ({ kind: 'variable', name: v.name }),
        propertyAccess: v => ({
            kind: 'property_access',
            target: v.target,
            property: v.property,
            nullsafe: v.nullsafe
        }),
        methodChain: v => ({
            kind: 'method_call',
            target: v.target,
            method: v.property,
            arguments: Object.freeze(v.arguments.map(resolveControllerExpression)),
            nullsafe: v.nullsafe
        }),
        resourceSingle: v => ({
            kind: 'resource',
            resourceName: v.resourceName,
            collection: false,
            argument: resolveControllerExpression(v.argument)
        }),
        resourceCollection: v => ({
            kind: 'resource',
            resourceName: v.resourceName,
            collection: true,
            argument: resolveControllerExpression(v.argument)
        }),
        nestedArray: v => ({
            kind: 'object',
            properties: Object.freeze(v.entries.map(entry => ({
                name: entry.key,
                value: resolveControllerExpression(entry.value)
            })))
        }),
        ternaryExpression: v => ({
            kind: 'ternary',
            condition: resolveControllerExpression(v.condition),
            trueBranch: resolveControllerExpression(v.trueBranch),
            falseBranch: resolveControllerExpression(v.falseBranch)
        }),
        staticCall: v => ({
            kind: 'static_call',
            className: v.className,
            method: v.method,
            arguments: Object.freeze(v.arguments.map(resolveControllerExpression))
        }),
        classReference: v => ({ kind: 'class_reference', className: v.className }),
        unknown: () => ({ kind: 'unknown' })
    });
}

