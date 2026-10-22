import type { PhpAstValue, PhpClassReferenceSourceEvidence } from '../../lexer/phpAstTypes';
import type { PhpArgument } from '../../lexer/phpAstExpressionTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { ResourceName, VariableName } from '../../../../types/domain/semanticValues';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { Lookup } from '../../../../types/upstream/collections';
import type { ControllerModelOrigin, ControllerResponseReferenceJudgment, ControllerVariableBinding, ControllerVariableDefinition, ControllerSemanticVariableFlow } from '../../../../types/upstream/controller';
import type { ControllerVariableSemanticJudgment } from '../../../../types/upstream/controllerVariableSemanticInterface';
import type { ControllerStaticCallModelClassIdentity, ControllerStaticCallOriginInput, ControllerStaticCallTableArgumentEvidence, ControllerStaticCallClassNameResolutionContextEvidence } from '../../../../types/upstream/controllerStaticCallOriginInterface';
import type { ControllerResourceBindingAuthorityInterface } from '../../../../types/upstream/controllerResourceBindingInterface';
import type { ControllerResourceBindingCandidate, ControllerResourceBindingJudgment, ControllerResourceModelOriginEvidence } from '../../../../types/upstream/controllerResourceBindingInterface';
import { createClassName, createMethodName } from '../../../../types/upstream/names';
import { stringValue } from '../../../../types/upstream/valueObjects';
import type { Sequence } from '../../../../types/upstream/collections';
export type { ControllerModelOrigin } from '../../../../types/upstream/controller';

import type { ResponseReference } from '../../../../types/upstream/semanticReferences';
import { relationGate, relationFold, relationProject, relationExpand, relationOptionFold, relationNone, relationRefine, relationAny, type RelationOption } from '../../../../semantic/relations/relationalSequence';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../../semantic/relations/relationMembership';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';

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

export const lookupControllerSemanticJudgment = (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
): Lookup<ControllerVariableSemanticJudgment> => relationOptionFold(
    relationIndexLookup(index, variable.value.value),
    () => ({ kind: 'missing' as const }),
    value => latestAvailableSemanticJudgment(value),
);

export const controllerSemanticVariableIndexSize = (index: ControllerSemanticVariableIndex): number => index.length;

function latestAvailableSemanticJudgment(binding: ControllerVariableBinding): Lookup<ControllerVariableSemanticJudgment> {
    const judgment = relationFold<ControllerVariableDefinition, RelationOption<ControllerVariableSemanticJudgment>>(
        sequenceToArray(binding.definitions),
        relationNone<ControllerVariableSemanticJudgment>(),
        (_current, definition) => ({ kind: 'some' as const, value: definition.semanticResolution }),
    );
    return relationOptionFold(
        judgment,
        () => ({ kind: 'missing' as const }),
        value => ({ kind: 'found' as const, value }),
    );
}

export interface ControllerDataflowContract {
    readonly semantic: ControllerSemanticVariableFlow;
    readonly resourceBindings: readonly ControllerResourceBinding[];
}

export function emptyControllerDataflowContract(): ControllerDataflowContract {
    return Object.freeze({
        semantic: { variables: { kind: 'empty' as const } },
        resourceBindings: [],
    });
}

export interface ControllerDataflowContractInput {
    readonly evidence: ControllerDataflowAst;
    readonly returned: ControllerReturnSet;
    readonly response: ControllerResponseReferenceJudgment;
    readonly modelClasses: readonly ControllerStaticCallModelClassIdentity[];
    readonly classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence;
    readonly resourceBindingAuthority: ControllerResourceBindingAuthorityInterface;
}

export function createControllerDataflowContract(input: ControllerDataflowContractInput): ControllerDataflowContract {
    const semantic = buildSemanticDataflow(input.evidence);
    const bindings = relationExpand(
        input.returned.expressions,
        item => relationOptionFold(relationRefine(item, (candidate): candidate is Extract<ControllerReturnExpression, { readonly kind: 'present' }> => relationEqual(candidate.kind, 'present')), () => [], candidate => collectResourceBindings(candidate.value, input.evidence.semanticVariables, input.response, input.modelClasses, input.classNameResolutionContextEvidence, input.resourceBindingAuthority)),
    );
    return Object.freeze({
        semantic,
        resourceBindings: Object.freeze(bindings),
    });
}

function buildSemanticDataflow(evidence: ControllerDataflowAst): ControllerSemanticVariableFlow {
    return evidence.semanticVariables;
}

function collectResourceBindings(value: PhpAstValue, semanticVariables: ControllerSemanticVariableFlow, response: ControllerResponseReferenceJudgment, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence, resourceBindingAuthority: ControllerResourceBindingAuthorityInterface): readonly ControllerResourceBinding[] {
    const semanticIndex = createControllerSemanticVariableIndex(sequenceToArray(semanticVariables.variables));
    return collectResourceBindingsWithIndex(value, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority);
}

function sequenceToArray<T>(value: Sequence<T>, output: readonly T[] = []): readonly T[] {
    return relationOptionFold(relationRefine(value, (candidate): candidate is Extract<Sequence<T>, { readonly kind: 'cons' }> => relationEqual(candidate.kind, 'cons')), () => output, current => sequenceToArray(current.tail, [...output, current.head]));
}

function collectResourceBindingsWithIndex(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex, response: ControllerResponseReferenceJudgment, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence, resourceBindingAuthority: ControllerResourceBindingAuthorityInterface): readonly ControllerResourceBinding[] {
    const judgment = resourceBindingAuthority.judge(resourceBindingCandidate(value, semanticIndex, response, modelClasses, classNameResolutionContextEvidence));
    const direct = relationOptionFold(
        relationRefine(judgment, (candidate): candidate is Extract<ControllerResourceBindingJudgment, { readonly kind: 'resolved' }> => relationEqual(candidate.kind, 'resolved')),
        () => [],
        resolved => [{ resourceName: resolved.resourceName, model: resolved.model, response: resolved.response, source: value.source }],
    );

    const nested = relationGate(Object.is(value.kind, 'method_chain'), () => [
        ...relationExpand(value.arguments, argument => collectResourceBindingsWithIndex(argument.value, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority)),
        ...collectResourceBindingsWithIndex(value.receiver, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority),
    ], () =>
        relationGate(Object.is(value.kind, 'function_call'), () => relationExpand(value.arguments, argument => collectResourceBindingsWithIndex(argument.value, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority)), () =>
            relationGate(Object.is(value.kind, 'nested_array'), () => relationExpand(value.entries, entry => collectResourceBindingsWithIndex(entry.value, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority)), () =>
                relationGate(Object.is(value.kind, 'ternary_expression'), () => relationExpand([value.trueBranch, value.falseBranch], branch => collectResourceBindingsWithIndex(branch, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority)), () =>
                    relationGate(Object.is(value.kind, 'null_coalesce'), () => relationExpand([value.left, value.right], branch => collectResourceBindingsWithIndex(branch, semanticIndex, response, modelClasses, classNameResolutionContextEvidence, resourceBindingAuthority)), () => [])))));

    return [...direct, ...nested];
}

/** Converts AST node shape into candidate evidence; semantic applicability is owned by the upstream authority. */
function resourceBindingCandidate(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex, response: ControllerResponseReferenceJudgment, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence): ControllerResourceBindingCandidate {
    const directResource = relationRefine(
        value,
        (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'resource_single' | 'resource_collection' }> => relationAny([
            relationEqual(candidate.kind, 'resource_single'),
            relationEqual(candidate.kind, 'resource_collection'),
        ]),
    );
    return relationOptionFold(
        directResource,
        () => {
            const staticCall = relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'static_call' }> => relationEqual(candidate.kind, 'static_call'));
            return relationOptionFold(
                staticCall,
                () => ({ kind: 'other_expression' as const }),
                candidate => ({
                    kind: 'static_call' as const,
                    resourceName: SemanticValueFactory.resourceName(candidate.classReference.terminalName),
                    methodName: createMethodName(candidate.method),
                    argument: staticCollectionModelOriginEvidence(candidate.arguments, semanticIndex, modelClasses, classNameResolutionContextEvidence),
                    response,
                }),
            );
        },
        candidate => ({
            kind: 'direct_resource' as const,
            resourceName: SemanticValueFactory.resourceName(candidate.resourceName),
            modelOrigin: modelOriginEvidence(candidate.argument, semanticIndex, modelClasses, classNameResolutionContextEvidence),
            response,
        }),
    );
}

function staticCollectionModelOriginEvidence(argumentsList: readonly PhpArgument[], semanticIndex: ControllerSemanticVariableIndex, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence): Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>['argument'] {
    const firstArgument = argumentsList[0];
    return relationGate(
        firstArgument !== undefined,
        () => relationGate(
            Object.is(firstArgument.kind, 'positional'),
            () => ({ kind: 'positional' as const, modelOrigin: modelOriginEvidence(firstArgument.value, semanticIndex, modelClasses, classNameResolutionContextEvidence) }),
            () => ({ kind: 'unsupported_argument_shape' as const }),
        ),
        () => ({ kind: 'absent' as const }),
    );
}

/** Preserves upstream semantic judgments as evidence; it does not interpret their outcomes. */
function modelOriginEvidence(value: PhpAstValue, semanticIndex: ControllerSemanticVariableIndex, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence): ControllerResourceModelOriginEvidence {
    const variableReference = relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'variable_reference' }> => relationEqual(candidate.kind, 'variable_reference'));
    return relationOptionFold(
        variableReference,
        () => {
            const staticCall = relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'static_call' }> => relationEqual(candidate.kind, 'static_call'));
            return relationOptionFold(
                staticCall,
                () => {
                    const methodChain = relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'method_chain' }> => relationEqual(candidate.kind, 'method_chain'));
                    return relationOptionFold(
                        methodChain,
                        () => ({ kind: 'unsupported_expression' as const }),
                        candidate => ({ kind: 'method_chain_receiver' as const, receiver: modelOriginEvidence(candidate.receiver, semanticIndex, modelClasses, classNameResolutionContextEvidence) }),
                    );
                },
                candidate => ({ kind: 'static_call_origin_input' as const, input: staticCallOriginInput(candidate, modelClasses, classNameResolutionContextEvidence) }),
            );
        },
        candidate => relationOptionFold(
            lookupControllerSemanticJudgment(semanticIndex, SemanticValueFactory.variableName(candidate.name)),
            () => ({ kind: 'variable_semantic_missing' as const }),
            judgment => ({ kind: 'variable_semantic_judgment' as const, judgment }),
        ),
    );
}

function staticCallOriginInput(value: Extract<PhpAstValue, { kind: 'static_call' }>, modelClasses: readonly ControllerStaticCallModelClassIdentity[], classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence): ControllerStaticCallOriginInput {
    return Object.freeze({
        kind: 'controller_static_call_origin_input',
        classReference: classReferenceEvidence(value.classReference),
        classNameResolutionContext: classNameResolutionContextEvidence,
        methodName: createMethodName(value.method),
        tableArgument: staticCallTableArgumentEvidence(value.arguments),
        modelClasses,
    });
}

function classReferenceEvidence(evidence: PhpClassReferenceSourceEvidence): ControllerStaticCallOriginInput['classReference'] {
    switch (evidence.kind) {
        case 'simple_name':
            return Object.freeze({ kind: 'simple_name', name: createClassName(evidence.sourceName) });
        case 'qualified_name':
            return Object.freeze({ kind: 'qualified_name', sourceName: createClassName(evidence.sourceName), form: evidence.form });
    }
}

function staticCallTableArgumentEvidence(argumentsList: readonly PhpArgument[]): ControllerStaticCallTableArgumentEvidence {
    const firstArgument = argumentsList[0];
    return relationGate(
        firstArgument !== undefined,
        () => staticCallArgumentEvidence(firstArgument),
        () => ({ kind: 'absent' as const }),
    );
}

function staticCallArgumentEvidence(argument: PhpArgument): ControllerStaticCallTableArgumentEvidence {
    const positional = relationRefine(argument, (candidate): candidate is Extract<PhpArgument, { readonly kind: 'positional' }> => relationEqual(candidate.kind, 'positional'));
    return relationOptionFold(
        positional,
        () => ({ kind: 'unsupported_argument_shape' as const }),
        value => staticCallPositionalValueEvidence(value.value),
    );
}

function staticCallPositionalValueEvidence(value: PhpAstValue): ControllerStaticCallTableArgumentEvidence {
    const literal = relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'literal' }> => relationEqual(candidate.kind, 'literal'));
    return relationOptionFold(
        literal,
        () => ({ kind: 'unsupported_argument_shape' as const }),
        candidate => relationOptionFold(
            relationRefine(candidate, (item): item is Extract<PhpAstValue, { readonly kind: 'literal' }> & { readonly literalType: 'string' } => relationEqual(item.literalType, 'string')),
            () => ({ kind: 'unsupported_argument_shape' as const }),
            stringLiteral => ({ kind: 'positional_string_literal' as const, value: stringValue(stringLiteral.value) }),
        ),
    );
}
