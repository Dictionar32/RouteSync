import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { ResourceName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { Lookup } from '../../../../types/upstream/collections';
import type { ControllerModelOrigin, ControllerVariableSemantic, ControllerVariableBinding } from '../../../../types/upstream/controller';
import type { Sequence } from '../../../../types/upstream/collections';
export type { ControllerModelOrigin } from '../../../../types/upstream/controller';

import type { ResponseReference } from '../../../../types/upstream/semanticReferences';
import { relationGate, relationFold, relationProject, relationExpand, relationOptionFold, relationRefine, relationAll, relationAny } from '../../../../semantic/kernel/relationalSequence';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { solveCandidate, requirement } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';

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

export type ControllerSemanticVariableIndex = RelationIndex<string, ControllerVariableBinding>;

export const createControllerSemanticVariableIndex = (bindings: readonly ControllerVariableBinding[]): ControllerSemanticVariableIndex =>
    Object.freeze(relationFold(bindings, [] as RelationIndex<string, ControllerVariableBinding>, (lookup, binding) =>
        relationIndexAdd(lookup, binding.variable.value.value, binding)));

export const lookupControllerSemanticVariable = (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
): Lookup<ControllerVariableBinding> => relationOptionFold(
    relationIndexLookup(index, variable.value.value),
    () => ({ kind: 'missing' as const }),
    value => ({ kind: 'found' as const, value }),
);

export const lookupControllerSemantic = (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
): Lookup<ControllerVariableSemantic> => relationOptionFold(
    relationIndexLookup(index, variable.value.value),
    () => ({ kind: 'missing' as const }),
    value => latestAvailableSemantic(value),
);

export const controllerSemanticVariableIndexSize = (index: ControllerSemanticVariableIndex): number => index.length;

function latestAvailableSemantic(binding: ControllerVariableBinding): Lookup<ControllerVariableSemantic> {
    return relationOptionFold(
        relationFold(sequenceToArray(binding.definitions), { kind: 'none' as const } as { kind: 'none' } | { kind: 'some'; value: ControllerVariableSemantic }, (current, definition) =>
            relationGate(Object.is(current.kind, 'some'), () => current, () => ({ kind: 'some' as const, value: definition.semantic })),
        ),
        () => ({ kind: 'missing' as const }),
        value => ({ kind: 'found' as const, value }),
    );
}

export interface ControllerDataflowContract {
    readonly semantic: { readonly variables: Sequence<ControllerVariableBinding> };
    readonly resourceBindings: readonly ControllerResourceBinding[];
}

export function emptyControllerDataflowContract(): ControllerDataflowContract {
    return Object.freeze({
        semantic: { variables: { kind: 'empty' as const } },
        resourceBindings: [],
    });
}

export function createControllerDataflowContract(
    evidence: ControllerDataflowAst,
    _parameters: readonly ControllerParameterAst[],
    returned: ControllerReturnSet,
    response: ControllerResourceResponseEvidence,
    _sourceFile = '<scanner>',
): ControllerDataflowContract {
    const semantic = buildSemanticDataflow(evidence);
    const bindings = relationExpand(
        returned.expressions,
        item => relationOptionFold(relationRefine(item, (candidate): candidate is Extract<ControllerReturnExpression, { readonly kind: 'present' }> => relationEqual(candidate.kind, 'present')), () => [], candidate => collectResourceBindings(candidate.value, evidence.semanticVariables, response)),
    );
    return Object.freeze({
        semantic,
        resourceBindings: Object.freeze(bindings),
    });
}

function buildSemanticDataflow(evidence: ControllerDataflowAst): { readonly variables: Sequence<ControllerVariableBinding> } {
    return evidence.semanticVariables;
}

function collectResourceBindings(value: PhpAstValue, semanticVariables: { readonly variables: Sequence<ControllerVariableBinding> }, response: ControllerResourceResponseEvidence): readonly ControllerResourceBinding[] {
    const semanticIndex = createControllerSemanticVariableIndex(sequenceToArray(semanticVariables.variables));
    return collectResourceBindingsWithIndex(value, semanticIndex, response);
}

function sequenceToArray<T>(value: Sequence<T>, output: readonly T[] = []): readonly T[] {
    return relationOptionFold(relationRefine(value, (candidate): candidate is Extract<Sequence<T>, { readonly kind: 'cons' }> => relationEqual(candidate.kind, 'cons')), () => output, current => sequenceToArray(current.tail, [...output, current.head]));
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
