import type { AstIdentifier, PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
export type ControllerModelOrigin =
    | { readonly kind: 'model_class'; readonly name: AstIdentifier }
    | { readonly kind: 'table'; readonly name: string };
export type ControllerReturnExpression =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };
export interface ControllerResourceBinding {
    readonly resourceName: AstIdentifier;
    readonly model: ControllerModelOrigin;
}
export interface ControllerDataflowContract {
    readonly ast: ControllerDataflowAst;
    readonly resourceBindings: readonly ControllerResourceBinding[];
}
export function emptyControllerDataflowContract(): ControllerDataflowContract {
    return Object.freeze({ ast: { definitions: [], references: [] }, resourceBindings: [] });
}
export function createControllerDataflowContract(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnExpression
): ControllerDataflowContract {
    const bindings: ControllerResourceBinding[] = [];
    if (returned.kind === 'present') {
        collectResourceBindings(returned.value, ast, parameters, bindings);
    }
    return Object.freeze({ ast, resourceBindings: Object.freeze(bindings) });
}
function collectResourceBindings(
    value: PhpAstValue,
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    bindings: ControllerResourceBinding[]
): void {
    if (value.kind === 'resource_single' || value.kind === 'resource_collection') {
        const model = resolveModelOrigin(value.argument, ast, parameters, new Set());
        if (model) bindings.push({ resourceName: value.resourceName, model });
        return;
    }
    if (value.kind === 'static_call' && value.method === 'collection') {
        const argument = value.arguments.length === 0 ? undefined : value.arguments[0];
        const model = argument && argument.kind === 'positional'
            ? resolveModelOrigin(argument.value, ast, parameters, new Set())
            : undefined;
        if (model) bindings.push({ resourceName: value.className, model });
        return;
    }
    if (value.kind === 'method_chain') {
        for (const argument of value.arguments) collectResourceBindings(argument.value, ast, parameters, bindings);
        collectResourceBindings(value.receiver, ast, parameters, bindings);
        return;
    }
    if (value.kind === 'function_call') {
        for (const argument of value.arguments) collectResourceBindings(argument.value, ast, parameters, bindings);
        return;
    }
    if (value.kind === 'nested_array') {
        for (const entry of value.entries) collectResourceBindings(entry.value, ast, parameters, bindings);
        return;
    }
    if (value.kind === 'ternary_expression') {
        collectResourceBindings(value.trueBranch, ast, parameters, bindings);
        collectResourceBindings(value.falseBranch, ast, parameters, bindings);
        return;
    }
    if (value.kind === 'null_coalesce') {
        collectResourceBindings(value.left, ast, parameters, bindings);
        collectResourceBindings(value.right, ast, parameters, bindings);
    }
}
function resolveModelOrigin(
    value: PhpAstValue,
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    visited: Set<AstIdentifier>
): ControllerModelOrigin | undefined {
    if (value.kind === 'static_call') return resolveStaticCallOrigin(value);
    if (value.kind === 'method_chain') return resolveModelOrigin(value.receiver, ast, parameters, visited);
    if (value.kind !== 'variable_reference' || visited.has(value.name)) return undefined;
    visited.add(value.name);
    const parameter = parameters.find(item => item.name === value.name);
    if (parameter && parameter.type.kind === 'named') return { kind: 'model_class', name: parameter.type.name };
    const definition = [...ast.definitions].reverse().find(item => item.name === value.name && item.availability.kind === 'definite');
    return definition ? resolveModelOrigin(definition.value, ast, parameters, visited) : undefined;
}
function resolveStaticCallOrigin(
    value: Extract<PhpAstValue, { kind: 'static_call' }>
): ControllerModelOrigin {
    if (value.className === 'DB' && value.method === 'table') {
        const argument = value.arguments[0];
        if (argument && argument.kind === 'positional' && argument.value.kind === 'literal' && argument.value.literalType === 'string') {
            return { kind: 'table', name: argument.value.value };
        }
    }
    return { kind: 'model_class', name: value.className };
}
