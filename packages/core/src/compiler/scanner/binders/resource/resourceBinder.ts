/**
 * resourceBinder.ts
 *
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 *
 * @module core/compiler/scanner/binders/resource/resourceBinder
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { PhpStatement } from "../../lexer/phpAstTypes";
import { mapAstValueToExpression } from "../../subscanners/resource/resourceAstExpressionMapper";
import type { PhpArrayEntry } from "../../lexer/PhpAst";
import { sourceSpanFromRange } from "../../subscanners/resource/resourceUpstreamExpressionMappings";
import type { ResourceFieldDescriptor, ParsedResource } from "../../../../types/route";
import type { ResourceDefinition, ResourceField, ResourceFieldMeaning } from "../../../../types/upstream/resource";
import type { ResourceAst } from "../../../../types/upstream/ast";
import type { Expression, ResolvedExpression } from "../../../../types/upstream/expression";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";
import type { Presence } from "../../../../types/upstream/primitiveVocabulary";
import type { PropertyName, ResponseTypeName, ModelName } from "../../../../types/upstream/names";
import type { ModelReference, ResourceReference, ResponseReference, PropertyReference } from "../../../../types/upstream/semanticReferences";
import type { StringValue, NumberValue, TruthValue } from "../../../../types/upstream/valueObjects";
import type { Sequence, Properties, Assignments, ResourceActions, RoutePaths } from "../../../../types/upstream/collections";
import { semanticType } from "../../subscanners/model/semanticTypeCanonical";
import type { ModelName, ResourceName, SourceFile } from "../../../../types/upstream/names";
import { ScannedResourceDescriptor } from "../../descriptors/resourceDescriptors";
import { ResourceModelResolver } from "../../resolvers/resource/ResourceModelResolver";
import { findControllerResourceBinding } from "../../subscanners/controller/resourceDataflowAggregator";
import { matchResourceModelBinding } from "../../symbols/resource/resourceBindingTypes";
import { bindField } from "./fieldBinder";
import { matchBoundSemantic } from "../../../../types/domain/boundAst";
import { requireResourceFieldType } from "../../../../types/domain/resourceFieldSemantic";

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
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
    readonly relationPropagationMap?: ReadonlyMap<ResourceName, ModelName>;
    readonly assignments?: readonly PhpStatement[];
}): ParsedResource {
    const fieldNames = entries.map(e => e.key);
    const binding = ResourceModelResolver.resolve({
        resourceName,
        fieldNames,
        modelSymbolTable,
        controllerDataflowMap,
        relationPropagationMap
    });

    const fields = matchResourceModelBinding(binding, {
        mono: (resolved) => entries.map((entry) => bindField({
            key: requireStringArrayKey(entry.key),
            value: entry.value,
            modelSymbol: resolved.model,
            modelSymbolTable
        }).descriptor),
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
                name: SemanticValueFactory.propertyName(statement.target.name.value),
                expression: mapped.expression,
                upstream: mapped.upstream,
                nullability: { kind: 'non_nullable' as const }
            };
        }),
        modelName: binding.model.name,
        isSynthetic: false
    });
}


const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const sourceSpan = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: str(file) }, start: num(line), end: num(line) });
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
    return matchBoundSemantic(field.semantic.bound, {
        bound_model_column: () => ({ kind: 'property_projection', property: propertyRef(field.name.value), model: modelRef(model) }),
        bound_relation: bound => {
            const relation = modelRelation(bound.relationName, modelSymbol);
            return relation.kind === 'found'
                ? {
                    kind: 'relation_projection',
                    relation: propertyRef(field.name.value),
                    resource: resourceRef(resource),
                    targetModel: modelRef(relation.value.targetModel.value.value),
                    cardinality: relation.value.cardinality,
                    multiplicity: relation.value.multiplicity,
                    targetShape: relation.value.targetShape,
                    traversalTarget: relation.value.traversalTarget
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

/** Canonical producer: raises bound Resource semantics directly into the existing Resource AST contract. */
export function bindResourceDefinition(params: {
    readonly resourceName: ResourceName;
    readonly entries: readonly PhpArrayEntry[];
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly sourceLength: number;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
    readonly relationPropagationMap?: ReadonlyMap<ResourceName, ModelName>;
    readonly assignments?: readonly PhpStatement[];
}): ResourceAst {
    const { resourceName, entries, sourceFile, sourceLength, modelSymbolTable, controllerDataflowMap, relationPropagationMap, assignments = [] } = params;
    const fieldNames = entries.map(e => e.key);
    const binding = ResourceModelResolver.resolve({ resourceName, fieldNames, modelSymbolTable, controllerDataflowMap, relationPropagationMap });
    if (binding.kind !== 'mono') {
        throw new Error(`Resource '${resourceName.value.value}' cannot cross the AST semantic boundary without one resolved Eloquent model.`);
    }
    const model = binding.model;
    if (controllerDataflowMap === undefined) {
        throw new Error(`Resource '${resourceName.value.value}' requires controller response evidence at the AST boundary.`);
    }
    const controllerBinding = findControllerResourceBinding(controllerDataflowMap, resourceName);
    if (controllerBinding === undefined) {
        throw new Error(`Resource '${resourceName.value.value}' has no controller response evidence at the AST boundary.`);
    }
    const response = controllerBinding.response;
    const source = sourceSpan(sourceFile.value.value, params.sourceLine);
    const variableDefinitions = new Map<string, import('../../lexer/phpAstExpressionTypes').PhpAstValue>();
    assignments.forEach(statement => {
        if (statement.kind === 'assignment' && statement.target.kind === 'variable') {
            variableDefinitions.set(statement.target.name.value, statement.value);
        }
    });
    const fields: ResourceField[] = entries.map(entry => {
        if (entry.kind !== 'keyed' || entry.key.kind !== 'string') throw new Error(`Resource '${resourceName.value.value}' requires static string field keys at the AST boundary`);
        const bound = bindField({ key: entry.key.value, value: entry.value, modelSymbol: model, modelSymbolTable, variableDefinitions });
        const fieldSource = sourceSpanFromRange(sourceFile, entry.source);
        const mapped = mapAstValueToExpression(entry.value, sourceFile.value.value, fieldSource);
        const expression = mapped.upstream;
        const type: TypeExpression = semanticType(requireResourceFieldType(bound.descriptor.semantic));
        const presence: Presence = { kind: 'required' };
        return {
            kind: 'resource_field',
            name: propertyName(entry.key.value),
            expression,
            meaning: fieldMeaning(bound.descriptor, expression, resourceName.value.value, model.name.value.value, model),
            type,
            presence,
            source: expression.source,
        };
    });
    const upstreamAssignments: Assignments = {
        kind: 'assignments',
        items: seq(assignments.filter((statement): statement is Extract<PhpStatement, { kind: 'assignment' }> => statement.kind === 'assignment' && statement.target.kind === 'variable').map(statement => {
            const assignmentSource = sourceSpanFromRange(sourceFile, statement.source);
            const mapped = mapAstValueToExpression(statement.value, sourceFile.value.value, assignmentSource);
            const expression: Expression = mapped.upstream;
            const resolved: ResolvedExpression = { kind: 'resolved_expression', expression, result: unresolved() };
            return { kind: 'assignment', target: { kind: 'variable', name: variableName(statement.target.name.value) }, expression: resolved, source: assignmentSource };
        }))
    };
    const properties: Properties = { kind: 'properties', items: seq(fields.map(field => ({ kind: 'property' as const, name: field.name, type: field.type, presence: field.presence, origin: { kind: 'computed' as const }, source }))) };
    const definition: ResourceDefinition = {
        kind: 'resource',
        name: resourceName,
        baseName: resourceName,
        model: modelRef(model.name.value.value),
        response,
        fields: { kind: 'resource_fields', items: seq(fields) },
        assignments: upstreamAssignments,
        sourceProperties: properties,
        actions: emptyActions,
        endpoints: emptyPaths,
        synthetic: truth(false),
        source,
    };
    return { kind: 'resource_ast', definition, source };
}


function requireStringArrayKey(key: import('../../lexer/phpAstTypes').PhpArrayKey): string {
    if (key.kind === 'string') return key.value;
    throw new Error('Expected a static string PHP array key at this semantic boundary');
}
