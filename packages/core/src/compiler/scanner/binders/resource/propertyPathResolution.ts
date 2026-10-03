import { scannerSemanticType } from '../../../semanticTypeConstructionRelations';
import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { NullableType, type SemanticType } from "../../../types/SemanticType";
import { collectMembers, relationCardinality } from "./propertyPathBindingSupport";
import { resolveResourceMethodInvocation, type ResourceQueryState, type ResourceMethodResult } from "../../../../types/domain/resourceModelMethodSurface";
import type { ResourcePropertyPathResult, ResourcePropertyPathStep } from "../../../../types/domain/resourcePropertyPathModel";
import type { PhpAstValue } from "../../lexer/PhpAst";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import { resolveAstValueToExpression } from "../../subscanners/resource/resourceAstExpressionMapper";
import { matchLookup } from "../../../../types/upstream/collections";
import { createPropertyName } from "../../../../types/upstream/names";
import { relationFold, relationOptionFold, relationProject, relationResolve, relationSome, relationNone, type RelationOption } from "../../../../semantic/kernel/relationalSequence";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;
type ResultOption = { readonly kind: 'none' } | { readonly kind: 'some'; readonly value: SemanticType };
type PathState = {
    readonly model: OriginModelSymbol;
    readonly query: ResourceQueryState;
    readonly steps: readonly ResourcePropertyPathStep[];
    readonly result: ResultOption;
    readonly terminal: RelationOption<ResourcePropertyPathResult>;
};
type Transition = { readonly kind: 'continue'; readonly state: PathState } | { readonly kind: 'reject'; readonly result: ResourcePropertyPathResult };

const terminalNone = (): RelationOption<ResourcePropertyPathResult> => relationNone();
const terminalSome = (value: ResourcePropertyPathResult): RelationOption<ResourcePropertyPathResult> => relationSome(value);

const some = (value: SemanticType): ResultOption => ({ kind: 'some', value });
const none = (): ResultOption => ({ kind: 'none' });

const MODEL_RESULT_KINDS: Readonly<Record<ResourceMethodResult['kind'], boolean>> = Object.freeze({
    query_builder: false, single_model: true, model_collection: true, paginated_collection: true, scalar: false, value_collection: false, unsupported: false,
});
const isModelResult = (result: ResourceMethodResult): result is Extract<ResourceMethodResult, { kind: 'single_model' | 'model_collection' | 'paginated_collection' }> => MODEL_RESULT_KINDS[result.kind];

const accessType = (member: Member, type: SemanticType): SemanticType =>
    matchPhpAccessMode(member.access, {
        direct: () => type,
        nullsafe: () => relationResolve(type.isNullable(), () => type, () => scannerSemanticType.nullable(type)),
    });

const methodTransition = (
    member: Extract<Member, { kind: 'method_chain' }>,
    current: PathState,
    table: ModelSymbolTable,
    terminal: boolean,
): Transition => {
    const invocation = resolveResourceMethodInvocation(
        current.query,
        SemanticValueFactory.methodName(member.property),
        relationProject(member.arguments, argument => resolveAstValueToExpression(argument.value)),
    );
    return relationResolve(
        Object.is(invocation.result.kind, 'unsupported'),
        () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'missing_property' } }),
        () => {
            const result = invocation.result;
            const step: ResourcePropertyPathStep = {
                kind: 'method',
                sourceModel: current.model.node.definition.semantic,
                method: SemanticValueFactory.methodName(member.property),
                access: member.access,
                result,
                type: result.semanticType,
                cardinality: result.cardinality,
            };
            const next = relationResolve(
                Object.is(result.kind, 'query_builder'),
                () => ({
                    kind: 'continue',
                    state: { ...current, query: result, steps: [...current.steps, step], result: some(result.semanticType) },
                }),
                () => relationResolve(
                    isModelResult(result),
                    () => relationResolve(
                        terminal,
                        () => ({
                            kind: 'continue',
                            state: {
                                ...current,
                                steps: [...current.steps, step],
                                result: some(result.semanticType),
                                query: { kind: 'model_instance', model: result.model },
                            },
                        }),
                        () => matchLookup(table.get(result.model.identity.name), {
                            missing: () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'missing_target_model' } }),
                            found: ({ value }) => ({
                                kind: 'continue',
                                state: {
                                    ...current,
                                    model: value,
                                    query: { kind: 'model_instance', model: result.model },
                                    steps: [...current.steps, step],
                                    result: some(result.semanticType),
                                },
                            }),
                        }),
                    ),
                    () => relationResolve(
                        terminal,
                        () => ({
                            kind: 'continue',
                            state: { ...current, steps: [...current.steps, step], result: some(result.semanticType) },
                        }),
                        () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'non_terminal_scalar' } }),
                    ),
                ),
            );
            return next;
        },
    );
};

const propertyTransition = (
    member: Extract<Member, { kind: 'property_access' }>,
    current: PathState,
    table: ModelSymbolTable,
    terminal: boolean,
): Transition => {
    const binding = current.model.resolveProperty(createPropertyName(member.property));
    return relationResolve(
        Object.is(binding.kind, 'missing'),
        () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'missing_property' } }),
        () => {
            const property = binding.value;
            const type = accessType(member, property.semanticType);
            return relationResolve(
                Object.is(property.kind, 'relation'),
                () => matchLookup(table.get(property.source.targetModel), {
                    missing: () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'missing_target_model' } }),
                    found: ({ value }) => {
                        const step: ResourcePropertyPathStep = {
                            kind: 'relation',
                            sourceModel: current.model.node.definition.semantic,
                            property: property.source.property,
                            access: member.access,
                            semantic: property.source,
                            type,
                            targetModel: value.node.definition.semantic,
                            cardinality: relationCardinality(property.source.cardinality),
                        };
                        return {
                            kind: 'continue',
                            state: {
                                ...current,
                                model: value,
                                query: { kind: 'model_instance', model: value.node.definition.semantic },
                                steps: [...current.steps, step],
                                result: some(type),
                            },
                        };
                    },
                }),
                () => relationResolve(
                    terminal,
                    () => {
                        const step: ResourcePropertyPathStep = {
                            kind: 'property',
                            sourceModel: current.model.node.definition.semantic,
                            property: property.source.property,
                            access: member.access,
                            semantic: property.source,
                            type,
                            cardinality: { kind: 'single' },
                        };
                        return { kind: 'continue', state: { ...current, steps: [...current.steps, step], result: some(type) } };
                    },
                    () => ({ kind: 'reject', result: { kind: 'rejected', reason: 'non_terminal_scalar' } }),
                ),
            );
        },
    );
};

const MEMBER_HANDLERS: Readonly<Record<Member['kind'], (member: Member, current: PathState, table: ModelSymbolTable, terminal: boolean) => Transition>> = Object.freeze({
    method_chain: methodTransition as (member: Member, current: PathState, table: ModelSymbolTable, terminal: boolean) => Transition,
    property_access: propertyTransition as (member: Member, current: PathState, table: ModelSymbolTable, terminal: boolean) => Transition,
});
const transitionMember = (member: Member, current: PathState, table: ModelSymbolTable, terminal: boolean): Transition => MEMBER_HANDLERS[member.kind](member, current, table, terminal);

export function resolvePropertyPath(value: Member, rootModel: OriginModelSymbol, table: ModelSymbolTable): ResourcePropertyPathResult {
    const members = collectMembers(value);
    const initial: PathState = {
        model: rootModel,
        query: { kind: 'model_instance', model: rootModel.node.definition.semantic },
        steps: [],
        result: none(),
        terminal: terminalNone(),
    };
    const final = relationFold(members, initial, (state, member, index) => {
        const terminal = Object.is(index, members.length - 1);
        const transition = transitionMember(member, state, table, terminal);
        return relationResolve(Object.is(transition.kind, 'reject'), () => ({ ...state, terminal: terminalSome(transition.result) }), () => transition.state);
    });
    return relationOptionFold(
        final.terminal,
        () => relationOptionFold(
            final.result,
            () => ({ kind: 'rejected', reason: 'missing_property' }),
            type => ({ kind: 'resolved', rootModel: rootModel.node.definition.semantic, steps: Object.freeze(final.steps), type }),
        ),
        value => value,
    );
}
