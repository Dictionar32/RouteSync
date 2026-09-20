import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst, ControllerDefinitionAvailability, ControllerVariableDefinition } from '../../lexer/controllerBodyAstTypes';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { ModelName, ResourceName, TableName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import { mapAstValueToExpression } from '../resource/resourceAstExpressionMapper';
import type { Lookup } from '../../../../types/upstream/collections';
import type { ControllerVariableSemantic } from '../../../../types/upstream/controller';
export type ControllerModelOrigin =
    | { readonly kind: 'model_class'; readonly name: ModelName }
    | { readonly kind: 'table'; readonly name: TableName };
export type ControllerReturnExpression =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };
export interface ControllerReturnSet {
    readonly expressions: readonly ControllerReturnExpression[];
}
export function createControllerReturnSet(returns: readonly PhpAstValue[]): ControllerReturnSet {
    return Object.freeze({
        expressions: Object.freeze(returns.map(value => Object.freeze({ kind: 'present' as const, value })))
    });
}
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
    readonly semantic: ControllerVariableSemantic;
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
    public lookupVariable(variable: VariableName): Lookup<ControllerSemanticVariableBinding> {
        const value = this.lookup.get(variable);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }
    public lookupSemantic(variable: VariableName): Lookup<ControllerVariableSemantic> {
        const binding = this.lookup.get(variable);
        if (!binding) return { kind: 'missing' };
        for (let index = binding.definitions.length - 1; index >= 0; index -= 1) {
            const definition = binding.definitions[index];
            if (definition.availability.kind === 'definite') return { kind: 'found', value: definition.semantic };
        }
        return { kind: 'missing' };
    }
    public get size(): number { return this.lookup.size; }
}
export type ControllerSemanticReturn =
    | { readonly kind: 'absent' }
    | { readonly kind: 'expression'; readonly expression: ResourceExpressionModel };
export interface ControllerSemanticDataflow {
    readonly variables: readonly ControllerSemanticVariableBinding[];
    readonly byVariable: ControllerSemanticVariableIndex;
    readonly returned: readonly ControllerSemanticReturn[];
}
export interface ControllerDataflowContract {
    readonly ast: ControllerDataflowAst;
    readonly semantic: ControllerSemanticDataflow;
    readonly resourceBindings: readonly ControllerResourceBinding[];
}
export function emptyControllerDataflowContract(): ControllerDataflowContract {
    return Object.freeze({
        ast: { definitions: [], references: [] },
        semantic: { variables: [], byVariable: new ControllerSemanticVariableIndex([]), returned: [] },
        resourceBindings: []
    });
}
export function createControllerDataflowContract(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnSet
): ControllerDataflowContract {
    const bindings: ControllerResourceBinding[] = [];
    for (const item of returned.expressions) {
        if (item.kind === 'present') collectResourceBindings(item.value, ast, parameters, bindings);
    }
    return Object.freeze({ ast, semantic: buildSemanticDataflow(ast, parameters, returned), resourceBindings: Object.freeze(bindings) });
}
function buildSemanticDataflow(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnSet
): ControllerSemanticDataflow {
    const parameterNames = new Set<string>(parameters.map(parameter => parameter.name));
    const definitions = ast.definitions.map(definition => Object.freeze({
        variable: SemanticValueFactory.variableName(definition.name),
        origin: semanticDefinitionOrigin(definition),
        expression: mapAstValueToExpression(definition.value),
        semantic: definition.semantic,
        availability: definition.availability
    }));
    const variables = new Map<string, ControllerSemanticVariableDefinition[]>();
    for (const definition of definitions) {
        const key = definition.variable.value;
        const existing = variables.get(key);
        if (existing) existing.push(definition);
        else variables.set(key, [definition]);
    }
    const parameterBindings = parameters.map(parameter => Object.freeze({ variable: SemanticValueFactory.variableName(parameter.name), definitions: Object.freeze([]) }));
    const bindings = [
        ...parameterBindings,
        ...Array.from(variables.entries()).map(([name, entries]) => Object.freeze({ variable: SemanticValueFactory.variableName(name), definitions: Object.freeze(entries) }))
    ].filter(binding => parameterNames.has(binding.variable.value) || binding.definitions.length > 0);
    const returnedExpressions = returned.expressions.map(item =>
        item.kind === 'present'
            ? { kind: 'expression' as const, expression: mapAstValueToExpression(item.value) }
            : { kind: 'absent' as const }
    );
    const frozenBindings = Object.freeze(bindings);
    return Object.freeze({ variables: frozenBindings, byVariable: new ControllerSemanticVariableIndex(frozenBindings), returned: Object.freeze(returnedExpressions) });
}
function semanticDefinitionOrigin(definition: ControllerVariableDefinition): ControllerSemanticDefinitionOrigin {
    switch (definition.origin.kind) {
        case 'assignment': return { kind: 'assignment', statementIndex: definition.statementIndex };
        case 'foreach': return { kind: 'foreach', statementIndex: definition.origin.statementIndex };
        case 'catch': return { kind: 'catch', statementIndex: definition.origin.statementIndex };
    }
}
function collectResourceBindings(value: PhpAstValue, ast: ControllerDataflowAst, parameters: readonly ControllerParameterAst[], bindings: ControllerResourceBinding[]): void {
    const semanticIndex = createSemanticVariableIndex(ast, parameters);
    collectResourceBindingsWithIndex(value, semanticIndex, bindings);
}
function createSemanticVariableIndex(ast: ControllerDataflowAst, parameters: readonly ControllerParameterAst[]): ControllerSemanticVariableIndex {
    const bindings: ControllerSemanticVariableBinding[] = [];
    const definitions = new Map<string, ControllerSemanticVariableDefinition[]>();
    for (const definition of ast.definitions) {
        const semanticDefinition = Object.freeze({
            variable: SemanticValueFactory.variableName(definition.name),
            origin: semanticDefinitionOrigin(definition),
            expression: mapAstValueToExpression(definition.value),
            semantic: definition.semantic,
            availability: definition.availability
        });
        const existing = definitions.get(semanticDefinition.variable.value);
        if (existing) existing.push(semanticDefinition);
        else definitions.set(semanticDefinition.variable.value, [semanticDefinition]);
    }
    for (const parameter of parameters) bindings.push({ variable: SemanticValueFactory.variableName(parameter.name), definitions: Object.freeze([]) });
    for (const [name, entries] of definitions) bindings.push({ variable: SemanticValueFactory.variableName(name), definitions: Object.freeze(entries) });
    return new ControllerSemanticVariableIndex(bindings);
}
function collectResourceBindingsWithIndex(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex, bindings: ControllerResourceBinding[]): void {
    if (value.kind === 'resource_single' || value.kind === 'resource_collection') {
        const model = resolveModelOrigin(value.argument, semanticIndex);
        if (model) bindings.push({ resourceName: SemanticValueFactory.resourceName(value.resourceName), model });
        return;
    }
    if (value.kind === 'static_call' && value.method === 'collection') {
        const argument = value.arguments[0];
        if (argument && argument.kind === 'positional') {
            const model = resolveModelOrigin(argument.value, semanticIndex);
            if (model) bindings.push({ resourceName: SemanticValueFactory.resourceName(value.className), model });
        }
        return;
    }
    if (value.kind === 'method_chain') {
        for (const argument of value.arguments) collectResourceBindingsWithIndex(argument.value, semanticIndex, bindings);
        collectResourceBindingsWithIndex(value.receiver, semanticIndex, bindings);
        return;
    }
    if (value.kind === 'function_call') {
        for (const argument of value.arguments) collectResourceBindingsWithIndex(argument.value, semanticIndex, bindings);
        return;
    }
    if (value.kind === 'nested_array') {
        for (const entry of value.entries) collectResourceBindingsWithIndex(entry.value, semanticIndex, bindings);
        return;
    }
    if (value.kind === 'ternary_expression') {
        collectResourceBindingsWithIndex(value.trueBranch, semanticIndex, bindings);
        collectResourceBindingsWithIndex(value.falseBranch, semanticIndex, bindings);
        return;
    }
    if (value.kind === 'null_coalesce') {
        collectResourceBindingsWithIndex(value.left, semanticIndex, bindings);
        collectResourceBindingsWithIndex(value.right, semanticIndex, bindings);
    }
}
function resolveModelOrigin(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex): ControllerModelOrigin | undefined {
    if (value.kind === 'variable_reference') {
        const result = semanticIndex.lookupSemantic(SemanticValueFactory.variableName(value.name));
        if (result.kind === 'found' && result.value.kind === 'model_origin') return toDomainModelOrigin(result.value.origin);
        return undefined;
    }
    if (value.kind === 'static_call') return resolveStaticCallOrigin(value);
    if (value.kind === 'method_chain') return resolveModelOrigin(value.receiver, semanticIndex);
    return undefined;
}

function toDomainModelOrigin(origin: import('../../../../types/upstream/controller').ControllerModelOrigin): ControllerModelOrigin {
    return origin.kind === 'table'
        ? { kind: 'table', name: SemanticValueFactory.tableName(origin.name.value.value) }
        : { kind: 'model_class', name: SemanticValueFactory.modelName(origin.name.value.value) };
}

function resolveStaticCallOrigin(value: Extract<PhpAstValue, { kind: 'static_call' }>): ControllerModelOrigin {
    if (value.className === 'DB' && value.method === 'table') {
        const argument = value.arguments[0];
        if (argument && argument.kind === 'positional' && argument.value.kind === 'literal' && argument.value.literalType === 'string') {
            return { kind: 'table', name: SemanticValueFactory.tableName(argument.value.value) };
        }
    }
    return { kind: 'model_class', name: SemanticValueFactory.modelName(value.className) };
}
