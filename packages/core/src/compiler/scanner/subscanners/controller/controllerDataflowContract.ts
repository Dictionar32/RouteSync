import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { ModelName, ResourceName, TableName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import { resolveAstValueToExpression } from '../resource/resourceAstExpressionMapper';
import type { Lookup } from '../../../../types/upstream/collections';
import type { ControllerModelOrigin, ControllerVariableSemantic } from '../../../../types/upstream/controller';
export type { ControllerModelOrigin } from '../../../../types/upstream/controller';
import { knowledgeIdKey, type KnowledgeId, type SemanticBinding, type SemanticKnowledgeDataFlow, type SemanticPresence } from '../../lexer/routeAst/semanticKnowledgeDataFlowRelations';
import type { ResponseReference } from '../../../../types/upstream/semanticReferences';
import { relationGate, relationFold, relationProject, relationExpand, relationOptionFold, relationLookup, relationAll, relationAny } from '../../../../semantic/kernel/relationalSequence';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { solveCandidate, requirement } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';

const emptySemanticKnowledgeDataFlow: SemanticKnowledgeDataFlow = Object.freeze({
    facts: Object.freeze([]),
    dataFlow: Object.freeze([]),
    relations: Object.freeze([]),
});

export type ControllerReturnExpression =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };

export interface ControllerReturnSet {
    readonly expressions: readonly ControllerReturnExpression[];
}

export function createControllerReturnSet(returns: readonly PhpAstValue[]): ControllerReturnSet {
    return Object.freeze({
        expressions: Object.freeze(relationProject(returns, value => Object.freeze({ kind: 'present' as const, value }))),
    });
}

export interface ControllerResourceBinding {
    readonly resourceName: ResourceName;
    readonly model: ControllerModelOrigin;
    readonly response: ResponseReference;
    readonly source: import('../../lexer/phpAstCoreTypes').SourceRange;
}

export type ControllerResourceResponseEvidence =
    | { readonly kind: 'present'; readonly response: ResponseReference }
    | { readonly kind: 'absent' };

export type ControllerSemanticDefinitionOrigin =
    | { readonly kind: 'parameter'; readonly variable: VariableName }
    | { readonly kind: 'assignment'; readonly statementIndex: number }
    | { readonly kind: 'foreach'; readonly statementIndex: number }
    | { readonly kind: 'catch'; readonly statementIndex: number };

export interface ControllerSemanticVariableDefinition {
    readonly variable: VariableName;
    readonly origin: ControllerSemanticDefinitionOrigin;
    readonly value: PhpAstValue;
    readonly expression: ResourceExpressionModel;
    readonly semantic: ControllerVariableSemantic;
    readonly availability: SemanticPresence<KnowledgeId>;
}

export interface ControllerSemanticVariableBinding {
    readonly variable: VariableName;
    readonly definitions: readonly ControllerSemanticVariableDefinition[];
}

export type ControllerSemanticVariableIndex = RelationIndex<VariableName, ControllerSemanticVariableBinding>;

export const createControllerSemanticVariableIndex = (bindings: readonly ControllerSemanticVariableBinding[]): ControllerSemanticVariableIndex =>
    Object.freeze(relationFold(bindings, [] as RelationIndex<VariableName, ControllerSemanticVariableBinding>, (lookup, binding) =>
        relationIndexAdd(lookup, binding.variable, binding)));

export const lookupControllerSemanticVariable = (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
): Lookup<ControllerSemanticVariableBinding> => relationOptionFold(
    relationIndexLookup(index, variable),
    () => ({ kind: 'missing' as const }),
    value => ({ kind: 'found' as const, value }),
);

export const lookupControllerSemantic = (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
): Lookup<ControllerVariableSemantic> => relationOptionFold(
    relationIndexLookup(index, variable),
    () => ({ kind: 'missing' as const }),
    value => latestAvailableSemantic(value),
);

export const controllerSemanticVariableIndexSize = (index: ControllerSemanticVariableIndex): number => index.length;

function latestAvailableSemantic(binding: ControllerSemanticVariableBinding): Lookup<ControllerVariableSemantic> {
    const reversed = [...binding.definitions].reverse();
    return relationOptionFold(
        relationFold(reversed, { kind: 'none' as const } as { kind: 'none' } | { kind: 'some'; value: ControllerVariableSemantic }, (current, definition) =>
            relationGate(Object.is(current.kind, 'some'), () => current, () => relationGate(Object.is(definition.availability.kind, 'absent'), () => ({ kind: 'some' as const, value: definition.semantic }), () => current))),
        () => ({ kind: 'missing' as const }),
        value => ({ kind: 'found' as const, value }),
    );
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
        ast: { definitions: [], references: [], semanticKnowledgeDataFlow: emptySemanticKnowledgeDataFlow },
        semantic: { variables: [], byVariable: createControllerSemanticVariableIndex([]), returned: [] },
        resourceBindings: [],
    });
}

export function createControllerDataflowContract(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnSet,
    response: ControllerResourceResponseEvidence,
): ControllerDataflowContract {
    const bindings = relationExpand(
        returned.expressions,
        item => relationGate(Object.is(item.kind, 'present'), () => collectResourceBindings(item.value, ast, parameters, response), () => []),
    );
    return Object.freeze({
        ast,
        semantic: buildSemanticDataflow(ast, parameters, returned),
        resourceBindings: Object.freeze(bindings),
    });
}

function buildSemanticDataflow(
    ast: ControllerDataflowAst,
    parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnSet,
): ControllerSemanticDataflow {
    const model = ast.semanticKnowledgeDataFlow;
    const definitions = relationExpand(model.facts, fact => relationGate(Object.is(fact.kind, 'binding'), () => {
        const binding = fact.value;
        const name = identifierFromKnowledge(model, binding.variable);
        const payload = relationOptionFold(
            relationFold(ast.definitions, { kind: 'none' as const } as { kind: 'none' } | { kind: 'some'; value: typeof ast.definitions[number] }, (current, definition) =>
                relationGate(Object.is(current.kind, 'some'), () => current, () => ({
                    kind: relationGate(relationAll([
                        Object.is(definition.name, name),
                        Object.is(definition.value.source.startOffset, binding.source.span.start.value),
                        Object.is(definition.value.source.endOffset, binding.source.span.end.value),
                    ]), () => 'some' as const, () => 'none' as const),
                    value: definition,
                }))),
            () => [],
            payload => [Object.freeze({
                variable: SemanticValueFactory.variableName(name),
                origin: semanticDefinitionOrigin(binding, payload),
                value: payload.value,
                expression: resolveAstValueToExpression(payload.value),
                semantic: payload.semantic,
                availability: binding.availability,
            })],
        );
        return definitions;
    }, () => []));

    const variables = relationFold<ControllerSemanticVariableDefinition, RelationIndex<string, ControllerSemanticVariableDefinition[]>>(definitions, [] as RelationIndex<string, ControllerSemanticVariableDefinition[]>, (current, definition) => {
        const key = definition.variable.value.value;
        const existing = relationIndexLookup(current, key);
        const entries = relationOptionFold(existing, () => [definition], value => [...value, definition]);
        return relationIndexAdd(current, key, entries);
    });

    const parameterBindings = relationProject(parameters, parameter => Object.freeze({
        variable: SemanticValueFactory.variableName(parameter.name),
        definitions: Object.freeze([]),
    }));
    const discoveredBindings = relationProject(variables, ([name, entries]) => Object.freeze({
        variable: SemanticValueFactory.variableName(name),
        definitions: Object.freeze(entries),
    }));
    const bindings = relationExpand([...parameterBindings, ...discoveredBindings], binding => relationGate(
        relationAll([
            binding.definitions.length > 0,
            relationProject(parameters, parameter => parameter.name).includes(binding.variable.value.value),
        ]),
        () => [binding],
        () => relationGate(binding.definitions.length > 0, () => [binding], () => relationGate(relationAny(relationProject(parameterBindings, item => Object.is(item.variable.value.value, binding.variable.value.value))), () => [binding], () => [])),
    ));

    const returnedExpressions = relationProject(returned.expressions, item => relationGate(
        Object.is(item.kind, 'present'),
        () => ({ kind: 'expression' as const, expression: resolveAstValueToExpression(item.value) }),
        () => ({ kind: 'absent' as const }),
    ));
    const frozenBindings = Object.freeze(bindings);
    return Object.freeze({
        variables: frozenBindings,
        byVariable: createControllerSemanticVariableIndex(frozenBindings),
        returned: Object.freeze(returnedExpressions),
    });
}

function identifierFromKnowledge(model: SemanticKnowledgeDataFlow, id: KnowledgeId): string {
    const key = relationOptionFold(
        relationFold(model.facts, { kind: 'none' as const } as { kind: 'none' } | { kind: 'some'; value: typeof model.facts[number] }, (current, item) =>
            relationGate(Object.is(current.kind, 'some'), () => current, () => relationGate(Object.is(knowledgeIdKey(item.value.id), knowledgeIdKey(id)), () => ({ kind: 'some' as const, value: item }), () => current))),
        () => id.identity.slot.value,
        item => relationGate(relationAll([Object.is(item.kind, 'value'), Object.is(item.value.name.kind, 'present')]), () => item.value.name.value.value.value, () => id.identity.slot.value),
    );
    return key;
}

function semanticDefinitionOrigin(binding: SemanticBinding, payload: { readonly statementIndex: number; readonly name: string }): ControllerSemanticDefinitionOrigin {
    const candidates = [
        { id: 'iteration', value: { kind: 'foreach' as const, statementIndex: payload.statementIndex }, requirements: [requirement('iteration-origin', Object.is(binding.origin.code, 'iteration'))] },
        { id: 'exception', value: { kind: 'catch' as const, statementIndex: payload.statementIndex }, requirements: [requirement('exception-origin', Object.is(binding.origin.code, 'exception_handler'))] },
        { id: 'parameter', value: { kind: 'parameter' as const, variable: SemanticValueFactory.variableName(payload.name) }, requirements: [requirement('parameter-origin', Object.is(binding.origin.code, 'parameter'))] },
        { id: 'assignment', value: { kind: 'assignment' as const, statementIndex: payload.statementIndex }, requirements: [requirement('assignment-origin', Object.is(binding.origin.code, 'assignment'))] },
    ];
    return relationOptionFold(solveCandidate(candidates), () => ({ kind: 'assignment' as const, statementIndex: payload.statementIndex }), value => value);
}

function collectResourceBindings(value: PhpAstValue, ast: ControllerDataflowAst, parameters: readonly ControllerParameterAst[], response: ControllerResourceResponseEvidence): readonly ControllerResourceBinding[] {
    const semanticIndex = createSemanticVariableIndex(ast, parameters);
    return collectResourceBindingsWithIndex(value, semanticIndex, response);
}

function createSemanticVariableIndex(ast: ControllerDataflowAst, parameters: readonly ControllerParameterAst[]): ControllerSemanticVariableIndex {
    return buildSemanticDataflow(ast, parameters, { expressions: [] }).byVariable;
}

function collectResourceBindingsWithIndex(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex, response: ControllerResourceResponseEvidence): readonly ControllerResourceBinding[] {
    const direct = relationGate(relationAny([Object.is(value.kind, 'resource_single'), Object.is(value.kind, 'resource_collection')]), () => {
        const model = resolveModelOrigin(value.argument, semanticIndex);
        return relationGate(relationAll([Object.is(model.kind, 'found'), Object.is(response.kind, 'present')]), () => [{ resourceName: SemanticValueFactory.resourceName(value.resourceName), model: model.value, response: response.response, source: value.source }], () => []);
    }, () => []);

    const collection = relationGate(relationAll([Object.is(value.kind, 'static_call'), Object.is(value.method, 'collection')]), () => {
        const argument = relationGate(value.arguments.length > 0, () => ({ kind: 'some' as const, value: value.arguments[0] }), () => ({ kind: 'none' as const }));
        return relationOptionFold(argument, () => [], item => relationGate(Object.is(item.kind, 'positional'), () => {
            const model = resolveModelOrigin(item.value, semanticIndex);
            return relationGate(relationAll([Object.is(model.kind, 'found'), Object.is(response.kind, 'present')]), () => [{ resourceName: SemanticValueFactory.resourceName(value.className), model: model.value, response: response.response, source: value.source }], () => []);
        }, () => []));
    }, () => []);

    const nested = relationGate(Object.is(value.kind, 'method_chain'), () => [
        ...relationExpand(value.arguments, argument => collectResourceBindingsWithIndex(argument.value, semanticIndex, response)),
        ...collectResourceBindingsWithIndex(value.receiver, semanticIndex, response),
    ], () =>
        relationGate(Object.is(value.kind, 'function_call'), () => relationExpand(value.arguments, argument => collectResourceBindingsWithIndex(argument.value, semanticIndex, response)), () =>
            relationGate(Object.is(value.kind, 'nested_array'), () => relationExpand(value.entries, entry => collectResourceBindingsWithIndex(entry.value, semanticIndex, response)), () =>
                relationGate(Object.is(value.kind, 'ternary_expression'), () => relationExpand([value.trueBranch, value.falseBranch], branch => collectResourceBindingsWithIndex(branch, semanticIndex, response)), () =>
                    relationGate(Object.is(value.kind, 'null_coalesce'), () => relationExpand([value.left, value.right], branch => collectResourceBindingsWithIndex(branch, semanticIndex, response)), () =>
                        relationGate(Object.is(value.kind, 'method_chain'), () => collectResourceBindingsWithIndex(value.receiver, semanticIndex, response), () => []))))));

    return [...direct, ...collection, ...nested];
}

function resolveModelOrigin(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex): Lookup<ControllerModelOrigin> {
    return relationGate(Object.is(value.kind, 'variable_reference'), () => {
        const result = lookupControllerSemantic(semanticIndex, SemanticValueFactory.variableName(value.name));
        return relationGate(relationAll([Object.is(result.kind, 'found'), Object.is(result.value.kind, 'model_origin')]), () => ({ kind: 'found' as const, value: toDomainModelOrigin(result.value.origin) }), () => ({ kind: 'missing' as const }));
    }, () => relationGate(Object.is(value.kind, 'static_call'), () => ({ kind: 'found' as const, value: resolveStaticCallOrigin(value) }), () => relationGate(Object.is(value.kind, 'method_chain'), () => resolveModelOrigin(value.receiver, semanticIndex), () => ({ kind: 'missing' as const }))));
}

function toDomainModelOrigin(origin: import('../../../../types/upstream/controller').ControllerModelOrigin): ControllerModelOrigin {
    return relationGate(Object.is(origin.kind, 'table'), () => ({ kind: 'table' as const, name: SemanticValueFactory.tableName(origin.name.value.value) }), () => ({ kind: 'model_class' as const, name: SemanticValueFactory.modelName(origin.name.value.value) }));
}

function resolveStaticCallOrigin(value: Extract<PhpAstValue, { kind: 'static_call' }>): ControllerModelOrigin {
    const tableCandidate = relationGate(relationAll([Object.is(value.className, 'DB'), Object.is(value.method, 'table')]), () => {
        const argument = relationGate(value.arguments.length > 0, () => ({ kind: 'some' as const, value: value.arguments[0] }), () => ({ kind: 'none' as const }));
        return relationOptionFold(argument, () => ({ kind: 'model_class' as const, name: SemanticValueFactory.modelName(value.className) }), item => relationGate(relationAll([Object.is(item.kind, 'positional'), Object.is(item.value.kind, 'literal'), Object.is(item.value.literalType, 'string')]), () => ({ kind: 'table' as const, name: SemanticValueFactory.tableName(item.value.value) }), () => ({ kind: 'model_class' as const, name: SemanticValueFactory.modelName(value.className) })));
    }, () => ({ kind: 'model_class' as const, name: SemanticValueFactory.modelName(value.className) }));
    return tableCandidate;
}
