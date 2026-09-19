import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { ModelName, ResourceName, TableName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import { mapAstValueToExpression } from '../resource/resourceAstExpressionMapper';
export type ControllerModelOrigin =
    | { readonly kind: 'model_class'; readonly name: ModelName }
    | { readonly kind: 'table'; readonly name: TableName };
export type ControllerReturnExpression =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };
export interface ControllerResourceBinding {
    readonly resourceName: ResourceName;
    readonly model: ControllerModelOrigin;
}

export type ControllerSemanticDefinitionOrigin =
    | { readonly kind: 'parameter'; readonly variable: VariableName }
    | { readonly kind: 'assignment'; readonly statementIndex: number }
    | { readonly kind: 'foreach'; readonly statementIndex: number }
    | { readonly kind: 'catch'; readonly statementIndex: number };

export interface ControllerSemanticVariableDefinition {
    readonly variable: VariableName;
    readonly origin: ControllerSemanticDefinitionOrigin;
    readonly expression: ResourceExpressionModel;
    readonly availability: ControllerDefinitionAvailability;
}

export interface ControllerSemanticVariableBinding {
    readonly variable: VariableName;
    readonly definitions: readonly ControllerSemanticVariableDefinition[];
}

export class ControllerSemanticVariableIndex {
    private readonly lookup: ReadonlyMap<VariableName, ControllerSemanticVariableBinding>;

    public constructor(bindings: readonly ControllerSemanticVariableBinding[]) {
        const lookup = new Map<VariableName, ControllerSemanticVariableBinding>();
        for (const binding of bindings) lookup.set(binding.variable, binding);
        this.lookup = lookup;
        Object.freeze(this);
    }

    public get(variable: VariableName): ControllerSemanticVariableBinding | undefined {
        return this.lookup.get(variable);
    }

    public has(variable: VariableName): boolean {
        return this.lookup.has(variable);
    }

    public get size(): number {
        return this.lookup.size;
    }
}

export type ControllerSemanticReturn =
    | { readonly kind: 'absent' }
    | { readonly kind: 'expression'; readonly expression: ResourceExpressionModel };

export interface ControllerSemanticDataflow {
    readonly variables: readonly ControllerSemanticVariableBinding[];
    readonly byVariable: ControllerSemanticVariableIndex;
    readonly returned: ControllerSemanticReturn;
}

export interface ControllerDataflowContract {
    readonly ast: ControllerDataflowAst;
    readonly semantic: ControllerSemanticDataflow;
    readonly resourceBindings: readonly ControllerResourceBinding[];
}
export function emptyControllerDataflowContract(): ControllerDataflowContract {
    return Object.freeze({
        ast: { definitions: [], references: [] },
        semantic: { variables: [], byVariable: new ControllerSemanticVariableIndex([]), returned: { kind: 'absent' } },
        resourceBindings: []
    });
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
    return Object.freeze({
        ast,
        semantic: buildSemanticDataflow(ast, parameters, returned),
        resourceBindings: Object.freeze(bindings)
    });
}

function buildSemanticDataflow(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnExpression
): ControllerSemanticDataflow {
    const parameterNames = new Set(parameters.map(parameter => parameter.name));
    const definitions = ast.definitions.map(definition => Object.freeze({
        variable: SemanticValueFactory.variableName(definition.name),
        origin: semanticDefinitionOrigin(definition),
        expression: mapAstValueToExpression(definition.value),
        availability: definition.availability
    }));
    const variables = new Map<string, ControllerSemanticVariableDefinition[]>();
    for (const definition of definitions) {
        const key = definition.variable.value;
        const existing = variables.get(key);
        if (existing) existing.push(definition);
        else variables.set(key, [definition]);
    }
    const parameterBindings = parameters.map(parameter => Object.freeze({
        variable: SemanticValueFactory.variableName(parameter.name),
        definitions: Object.freeze([])
    }));
    const bindings = [
        ...parameterBindings,
        ...Array.from(variables.entries()).map(([name, entries]) => Object.freeze({
            variable: SemanticValueFactory.variableName(name),
            definitions: Object.freeze(entries)
        }))
    ].filter(binding => parameterNames.has(binding.variable.value) || binding.definitions.length > 0);
    const returnedExpression: ControllerSemanticReturn = returned.kind === 'present'
        ? { kind: 'expression', expression: mapAstValueToExpression(returned.value) }
        : { kind: 'absent' };
    const frozenBindings = Object.freeze(bindings);
    return Object.freeze({
        variables: frozenBindings,
        byVariable: new ControllerSemanticVariableIndex(frozenBindings),
        returned: returnedExpression
    });
}

function semanticDefinitionOrigin(
    definition: ControllerVariableDefinition
): ControllerSemanticDefinitionOrigin {
    switch (definition.origin.kind) {
        case 'assignment': return { kind: 'assignment', statementIndex: definition.statementIndex };
        case 'foreach': return { kind: 'foreach', statementIndex: definition.origin.statementIndex };
        case 'catch': return { kind: 'catch', statementIndex: definition.origin.statementIndex };
    }
}

function collectResourceBindings(
    value: PhpAstValue,
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    bindings: ControllerResourceBinding[]
): void {
    if (value.kind === 'resource_single' || value.kind === 'resource_collection') {
        const model = resolveModelOrigin(value.argument, ast, parameters, new Set());
        if (model) bindings.push({ resourceName: SemanticValueFactory.resourceName(value.resourceName), model });
        return;
    }
    if (value.kind === 'static_call' && value.method === 'collection') {
        const argument = value.arguments.length === 0 ? undefined : value.arguments[0];
        const model = argument && argument.kind === 'positional'
            ? resolveModelOrigin(argument.value, ast, parameters, new Set())
            : undefined;
        if (model) bindings.push({ resourceName: SemanticValueFactory.resourceName(value.className), model });
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
    visited: Set<string>
): ControllerModelOrigin | undefined {
    if (value.kind === 'static_call') return resolveStaticCallOrigin(value);
    if (value.kind === 'method_chain') return resolveModelOrigin(value.receiver, ast, parameters, visited);
    if (value.kind !== 'variable_reference' || visited.has(value.name)) return undefined;
    visited.add(value.name);
    const parameter = parameters.find(item => item.name === value.name);
    if (parameter && parameter.type.kind === 'named') return { kind: 'model_class', name: SemanticValueFactory.modelName(parameter.type.name) };
    const definition = [...ast.definitions].reverse().find(item => item.name === value.name && item.availability.kind === 'definite');
    return definition ? resolveModelOrigin(definition.value, ast, parameters, visited) : undefined;
}
function resolveStaticCallOrigin(
    value: Extract<PhpAstValue, { kind: 'static_call' }>
): ControllerModelOrigin {
    if (value.className === 'DB' && value.method === 'table') {
        const argument = value.arguments[0];
        if (argument && argument.kind === 'positional' && argument.value.kind === 'literal' && argument.value.literalType === 'string') {
            return { kind: 'table', name: SemanticValueFactory.tableName(argument.value.value) };
        }
    }
    return { kind: 'model_class', name: SemanticValueFactory.modelName(value.className) };
}
