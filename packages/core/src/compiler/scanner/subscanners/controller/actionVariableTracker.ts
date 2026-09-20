/**
 * Controller action dataflow boundary.
 *
 * Scanner syntax is converted into typed bindings here. Consumers do not
 * receive string-keyed bags such as Map<string, string> or encoded values
 * such as "table:orders".
 */
import type { Token } from '../lexer/types';
import type { FormRequestSource } from '../../../../types/domain/request';
import type { ClassName, TableName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';

export type ControllerParameterType =
    | { readonly kind: 'class'; readonly name: ClassName }
    | { readonly kind: 'builtin'; readonly name: 'request' | 'response' | 'query' | 'session' };

export type ActionParameterFormRequest =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly source: FormRequestSource };

function resolveActionParameterFormRequest(
    typeName: string,
    formRequestMap: ReadonlyMap<string, FormRequestSource>
): ActionParameterFormRequest {
    const source = formRequestMap.get(typeName);
    return source === undefined
        ? { kind: 'absent' }
        : { kind: 'present', source };
}

export interface ActionParameterBinding {
    readonly variable: VariableName;
    readonly type: ControllerParameterType;
    readonly formRequest: ActionParameterFormRequest;
}

export class ActionParameterIndex {
    private readonly lookup: ReadonlyMap<VariableName, ActionParameterBinding>;

    constructor(parameters: readonly ActionParameterBinding[]) {
        const lookup = new Map<VariableName, ActionParameterBinding>();
        for (const parameter of parameters) lookup.set(parameter.variable, parameter);
        this.lookup = lookup;
        Object.freeze(this);
    }

    public get(variable: VariableName): ActionParameterBinding | undefined {
        return this.lookup.get(variable);
    }

    public has(variable: VariableName): boolean {
        return this.lookup.has(variable);
    }
}

export type LocalBindingTarget =
    | { readonly kind: 'model'; readonly name: ClassName }
    | { readonly kind: 'table'; readonly name: TableName }
    | { readonly kind: 'alias'; readonly variable: VariableName };

export interface LocalVariableBinding {
    readonly variable: VariableName;
    readonly target: LocalBindingTarget;
    readonly origin: LocalBindingOrigin;
}

export type LocalBindingOrigin =
    | { readonly kind: 'static_model_reference'; readonly model: ClassName }
    | { readonly kind: 'database_table_reference'; readonly table: TableName }
    | { readonly kind: 'variable_alias'; readonly source: VariableName };


export class LocalVariableEnvironment {
    private readonly lookup: ReadonlyMap<VariableName, LocalVariableBinding>;

    constructor(bindings: readonly LocalVariableBinding[] = []) {
        const lookup = new Map<VariableName, LocalVariableBinding>();
        for (const binding of bindings) lookup.set(binding.variable, binding);
        this.lookup = lookup;
        Object.freeze(this);
    }

    public get(variable: VariableName): LocalVariableBinding | undefined {
        return this.lookup.get(variable);
    }

    public has(variable: VariableName): boolean {
        return this.lookup.has(variable);
    }
}

export interface ActionParameterScanResult {
    readonly parameters: readonly ActionParameterBinding[];
    readonly parameterIndex: ActionParameterIndex;
    readonly bodyStartIndex: number;
}

export function scanActionParameters(
    tokens: readonly Token[],
    funcTokenIdx: number,
    formRequestMap: ReadonlyMap<string, FormRequestSource>,
): ActionParameterScanResult {
    const parameters: ActionParameterBinding[] = [];
    let pIdx = funcTokenIdx + 2;

    while (pIdx < tokens.length && tokens[pIdx].value !== '{' && tokens[pIdx].value !== ';') {
        if (tokens[pIdx].type === 'IDENTIFIER' && tokens[pIdx + 1]?.type === 'VARIABLE') {
            const typeName = tokens[pIdx].value;
            const variable = SemanticValueFactory.variableName(tokens[pIdx + 1].value);
            const formRequest = resolveActionParameterFormRequest(typeName, formRequestMap);
            parameters.push({
                variable,
                type: { kind: 'class', name: SemanticValueFactory.className(typeName) },
                formRequest,
            });
        }
        pIdx++;
    }

    return Object.freeze({
        parameters: Object.freeze(parameters),
        parameterIndex: new ActionParameterIndex(parameters),
        bodyStartIndex: pIdx,
    });
}

export function trackVariableAssignment(
    tokens: readonly Token[],
    k: number,
    environment: LocalVariableEnvironment,
): LocalVariableBinding | undefined {
    if (tokens[k].type !== 'VARIABLE' || tokens[k + 1]?.value !== '=') return undefined;
    const variable = SemanticValueFactory.variableName(tokens[k].value);
    const rhs1 = tokens[k + 2];
    const rhs2 = tokens[k + 3];

    if (rhs1?.type === 'IDENTIFIER' && rhs2?.value === '::') {
        const callee = rhs1.value;
        if (callee === 'DB' && tokens[k + 4]?.value === 'table' && tokens[k + 5]?.value === '(') {
            const tableToken = tokens[k + 6];
            if (tableToken !== undefined) {
                return {
                    variable,
                    target: { kind: 'table', name: SemanticValueFactory.tableName(tableToken.value.replace(/['"]/g, '')) },
                    origin: { kind: 'database_table_reference', table: SemanticValueFactory.tableName(tableToken.value.replace(/['"]/g, '')) },
                };
            }
        }
        if (!['Log', 'Auth', 'Validator', 'Gate', 'Session', 'Cache', 'Event', 'Response'].includes(callee)) {
            return { variable, target: { kind: 'model', name: SemanticValueFactory.className(callee) }, origin: { kind: 'static_model_reference', model: SemanticValueFactory.className(callee) } };
        }
    }

    if (rhs1?.type === 'VARIABLE') {
        const source = SemanticValueFactory.variableName(rhs1.value);
        if (environment.has(source)) return { variable, target: { kind: 'alias', variable: source }, origin: { kind: 'variable_alias', source } };
    }

    return undefined;
}

export type ControllerBindingResolution =
    | { readonly kind: 'model'; readonly model: ClassName; readonly source: LocalBindingOrigin }
    | { readonly kind: 'table'; readonly table: TableName; readonly source: LocalBindingOrigin }
    | { readonly kind: 'parameter'; readonly type: ControllerParameterType; readonly source: VariableName }
    | { readonly kind: 'unresolved'; readonly variable: VariableName };

export function resolveControllerBinding(
    variable: VariableName,
    environment: LocalVariableEnvironment,
    parameters: ActionParameterIndex,
): ControllerBindingResolution {
    const binding = environment.get(variable);
    if (binding !== undefined) return resolveControllerLocalBinding(binding, environment);

    const parameter = parameters.get(variable);
    if (parameter !== undefined) {
        return { kind: 'parameter', type: parameter.type, source: variable };
    }

    return { kind: 'unresolved', variable };
}

function resolveControllerLocalBinding(
    binding: LocalVariableBinding,
    environment: LocalVariableEnvironment,
): ControllerBindingResolution {
    switch (binding.target.kind) {
        case 'model':
            return { kind: 'model', model: binding.target.name, source: binding.origin };
        case 'table':
            return { kind: 'table', table: binding.target.name, source: binding.origin };
        case 'alias': {
            const source = environment.get(binding.target.variable);
            if (source !== undefined) return resolveControllerLocalBinding(source, environment);
            return { kind: 'unresolved', variable: binding.target.variable };
        }
    }
}

export type BoundModelReference =
    | { readonly kind: 'model'; readonly name: ClassName }
    | { readonly kind: 'table'; readonly name: TableName }
    | { readonly kind: 'parameter'; readonly type: ControllerParameterType };

export function resolveBoundModel(
    firstArg: string,
    environment: LocalVariableEnvironment,
    parameters: ActionParameterIndex,
): BoundModelReference | undefined {
    const variable = firstArg.startsWith('$') ? SemanticValueFactory.variableName(firstArg) : null;
    if (variable !== null) {
        const binding = environment.get(variable);
        if (binding !== undefined) {
            return resolveLocalBinding(binding, environment);
        }
    }

    if (firstArg.includes('::')) {
        const root = firstArg.split('::')[0];
        if (!['DB', 'Log', 'Auth', 'Response'].includes(root)) {
            return { kind: 'model', name: SemanticValueFactory.className(root) };
        }
    }

    const parameter = parameters.get(SemanticValueFactory.variableName(firstArg));
    return parameter === undefined ? undefined : { kind: 'parameter', type: parameter.type };
}

function resolveLocalBinding(
    binding: LocalVariableBinding,
    environment: LocalVariableEnvironment,
): BoundModelReference {
    switch (binding.target.kind) {
        case 'model': return binding.target;
        case 'table': return binding.target;
        case 'alias': {
            const source = environment.get(binding.target.variable);
            return source === undefined ? { kind: 'model', name: SemanticValueFactory.className(binding.target.variable.value) } : resolveLocalBinding(source, environment);
        }
    }
}
