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
import { mapAstValueToExpression } from "../../subscanners/resource/resourceAstExpressionMapper";
import type { PhpArrayEntry } from "../../lexer/PhpAst";
import { sourceSpanFromRange } from "../../subscanners/resource/resourceUpstreamExpressionMappings";
import type { ResourceDefinition, ResourceField, ResourceFieldMeaning, ResourceFieldOutput, ResourceTransformation, ResourceInheritance, ResourceDocumentation, ResourceRepresentation, ResourceFieldPresence } from "../../../../types/upstream/resource";
import type { ParsedResource } from "../../../../types/route";
import type { ResourceOperation, ResourceOperationValue, ResourceOperationDefault } from "../../../../types/upstream/resourceVocabulary";
import type { ResourceAst } from "../../../../types/upstream/ast";
import type { Expression, ResolvedExpression } from "../../../../types/upstream/expression";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";
import type { Presence } from "../../../../types/upstream/primitiveVocabulary";
import type { PropertyName, ResponseTypeName, ModelName, VariableName, RelationName } from "../../../../types/upstream/names";
import type { PropertyType } from "../../../../types/upstream/property";
import type { ModelReference, ResourceReference, ResponseReference, PropertyReference } from "../../../../types/upstream/semanticReferences";
import { mapResourcePhpStatementsToSourceStatements } from "../../subscanners/resource/resourceUpstreamExpressionCanonical";
import { mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode } from "../../subscanners/resource/resourceUpstreamExpressionMappings";
import { resourceOperationKindForMethod } from "../../../../types/upstream/resourceVocabulary";
import type { StringValue, TruthValue } from "../../../../types/upstream/valueObjects";
import type { Sequence, Properties, Assignments, ResourceActions, RoutePaths } from "../../../../types/upstream/collections";
import { semanticType } from "../../subscanners/model/semanticTypeCanonical";
import type { ResourceName, SourceFile } from "../../../../types/upstream/names";
import { ScannedResourceDescriptor } from "../../descriptors/resourceDescriptors";
import { produceResourceField } from "../../subscanners/resource/resourceFieldProducer";

/**
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 */
export function bindResource({
    resourceName,
    entries,
    sourceFile,
    sourceLine,
    modelSymbolTable,
    controllerDataflowMap,
    relationPropagationMap,
    assignments = []
}: {
    readonly resourceName: ResourceName;
    readonly entries: readonly PhpArrayEntry[];
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly relationPropagationMap?: ReadonlyMap<ResourceName, ModelName>;
    readonly assignments?: readonly PhpStatement[];
}): ParsedResource {
    const fieldNames = entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string' ? [entry.key.value] : []);
    const binding = ResourceModelResolver.resolve({
        resourceName,
        fieldNames,
        modelSymbolTable,
        controllerDataflowMap,
        relationPropagationMap
    });

    const fields = matchResourceModelBinding(binding, {
        mono: (resolved) => entries.flatMap(entry => entry.kind === 'keyed' ? [bindField({
            key: requireStringArrayKey(entry.key),
            value: entry.value,
            modelSymbol: resolved.model,
            modelSymbolTable
        }).descriptor] : []),
        poly: () => {
            throw new Error(`Resource '${resourceName.value.value}' cannot cross the semantic boundary with multiple Eloquent models.`);
        },
        unbacked_dto: (resolved) => {
            throw new Error(`Resource '${resourceName.value.value}' cannot cross the semantic boundary: ${resolved.reason}`);
        }
    });

    return ScannedResourceDescriptor.create({
        name: resourceName,
        fields,
        sourceFile,
        sourceLine,
        assignments: assignments.filter((statement): statement is Extract<PhpStatement, { kind: 'assignment' }> => statement.kind === 'assignment' && statement.target.kind === 'variable').map(statement => {
            const mapped = mapAstValueToExpression(statement.value, sourceFile.value.value);
            return {
                name: SemanticValueFactory.propertyName(requireVariableTargetName(statement.target)),
                expression: mapped.expression,
                upstream: mapped.upstream,
                nullability: { kind: 'non_nullable' as const }
            };
        }),
        modelName: matchResourceModelBinding(binding, { mono: resolved => resolved.model.name, poly: () => { throw new Error(`Resource '${resourceName.value.value}' cannot use multiple models.`); }, unbacked_dto: () => { throw new Error(`Resource '${resourceName.value.value}' has no Eloquent model.`); } }),
        isSynthetic: false
    });
}


const str = (value: string): StringValue => ({ kind: 'string_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
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

function modelRelation(relationName: import('../../../../types/upstream/names').RelationName, model: import('../../../../compiler/scanner/symbols/model/originModelSymbol').OriginModelSymbol) {
    return model.relation(relationName);
}

function fieldMeaning(field: ResourceFieldDescriptor, expression: Expression, resource: string, model: string, modelSymbol: import('../../../../compiler/scanner/symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldMeaning {
    if (field.semantic.kind !== 'verified') return { kind: 'computed_projection', expression };
    return matchBoundSemantic<ResourceFieldMeaning>(field.semantic.bound, {
        bound_model_column: (): ResourceFieldMeaning => ({ kind: 'property_projection', property: propertyRef(field.name.value), model: modelRef(model) }),
        bound_relation: (bound): ResourceFieldMeaning => {
            const relation = modelRelation(bound.relationName, modelSymbol);
            return relation.kind === 'found'
                ? {
                    kind: 'relation_projection',
                    relation: propertyRef(field.name.value),
                    projection: {
                        kind: 'resource',
                        resource: resourceRef(resource),
                        targetModel: modelRef(relation.value.targetModel.value.value),
                        cardinality: relation.value.cardinality,
                        multiplicity: relation.value.multiplicity,
                        targetShape: relation.value.targetShape,
                        traversalTarget: relation.value.traversalTarget
                    }
                }
                : { kind: 'computed_projection', expression };
        },
        bound_primitive: () => ({ kind: 'computed_projection', expression }),
        bound_model_reference: () => ({ kind: 'computed_projection', expression }),
        bound_resource_reference: () => ({ kind: 'computed_projection', expression }),
        bound_property_chain: () => ({ kind: 'computed_projection', expression }),
        bound_conditional: () => ({ kind: 'computed_projection', expression }),
        bound_binary: () => ({ kind: 'computed_projection', expression }),
        bound_ternary: () => ({ kind: 'computed_projection', expression }),
        bound_method_call: () => ({ kind: 'computed_projection', expression }),
        bound_query_projection: () => ({ kind: 'computed_projection', expression }),
        bound_projection_field: () => ({ kind: 'computed_projection', expression }),
        bound_unsupported: () => ({ kind: 'computed_projection', expression }),
    });
}

function operationDefault(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationDefault {
    const argument = argumentsAst[index];
    return argument ? { kind: 'expression', expression: mapAstValueToExpression(argument.value, file).upstream } : { kind: 'missing_value' };
}

function operationExpression(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): Expression {
    if (value.kind === 'arrow_function') return mapAstValueToExpression(value.body, file).upstream;
    if (value.kind === 'closure') {
        const returns = value.body.statements.filter((statement): statement is Extract<import('../../lexer/phpAstTypes').PhpStatement, { kind: 'return_with_value' }> => statement.kind === 'return_with_value');
        if (returns.length === 1) return mapAstValueToExpression(returns[0].expression, file).upstream;
    }
    return mapAstValueToExpression(value, file).upstream;
}

function operationValue(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number, file: string): ResourceOperationValue {
    const argument = argumentsAst[index];
    if (!argument) return { kind: 'implicit_resource_value' };
    return { kind: 'expression', expression: operationExpression(argument.value, file) };
}

function relationArgument(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): RelationName {
    const argument = argumentsAst[index];
    if (!argument || argument.value.kind !== 'literal' || argument.value.literalType !== 'string') throw new Error('Resource operation relation must be a literal relation name at the AST boundary');
    return { kind: 'relation_name', value: { kind: 'string_value', value: argument.value.value } };
}

function operationForField(value: import('../../lexer/phpAstTypes').PhpAstValue, file: string): ResourceFieldOutput | undefined {
    if (value.kind !== 'method_chain') return undefined;
    const kind = resourceOperationKindForMethod(value.property);
    if (kind === 'ordinary') return undefined;
    switch (kind) {
        case 'when_loaded':
            return { kind: 'operation', operation: { kind: 'when_loaded', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_counted':
            return { kind: 'operation', operation: { kind: 'when_counted', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_exists_loaded':
            return { kind: 'operation', operation: { kind: 'when_exists_loaded', relation: relationArgument(value.arguments, 0), value: operationValue(value.arguments, 1, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_pivot_loaded':
            return { kind: 'operation', operation: { kind: 'when_pivot_loaded', table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(value.arguments, 0) } }, value: operationExpression(value.arguments[1]?.value ?? value, file), default: operationDefault(value.arguments, 2, file) } };
        case 'when_pivot_loaded_as':
            return { kind: 'operation', operation: { kind: 'when_pivot_loaded_as', accessor: { kind: 'property_name', value: { kind: 'string_value', value: literalString(value.arguments, 0) } }, table: { kind: 'table_name', value: { kind: 'string_value', value: literalString(value.arguments, 1) } }, value: operationExpression(value.arguments[2]?.value ?? value, file), default: operationDefault(value.arguments, 3, file) } };
        case 'when_aggregated':
            return { kind: 'operation', operation: { kind: 'when_aggregated', relation: relationArgument(value.arguments, 0), column: { kind: 'column_name', value: { kind: 'string_value', value: literalString(value.arguments, 1) } }, aggregate: aggregateFunction(literalString(value.arguments, 2)), value: operationValue(value.arguments, 3, file), default: operationDefault(value.arguments, 4, file) } };
        case 'when':
        case 'unless':
        case 'merge_when':
        case 'merge_unless':
        case 'merge':
        case 'transform':
        case 'attributes':
        case 'when_has':
        case 'when_null':
        case 'when_not_null':
        case 'when_appended':
        case 'additional':
        case 'with':
            throw new Error(`Resource operation '${kind}' is not a field projection and requires a dedicated contract mapping`);
    }
}

function literalString(argumentsAst: readonly import('../../lexer/phpAstTypes').PhpArgument[], index: number): string {
    const value = argumentsAst[index]?.value;
    if (!value || value.kind !== 'literal' || value.literalType !== 'string') throw new Error('Resource operation expects a literal string argument at the AST boundary');
    return value.value;
}

function aggregateFunction(value: string): import('../../../../types/upstream/resourceVocabulary').ResourceAggregateFunction {
    switch (value) {
        case 'avg': return { kind: 'avg' };
        case 'sum': return { kind: 'sum' };
        case 'min': return { kind: 'min' };
        case 'max': return { kind: 'max' };
        default: throw new Error(`Unsupported Laravel resource aggregate '${value}' at the AST boundary`);
    }
}

function fieldOutput(value: import('../../lexer/phpAstTypes').PhpAstValue, expression: Expression, file: string, resource: string, model: import('../../symbols/model/originModelSymbol').OriginModelSymbol): ResourceFieldOutput {
    const operation = operationForField(value, file);
    if (operation) return operation;
    switch (value.kind) {
        case 'resource_single': return { kind: 'resource', resource: resourceRef(value.resourceName), expression };
        case 'resource_collection': return { kind: 'resource_collection', resource: resourceRef(value.resourceName), expression };
        case 'nested_array': return { kind: 'nested_object', fields: { kind: 'resource_fields', items: seq(value.entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string' ? [buildResourceField(entry.key.value, entry.value, file, resource, model)] : [])) }, dynamicEntries: { kind: 'resource_dynamic_entries', items: seq([]) } };
        default: return { kind: 'scalar_or_expression', expression };
    }
}

function fieldPresence(value: import('../../lexer/phpAstTypes').PhpAstValue): ResourceFieldPresence {
    if (value.kind === 'method_chain' && resourceOperationKindForMethod(value.property) === 'when_loaded') return { kind: 'relation_loaded', relation: relationArgument(value.arguments, 0) };
    return { kind: 'always_present' };
}

function directFieldMeaning(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    expression: Expression,
    resource: string,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): ResourceFieldMeaning {
    const property = value.kind === 'property_access' && value.target.kind === 'variable_reference'
        ? model.property(propertyName(value.property))
        : undefined;
    if (property?.kind === 'column') {
        return { kind: 'property_projection', property: propertyRef(property.property.value), model: modelRef(model.name.value.value) };
    }
    if (property?.kind === 'relation') {
        const relation = modelRelation({ kind: 'relation_name', value: str(property.property.value) }, model);
        if (relation.kind === 'found') {
            return {
                kind: 'relation_projection',
                relation: propertyRef(property.property.value),
                projection: {
                    kind: 'resource',
                    resource: resourceRef(resource),
                    targetModel: modelRef(relation.value.targetModel.value.value),
                    cardinality: relation.value.cardinality,
                    multiplicity: relation.value.multiplicity,
                    targetShape: relation.value.targetShape,
                    traversalTarget: relation.value.traversalTarget
                }
            };
        }
    }
    if (value.kind === 'method_chain' && resourceOperationKindForMethod(value.property) === 'when_loaded') {
        return { kind: 'computed_projection', expression };
    }
    return { kind: 'computed_projection', expression };
}

function directFieldType(
    value: import('../../lexer/phpAstTypes').PhpAstValue,
    model: import('../../symbols/model/originModelSymbol').OriginModelSymbol
): TypeExpression {
    if (value.kind === 'property_access' && value.target.kind === 'variable_reference') {
        const property = model.property(propertyName(value.property));
        if (property) return semanticType(property.semanticType);
    }
    return { kind: 'error', diagnostic: str('resource_field_type_requires_upstream_typing') };
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
    readonly relationPropagationMap?: ReadonlyMap<ResourceName, ModelName>;
    readonly assignments?: readonly PhpStatement[];
    readonly method: import('../../lexer/phpMethodAstTypes').PhpMethodAst;
    readonly baseClass: import('../../../../types/upstream/names').ClassName;
    readonly wrapping: import('../../../../types/upstream/resource').ResourceWrapping;
    readonly requestParameter: import('../../../../types/upstream/names').VariableName;
    readonly documentationMixins: readonly import('../../../../types/upstream/semanticReferences').ModelReference[];
}): ResourceAst {
    const { resourceName, entries, source, modelSymbolTable, relationPropagationMap, assignments = [], method, baseClass, wrapping, requestParameter, documentationMixins } = params;
    const sourceFile: SourceFile = source.file;
    const fieldNames = entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string' ? [entry.key.value] : []);
    const binding = ResourceModelResolver.resolve({ resourceName, fieldNames, modelSymbolTable, relationPropagationMap });
    if (binding.kind !== 'mono') {
        throw new Error(`Resource '${resourceName.value.value}' cannot cross the AST semantic boundary without one resolved Eloquent model.`);
    }
    const model = binding.model;
    const response: ResponseReference = responseRef(resourceName);
    const fields: ResourceField[] = entries.map(entry => {
        if (entry.kind !== 'keyed' || entry.key.kind !== 'string') throw new Error(`Resource '${resourceName.value.value}' requires static string field keys at the AST boundary`);
        return buildResourceField(entry.key.value, entry.value, sourceFile.value.value, resourceName.value.value, model, modelSymbolTable);
    });
    const upstreamAssignments: Assignments = {
        kind: 'assignments',
        items: seq(assignments.filter((statement): statement is Extract<PhpStatement, { kind: 'assignment' }> => statement.kind === 'assignment' && statement.target.kind === 'variable').map(statement => {
            const assignmentSource = sourceSpanFromRange(sourceFile, statement.source);
            const mapped = mapAstValueToExpression(statement.value, sourceFile.value.value);
            const expression: Expression = mapped.upstream;
            const resolved: ResolvedExpression = { kind: 'resolved_expression', expression, result: unresolved() };
            return { kind: 'assignment', target: mapAssignmentTarget(statement.target, (value, file) => mapAstValueToExpression(value, file).upstream, sourceFile.value.value), expression, operator: mapAssignmentOperator(statement.operator.kind), reference: assignmentReferenceMode(statement.reference.kind), source: assignmentSource };
        }))
    };
    const properties: Properties = { kind: 'properties', items: seq(fields.map(field => ({ kind: 'property' as const, name: field.name, type: { kind: 'typed' as const, value: field.type } as PropertyType, presence: { kind: 'required' as const }, declaration: { kind: 'resource_projection' as const }, documentation: { kind: 'absent' as const }, visibility: { kind: 'public' as const }, storage: { kind: 'instance_mutable' as const }, initialization: { kind: 'not_applicable' as const }, promotion: { kind: 'declared' as const }, access: { kind: 'readable' as const }, casting: { kind: 'not_casted' as const }, source }))) };
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
    const representation: ResourceRepresentation = baseClass.value.value === 'ResourceCollection' ? { kind: 'json_resource_collection' } : { kind: 'json_resource' };
    const operationItems = fields.flatMap(field => field.output.kind === 'operation' ? [field.output.operation] : []);
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
    return { kind: 'resource_ast', definition, source };
}


function requireVariableTargetName(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget): string {
    if (target.kind !== 'variable') throw new Error('Expected a variable assignment target at the Resource boundary');
    return target.name;
}


function requireStringArrayKey(key: import('../../lexer/phpAstTypes').PhpArrayKey): string {
    if (key.kind === 'string') return key.value;
    throw new Error('Expected a static string PHP array key at this semantic boundary');
}
