import { createPropertyName } from '../../../../types/upstream/names';
/**
 * resourceBinder.ts
 *
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 *
 * @module core/compiler/scanner/binders/resource/resourceBinder
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { PhpStatement } from "../../lexer/phpAstTypes";
import { resolveAstValueToExpression } from "../../subscanners/resource/resourceAstExpressionMapper";
import type { PhpArrayEntry } from "../../lexer/PhpAst";
import { sourceSpanFromRange } from "../../subscanners/resource/resourceUpstreamExpressionMappings";
import type { ResourceDefinition, ResourceField, ResourceFieldMeaning, ResourceFieldOutput, ResourceTransformation, ResourceInheritance, ResourceDocumentation, ResourceRepresentation, ResourceFieldPresence } from "../../../../types/upstream/resource";
import type { ResourceOperation, ResourceOperationValue, ResourceOperationDefault } from "../../../../types/upstream/resourceVocabulary";
import { createDomainAstJudgment, type ResourceAst } from "../../../../types/upstream/ast";
import type { Expression, ResolvedExpression } from "../../../../types/upstream/expression";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";
import type { Presence } from "../../../../types/upstream/primitiveVocabulary";
import type { PropertyName, ResponseTypeName, ModelName, VariableName, RelationName } from "../../../../types/upstream/names";
import type { PropertyType } from "../../../../types/upstream/property";
import type { ModelReference, ResourceReference, ResponseReference, PropertyReference } from "../../../../types/upstream/semanticReferences";
import { mapResourcePhpStatementsToSourceStatements } from "../../subscanners/resource/resourceUpstreamExpressionCanonical";
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from "../../subscanners/resource/resourceUpstreamExpressionMappings";
import { resourceOperationKindForMethod } from "../../../../types/upstream/resourceVocabulary";
import type { StringValue, TruthValue } from "../../../../types/upstream/valueObjects";
import type { Sequence, Properties, Assignments, ResourceActions, RoutePaths } from "../../../../types/upstream/collections";
import { semanticType } from "../../subscanners/model/semanticTypeCanonical";
import type { ResourceName, SourceFile } from "../../../../types/upstream/names";
import { produceResourceField } from "../../subscanners/resource/resourceFieldProducer";
import { relationAll, relationAny, relationEqual, relationGate, relationOptionFold, relationFirstOption, relationOptionMap, relationProject, relationExpand, relationSelect, relationFoldRight, relationRefine, relationResolve, relationNone, relationSome, type RelationVariant } from "../../../../semantic/kernel/relationalSequence";
import { solveCandidate, solveRewriteCandidate } from "../../../../semantic/kernel/semanticDecisionRewriteEngine";

/**
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 */
const str = (value: string): StringValue => ({ kind: 'string_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (head, tail) => ({ kind: 'cons', head, tail }));
const modelRef = (value: string): ModelReference => ({ kind: 'model_reference', name: { kind: 'model_name', value: str(value) } });
const resourceRef = (value: string): ResourceReference => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: str(value) } });
const responseRef = (resourceName: ResourceName): ResponseReference => ({
    kind: 'response_reference',
    name: { kind: 'response_type_name', value: str(`${resourceName.value.value}Response`) }
});
const propertyRef = (value: string): PropertyReference => ({ kind: 'property_reference', name: { kind: 'property_name', value: str(value) } });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const responseName = (value: string): ResponseTypeName => ({ kind: 'response_type_name', value: str(value) });
const variableName = (value: string) => ({ kind: 'variable_name' as const, value: str(value) });
const unresolved = () => ({ kind: 'unresolved' as const, reason: 'external' as const });
const emptyActions: ResourceActions = { kind: 'resource_actions', items: seq([]) };
const emptyPaths: RoutePaths = { kind: 'route_paths', items: seq([]) };
const astKind = <K extends import('../../lexer/phpAstTypes').PhpAstValue['kind']>(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    kind: K,
): import('../../../../semantic/kernel/relationalSequence').RelationOption<RelationVariant<import('../../lexer/phpAstTypes').PhpAstValue, K>> =>
    relationRefine(value, (candidate): candidate is RelationVariant<import('../../lexer/phpAstTypes').PhpAstValue, K> => relationEqual(candidate.kind, kind));


function modelRelation(relationName: import('../../../../types/upstream/names').RelationName, model: import('../../../../compiler/scanner/symbols/model/originModelSymbol').OriginModelSymbol) {
    return model.relation(relationName);
}

function operationDefault(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationDefault {
    return relationGate(index < argumentsAst.length,
        () => ({ kind: 'expression', expression: resolveAstValueToExpression(argumentsAst[index].value, file).upstream }),
        () => ({ kind: 'missing_value' }));
}

function operationExpression(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): Expression {
    return relationOptionFold(solveCandidate([
        { id: 'arrow', value: relationGate(relationEqual(value.kind, 'arrow_function'), () => resolveAstValueToExpression(value.body, file).upstream, () => resolveAstValueToExpression(value, file).upstream), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'arrow_function') }] },
        { id: 'closure', value: relationGate(relationEqual(value.kind, 'closure'), () => relationOptionFold(relationFirstOption(value.body.statements, statement => relationEqual(statement.kind, 'return_with_value')), () => resolveAstValueToExpression(value, file).upstream, returned => resolveAstValueToExpression(returned.expression, file).upstream), () => resolveAstValueToExpression(value, file).upstream), requirements: [{ id: 'kind', satisfied: relationEqual(value.kind, 'closure') }] },
        { id: 'fallback', value: resolveAstValueToExpression(value, file).upstream },
    ]), () => resolveAstValueToExpression(value, file).upstream, result => result);
}


function operationValue(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationValue {
    return relationGate(index < argumentsAst.length,
        () => ({ kind: 'expression', expression: operationExpression(argumentsAst[index].value, file) }),
        () => ({ kind: 'implicit_resource_value' }));
}

function relationArgument(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): RelationName {
    return relationGate(index < argumentsAst.length,
        () => relationGate(relationAll([relationEqual(argumentsAst[index].value.kind, 'literal'), relationEqual(argumentsAst[index].value.literalType, 'string')]),
            () => ({ kind: 'relation_name', value: { kind: 'string_value', value: argumentsAst[index].value.value } }),
            () => { throw Error('Resource operation relation must be a literal relation name at the AST boundary'); }),
        () => { throw Error('Resource operation relation argument is missing at the AST boundary'); });
}

function operationForField(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): import('../../../../semantic/kernel/relationalSequence').RelationOption<ResourceFieldOutput> {
    return relationOptionFold(
        astKind(value, 'method_chain'),
        () => ({ kind: 'none' }),
        method => relationOptionMap(
            relationOperationCandidates(method.property, method.arguments, file),
            operation => ({ kind: 'operation', operation }),
        ),
    );
}

function relationOperationCandidates(property: string, argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], file: string) {
    const kind = resourceOperationKindForMethod(property);
    return solveRewriteCandidate([
        { id: 'when_loaded', rewrite: () => ({ kind: 'when_loaded', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_loaded') }] },
        { id: 'when_counted', rewrite: () => ({ kind: 'when_counted', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_counted') }] },
        { id: 'when_exists_loaded', rewrite: () => ({ kind: 'when_exists_loaded', relation: relationArgument(argumentsAst, 0), value: operationValue(argumentsAst, 1, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_exists_loaded') }] },
        { id: 'when_pivot_loaded', rewrite: () => ({ kind: 'when_pivot_loaded', table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(argumentsAst, 0) } }, value: operationExpression(argumentsAst[1].value, file), default: operationDefault(argumentsAst, 2, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_pivot_loaded') }] },
        { id: 'when_pivot_loaded_as', rewrite: () => ({ kind: 'when_pivot_loaded_as', accessor: { kind: 'property_name', value: { kind: 'string_value', value: literalString(argumentsAst, 0) } }, table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(argumentsAst, 1) } }, value: operationExpression(argumentsAst[2].value, file), default: operationDefault(argumentsAst, 3, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_pivot_loaded_as') }] },
        { id: 'when_aggregated', rewrite: () => ({ kind: 'when_aggregated', relation: relationArgument(argumentsAst, 0), column: { kind: 'column_name', value: { kind: 'string_value', value: literalString(argumentsAst, 1) } }, aggregate: aggregateFunction(literalString(argumentsAst, 2)), value: operationValue(argumentsAst, 3, file), default: operationDefault(argumentsAst, 4, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(kind, 'when_aggregated') }] },
    ]);
}

function literalString(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): string {
    return relationGate(index < argumentsAst.length,
        () => relationGate(relationAll([relationEqual(argumentsAst[index].value.kind, 'literal'), relationEqual(argumentsAst[index].value.literalType, 'string')]),
            () => argumentsAst[index].value.value,
            () => { throw Error('Resource operation expects a literal string argument at the AST boundary'); }),
        () => { throw Error('Resource operation literal argument is missing at the AST boundary'); });
}

function aggregateFunction(value: string): import('../../../../types/upstream/resourceVocabulary').ResourceAggregateFunction {
    const resolved = solveCandidate([
        { id: 'avg', value: { kind: 'avg' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'avg') }] },
        { id: 'sum', value: { kind: 'sum' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'sum') }] },
        { id: 'min', value: { kind: 'min' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'min') }] },
        { id: 'max', value: { kind: 'max' }, requirements: [{ id: 'kind', satisfied: relationEqual(value, 'max') }] },
    ]);
    return relationOptionFold(resolved, () => { throw Error(`Unsupported Laravel resource aggregate '${value}' at the AST boundary`); }, result => result);
}

function fieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    return relationOptionFold(operationForField(value, file), () => solveFieldOutput(value, expression, file, resource, model), operation => operation);
}

function solveFieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    const single = relationOptionFold(astKind(value, 'resource_single'), () => relationNone<ResourceFieldOutput>(), node => relationSome({ kind: 'resource', resource: resourceRef(node.resourceName), expression }));
    const collection = relationOptionFold(astKind(value, 'resource_collection'), () => relationNone<ResourceFieldOutput>(), node => relationSome({ kind: 'resource_collection', resource: resourceRef(node.resourceName), expression }));
    const nested = relationOptionFold(astKind(value, 'nested_array'), () => relationNone<ResourceFieldOutput>(), node => relationSome({
        kind: 'nested_object',
        fields: {
            kind: 'resource_fields',
            items: seq(relationExpand(node.entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => [buildResourceField(entry.key.value, entry.value, file, resource, model)], () => []), () => []))),
        },
        dynamicEntries: { kind: 'resource_dynamic_entries', items: seq([]) },
    }));
    return relationOptionFold(single, () => relationOptionFold(collection, () => relationOptionFold(nested, () => ({ kind: 'scalar_or_expression', expression }), result => result), result => result), result => result);
}


function fieldPresence(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): ResourceFieldPresence {
    return relationOptionFold(astKind(value, 'method_chain'), () => ({ kind: 'always_present' }), method => relationOptionFold(
        solveRewriteCandidate([
            { id: 'when_loaded', rewrite: () => ({ kind: 'relation_loaded', relation: relationArgument(method.arguments, 0) }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_loaded') }] },
            { id: 'when_counted', rewrite: () => ({ kind: 'relation_counted', relation: relationArgument(method.arguments, 0) }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_counted') }] },
            { id: 'when_aggregated', rewrite: () => ({ kind: 'relation_aggregated', relation: relationArgument(method.arguments, 0), column: { kind: 'column_name', value: { kind: 'string_value', value: literalString(method.arguments, 1) } }, aggregate: aggregateFunction(literalString(method.arguments, 2)) }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_aggregated') }] },
            { id: 'when_exists_loaded', rewrite: () => ({ kind: 'relation_exists_loaded', relation: relationArgument(method.arguments, 0) }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_exists_loaded') }] },
            { id: 'when_has', rewrite: () => ({ kind: 'attribute_present', attribute: { kind: 'property_name', value: { kind: 'string_value', value: literalString(method.arguments, 0) } } }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_has') }] },
            { id: 'when_appended', rewrite: () => ({ kind: 'attribute_appended', attribute: { kind: 'property_name', value: { kind: 'string_value', value: literalString(method.arguments, 0) } } }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_appended') }] },
            { id: 'when_pivot_loaded', rewrite: () => ({ kind: 'pivot_loaded', table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(method.arguments, 0) } } }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_pivot_loaded') }] },
            { id: 'when_pivot_loaded_as', rewrite: () => ({ kind: 'pivot_loaded_as', accessor: { kind: 'property_name', value: { kind: 'string_value', value: literalString(method.arguments, 0) } }, table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(method.arguments, 1) } } }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), 'when_pivot_loaded_as') }] },
            ...relationExpand(['when_null','when_not_null','when','unless','merge_when','merge_unless'], id => [{ id, rewrite: () => ({ kind: 'conditional', condition: operationExpression(method.arguments[0].value, file) }), requirements: [{ id: 'kind', satisfied: relationEqual(resourceOperationKindForMethod(method.property), id) }] }]),
        ]), () => ({ kind: 'always_present' }), result => result), () => ({ kind: 'always_present' }));
}

function directFieldMeaning(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    expression: Expression,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceFieldMeaning {
    const binding = relationOptionFold(astKind(value, 'property_access'), () => ({ kind: 'missing' as const }), property => relationOptionFold(astKind(property.target, 'variable_reference'), () => ({ kind: 'missing' as const }), () => model.resolveProperty(propertyName(property.property))));
    return relationOptionFold(solveRewriteCandidate([
        { id: 'column', rewrite: () => ({ kind: 'property_projection', property: propertyRef(value.property), model: modelRef(model.name.value.value) }), requirements: [{ id: 'kind', satisfied: relationGate(relationEqual(binding.kind, 'found'), () => relationEqual(binding.value.kind, 'column'), () => false) }] },
        { id: 'relation', rewrite: () => ({ kind: 'relation_projection', relation: propertyRef(value.property), projection: { kind: 'value', expression } }), requirements: [{ id: 'kind', satisfied: relationGate(relationEqual(binding.kind, 'found'), () => relationEqual(binding.value.kind, 'relation'), () => false) }] },
    ]), () => ({ kind: 'computed_projection', expression }), result => result);
}

function directFieldType(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): TypeExpression {
    const binding = relationOptionFold(astKind(value, 'property_access'), () => ({ kind: 'missing' as const }), property => relationOptionFold(astKind(property.target, 'variable_reference'), () => ({ kind: 'missing' as const }), () => model.resolveProperty(propertyName(property.property))));
    return relationGate(relationEqual(binding.kind, 'found'),
        () => semanticType(binding.value.semanticType),
        () => ({ kind: 'error', diagnostic: str('resource_field_type_requires_upstream_typing') }));
}


export function buildResourceField(
    entryKey: string,
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    file: string,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceField {
    return produceResourceField(entryKey, value, file, resource, model);
}

/** Canonical producer: raises bound Resource semantics directly into the existing Resource AST contract. */
export function bindResourceDefinition(params: {
    readonly resourceName: ResourceName;
    readonly entries: readonly PhpArrayEntry[];
    readonly source: SourceSpan;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly knowledgeDataFlow?: import('../../subscanners/resource/resourceModelKnowledgeDataFlow').ResourceModelKnowledgeDataFlow;
    readonly assignments?: readonly PhpStatement[];
    readonly method: import('../../lexer/phpMethodAstTypes').PhpMethodAst;
    readonly baseClass: import('../../../../types/upstream/names').ClassName;
    readonly wrapping: import('../../../../types/upstream/resource').ResourceWrapping;
    readonly requestParameter: import('../../../../types/upstream/names').VariableName;
    readonly documentationMixins: readonly import('../../../../types/upstream/semanticReferences').ModelReference[];
}): ResourceAst {
    const { resourceName, entries, source, modelSymbolTable, knowledgeDataFlow, assignments = [], method, baseClass, wrapping, requestParameter, documentationMixins } = params;
    const sourceFile: SourceFile = source.file;
    const fieldNames = relationExpand(entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => [createPropertyName(entry.key.value)], () => []), () => []));
    const binding = ResourceModelResolver.resolve({ resourceName, fieldNames, modelSymbolTable, knowledgeDataFlow });
    return relationGate(relationEqual(binding.kind, 'mono'), () => {
    const model = binding.model;
    const response: ResponseReference = responseRef(resourceName);
    const fields: ResourceField[] = relationProject(entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => buildResourceField(entry.key.value, entry.value, sourceFile.value.value, resourceName.value.value, model), () => { throw Error(`Resource '${resourceName.value.value}' requires static string field keys at the AST boundary`); }), () => { throw Error(`Resource '${resourceName.value.value}' requires static string field keys at the AST boundary`); }));
    const upstreamAssignments: Assignments = {
        kind: 'assignments',
        items: seq(relationProject(relationSelect(assignments, statement => relationGate(relationEqual(statement.kind, 'assignment'), () => relationEqual(statement.target.kind, 'variable'), () => false)), statement => {
            const assignmentSource = sourceSpanFromRange(sourceFile, statement.source);
            const mapped = resolveAstValueToExpression(statement.value, sourceFile.value.value);
            const expression: Expression = mapped.upstream;
            const resolved: ResolvedExpression = { kind: 'resolved_expression', expression, result: unresolved() };
            return { kind: 'assignment', target: resolveAssignmentTarget(statement.target, (value, file) => resolveAstValueToExpression(value, file).upstream, sourceFile.value.value), expression, operator: resolveAssignmentOperator(statement.operator.kind), reference: assignmentReferenceMode(statement.reference.kind), source: assignmentSource };
        }))
    };
    const properties: Properties = { kind: 'properties', items: seq(relationProject(fields, field => ({ kind: 'property' as const, name: field.name, type: { kind: 'typed' as const, value: field.type } as PropertyType, presence: { kind: 'required' as const }, declaration: { kind: 'resource_projection' as const }, documentation: { kind: 'absent' as const }, visibility: { kind: 'public' as const }, storage: { kind: 'instance_mutable' as const }, initialization: { kind: 'not_applicable' as const }, promotion: { kind: 'declared' as const }, access: { kind: 'readable' as const }, casting: { kind: 'not_casted' as const }, source }))) };
    const transformation: ResourceTransformation = {
        kind: 'resource_transformation',
        method: { kind: 'method_name', value: str(method.name) },
        visibility: { kind: 'public' },
        request: { kind: 'request_parameter_declared', parameter: requestParameter },
        returnType: { kind: 'array', element: { kind: 'mixed' } },
        body: mapResourcePhpStatementsToSourceStatements(method.body, sourceFile.value.value),
        source,
    };
    const inheritance: ResourceInheritance = { kind: 'resource_inheritance', base: baseClass, source };
    const documentation: ResourceDocumentation = { kind: 'resource_documentation', mixins: seq(documentationMixins), source };
    const representation: ResourceRepresentation = relationGate(relationEqual(baseClass.value.value, 'ResourceCollection'), () => ({ kind: 'json_resource_collection' }), () => ({ kind: 'json_resource' }));
    const operationItems = relationExpand(fields, field => relationGate(relationEqual(field.output.kind, 'operation'), () => [field.output.operation], () => []));
    const contract = {
        kind: 'resource_serialization_contract' as const,
        representation,
        wrapping,
        inputModel: modelRef(model.name.value.value),
        requestAware: truth(true),
        request: transformation.request,
        operations: { kind: 'resource_operations' as const, items: seq(operationItems) },
        responseCustomization: { kind: 'response_customization_absent' as const },
        fields: { kind: 'resource_fields' as const, items: seq(fields) },
        dynamicEntries: { kind: 'resource_dynamic_entries' as const, items: seq([]) },
        framework: { kind: 'resource_framework_features', collection: { kind: 'resource_collection_features', preserveKeys: { kind: 'truth_value', value: false }, collects: { kind: 'collection_resource_inference' }, paginationInformation: { kind: 'pagination_information_absent' }, preserveQuery: { kind: 'preserve_query_absent' }, withQuery: { kind: 'with_query_absent' }, count: { kind: 'count_override_absent' } }, jsonApi: { kind: 'json_api_absent' }, with: { kind: 'with_absent' }, withResponse: { kind: 'with_response_absent' }, paginationInformation: { kind: 'pagination_information_absent' }, additional: { kind: 'supported_at_invocation' }, forceWrapping: { kind: 'truth_value', value: false }, jsonOptions: { kind: 'json_options_absent' }, toJson: { kind: 'to_json_absent' }, toPrettyJson: { kind: 'to_pretty_json_absent' }, response: { kind: 'response_absent' }, toResponse: { kind: 'to_response_absent' } },
    };
    const definition: ResourceDefinition = {
        kind: 'resource',
        name: resourceName,
        baseName: resourceName,
        inheritance,
        documentation,
        transformation,
        model: modelRef(model.name.value.value),
        response,
        fields: { kind: 'resource_fields', items: seq(fields) },
        assignments: upstreamAssignments,
        sourceProperties: properties,
        actions: emptyActions,
        endpoints: emptyPaths,
        synthetic: truth(false),
        contract,
        framework: contract.framework,
        source,
    };
    return createDomainAstJudgment({ kind: 'resource_ast', semantic: definition, source });
    }, () => { throw Error(`Resource '${resourceName.value.value}' cannot cross the AST semantic boundary without one resolved Eloquent model.`); });
}


function requireVariableTargetName(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget): string {
    return relationGate(relationEqual(target.kind, 'variable'), () => target.name, () => { throw Error('Expected a variable assignment target at the Resource boundary'); });
}


function requireStringArrayKey(key: import('../../lexer/phpAstTypes').PhpArrayKey): string {
    return relationGate(relationEqual(key.kind, 'string'), () => key.value, () => { throw Error('Expected a static string PHP array key at this semantic boundary'); });
}
