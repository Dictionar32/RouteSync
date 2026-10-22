/**
 * Canonical Laravel Resource semantic binder.
 *
 * The scanner contributes PHP evidence; this boundary raises that evidence into
 * the upstream Resource ADT. Resource/model resolution is consumed as a closed
 * semantic binding and the resulting fields are produced by the canonical
 * relational resource-field producer. No parsed resource descriptor survives
 * this boundary.
 */
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import type { PhpStatement, PhpAssignmentTarget } from "../../lexer/phpAstTypes";
import type { PhpMethodAst } from "../../lexer/phpMethodAstTypes";
import type { PhpClassPropertyAst } from "../../lexer/phpAstDeclarationTypes";
import type { PhpArrayEntry, PhpAstValue, PhpArrayKey } from "../../lexer/PhpAst";
import { createDomainAstJudgment, type ResourceAst } from "../../../../types/upstream/ast";
import type {
    ResourceDefinition,
    ResourceField,
    ResourceFrameworkFeatures,
    ResourceInheritance,
    ResourceDocumentation,
    ResourceRepresentation,
    ResourceTransformation,
    ResourceSerializationContract,
} from "../../../../types/upstream/resource";
import type { ResourceOperation } from "../../../../types/upstream/resourceVocabulary";
import type { Assignments, Properties, ResourceActions, RoutePaths, Sequence } from "../../../../types/upstream/collections";
import type { Expression } from "../../../../types/upstream/expression";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import type { PropertyDefinition } from "../../../../types/upstream/property";
import type { Assignment } from "../../../../types/upstream/assignment";
import { type ResourceName, type SourceFile, type PropertyName, type VariableName, type ClassName } from "../../../../types/upstream/names";
import type { ModelReference, ResourceReference, ResponseReference } from "../../../../types/upstream/semanticReferences";
import type { TruthValue, StringValue } from "../../../../types/upstream/valueObjects";
import type { ResourceWrapping } from "../../../../types/upstream/resource";
import { resourceProducer } from "../../operations/resourceProducer";
import type { ResourceProducerInterface, ResourceFieldProducerInput } from "../../../../types/upstream/resourceProducerInterface";
import type { ResourceDefinitionBindingInput, ResourceDefinitionBindingOperationInterface } from "../../../../types/upstream/resourceDefinitionBindingInterface";
import type { ResourceModelKnowledgeDataFlow } from "../../../../types/upstream/resourceModelKnowledgeDataFlowInterface";
type ResourceProducerOperations = ResourceProducerInterface<PhpArrayEntry, PhpStatement, PhpMethodAst, PhpClassPropertyAst, PhpAstValue, OriginModelSymbol>;
type ResourceDefinitionBindingParameters = ResourceDefinitionBindingInput<PhpArrayEntry, PhpStatement, PhpMethodAst, ModelSymbolTable, ResourceModelKnowledgeDataFlow>;
type ResourceDefinitionBindingOperation = ResourceDefinitionBindingOperationInterface<ResourceDefinitionBindingParameters>;
import { projectPhpStatementsToSourceStatements } from "../../lexer/routeAst/phpAstExpressionSemanticAuthority";
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode, sourceSpanFromRange } from "../../lexer/routeAst/phpAstExpressionMappings";
import { ResourceModelResolver } from "../../resolvers/resource/ResourceModelResolver";
import { matchResourceModelBinding } from "../../symbols/resource/resourceBindingTypes";
import { relationEqual, relationGate } from "../../../../semantic/relations/semanticRelations";
import { relationExpand, relationFoldRight, relationOptionFold, relationProject, relationRefine } from "../../../../semantic/relations/relationalSequence";
import { mapResourceAstExpression } from "../../operations/resourceAstExpressionMapper";

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const truthValue = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });
const sequence = <T>(items: readonly T[]): Sequence<T> =>
    relationFoldRight(items, emptySequence<T>(), (head, tail): Sequence<T> => ({ kind: 'cons', head, tail }));

const modelReference = (value: string): ModelReference => ({
    kind: 'model_reference',
    name: { kind: 'model_name', value: stringValue(value) },
});
const resourceReference = (value: string): ResourceReference => ({
    kind: 'resource_reference',
    name: { kind: 'resource_name', value: stringValue(value) },
});
const responseReference = (resourceName: ResourceName): ResponseReference => ({
    kind: 'response_reference',
    name: { kind: 'response_type_name', value: stringValue(`${resourceName.value.value}Response`) },
});
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue(value) });

const keyedEntry = (entry: PhpArrayEntry) => relationRefine(
    entry,
    (candidate): candidate is Extract<PhpArrayEntry, { readonly kind: 'keyed' }> => relationEqual(candidate.kind, 'keyed'),
);

const assignmentStatement = (statement: PhpStatement) => relationRefine(
    statement,
    (candidate): candidate is Extract<PhpStatement, { readonly kind: 'assignment' }> => relationEqual(candidate.kind, 'assignment'),
);

const variableTarget = (target: PhpAssignmentTarget) => relationRefine(
    target,
    (candidate): candidate is Extract<PhpAssignmentTarget, { readonly kind: 'variable' }> => relationEqual(candidate.kind, 'variable'),
);

const stringArrayKey = (key: PhpArrayKey): string => relationOptionFold(
    relationRefine(key, (candidate): candidate is Extract<PhpArrayKey, { readonly kind: 'string' }> => relationEqual(candidate.kind, 'string')),
    () => { throw Error('Resource semantic boundary requires a static string array key'); },
    value => value.value,
);

const fieldFromEntry = (
    entry: PhpArrayEntry,
    file: string,
    resource: string,
    model: ResourceFieldProducerInput<PhpAstValue, OriginModelSymbol>["model"],
): readonly ResourceField[] => relationOptionFold(
    keyedEntry(entry),
    () => [],
    keyed => [resourceProducer.produceField({ entryKey: stringArrayKey(keyed.key), value: keyed.value, file, resource, model })],
);

const operationFromField = (field: ResourceField): readonly ResourceOperation[] => relationOptionFold(
    relationRefine(field.output, (candidate): candidate is Extract<typeof field.output, { readonly kind: 'operation' }> => relationEqual(candidate.kind, 'operation')),
    () => [],
    operation => [operation.operation],
);

const assignmentFromStatement = (
    statement: PhpStatement,
    sourceFile: SourceFile,
): readonly Assignment[] => relationOptionFold(
    assignmentStatement(statement),
    () => [],
    assignment => relationOptionFold(
        variableTarget(assignment.target),
        () => [],
        target => {
            const source = sourceSpanFromRange(sourceFile, assignment.source);
            const mapped = mapResourceAstExpression({ value: assignment.value, sourceFile });
            const expression: Expression = mapped.upstream;
            return [{
                kind: 'assignment',
                target: resolveAssignmentTarget(target, value => mapResourceAstExpression({ value, sourceFile }).upstream, sourceFile.value.value),
                expression,
                operator: resolveAssignmentOperator(assignment.operator.kind),
                reference: assignmentReferenceMode(assignment.reference.kind),
                source,
            }];
        },
    ),
);

export const buildResourceField: ResourceProducerOperations['produceField'] = input =>
    resourceProducer.produceField(input);

const resourceProperty = (field: ResourceField, source: SourceSpan): PropertyDefinition => ({
    kind: 'property',
    name: field.name,
    type: { kind: 'typed', value: field.type },
    presence: { kind: 'required' },
    declaration: { kind: 'resource_projection' },
    documentation: { kind: 'absent' },
    visibility: { kind: 'public' },
    storage: { kind: 'instance_mutable' },
    initialization: { kind: 'not_applicable' },
    promotion: { kind: 'declared' },
    access: { kind: 'readable' },
    casting: { kind: 'not_casted' },
    source,
});

export const bindResourceDefinition: ResourceDefinitionBindingOperation = (params: ResourceDefinitionBindingParameters): ResourceAst => {
    const { resourceName, entries, source, modelSymbolTable, knowledgeDataFlow, assignments = [], method, baseClass, wrapping, requestParameter, documentationMixins } = params;
    const sourceFile: SourceFile = source.file;
    const fieldNames = relationExpand(entries, entry => relationOptionFold(
        keyedEntry(entry),
        () => [],
        keyed => [propertyName(stringArrayKey(keyed.key))],
    ));
    const resolution = ResourceModelResolver.resolve({
        resourceName,
        fieldNames,
        modelSymbolTable,
        controllerDataflowMap: { kind: 'absent' },
        knowledgeDataFlow: knowledgeDataFlow ? { kind: 'present', value: knowledgeDataFlow } : { kind: 'absent' },
    });

    return matchResourceModelBinding(resolution, {
        mono: binding => {
            const model = binding.model;
            const fields: readonly ResourceField[] = relationExpand(entries, entry => fieldFromEntry(entry, sourceFile.value.value, resourceName.value.value, model));
            const assignmentsModel: Assignments = {
                kind: 'assignments',
                items: sequence(relationExpand(assignments, statement => assignmentFromStatement(statement, sourceFile))),
            };
            const properties: Properties = {
                kind: 'properties',
                items: sequence(relationProject(fields, field => resourceProperty(field, source))),
            };
            const transformation: ResourceTransformation = {
                kind: 'resource_transformation',
                method: { kind: 'method_name', value: stringValue(method.name) },
                visibility: { kind: 'public' },
                request: { kind: 'request_parameter_declared', parameter: requestParameter },
                returnType: { kind: 'array', element: { kind: 'mixed' } },
                body: projectPhpStatementsToSourceStatements(method.body, sourceFile.value.value),
                source,
            };
            const inheritance: ResourceInheritance = { kind: 'resource_inheritance', base: baseClass, source };
            const documentation: ResourceDocumentation = { kind: 'resource_documentation', mixins: sequence(documentationMixins), source };
            const representation: ResourceRepresentation = relationGate(
                relationEqual(baseClass.value.value, 'ResourceCollection'),
                () => ({ kind: 'json_resource_collection' }),
                () => ({ kind: 'json_resource' }),
            );
            const framework: ResourceFrameworkFeatures = {
                kind: 'resource_framework_features',
                collection: { kind: 'resource_collection_features', preserveKeys: truthValue(false), collects: { kind: 'collection_resource_inference' }, paginationInformation: { kind: 'pagination_information_absent' }, preserveQuery: { kind: 'preserve_query_absent' }, withQuery: { kind: 'with_query_absent' }, count: { kind: 'count_override_absent' } },
                jsonApi: { kind: 'json_api_absent' },
                with: { kind: 'with_absent' },
                withResponse: { kind: 'with_response_absent' },
                paginationInformation: { kind: 'pagination_information_absent' },
                additional: { kind: 'supported_at_invocation' },
                forceWrapping: truthValue(false),
                jsonOptions: { kind: 'json_options_absent' },
                toJson: { kind: 'to_json_absent' },
                toPrettyJson: { kind: 'to_pretty_json_absent' },
                response: { kind: 'response_absent' },
                toResponse: { kind: 'to_response_absent' },
                withProperty: { kind: 'with_property_absent' },
                additionalProperty: { kind: 'additional_property_absent' },
            };
            const contract: ResourceSerializationContract = {
                kind: 'resource_serialization_contract',
                representation,
                wrapping,
                inputModel: modelReference(model.name.value.value),
                requestAware: truthValue(true),
                request: transformation.request,
                operations: { kind: 'resource_operations', items: sequence(relationExpand(fields, operationFromField)) },
                responseCustomization: { kind: 'response_customization_absent' },
                fields: { kind: 'resource_fields', items: sequence(fields) },
                dynamicEntries: { kind: 'resource_dynamic_entries', items: sequence([]) },
                framework,
            };
            const definition: ResourceDefinition = {
                kind: 'resource',
                name: resourceName,
                baseName: resourceName,
                inheritance,
                documentation,
                transformation,
                model: modelReference(model.name.value.value),
                response: responseReference(resourceName),
                fields: { kind: 'resource_fields', items: sequence(fields) },
                assignments: assignmentsModel,
                sourceProperties: properties,
                actions: { kind: 'resource_actions', items: sequence([]) },
                endpoints: { kind: 'route_paths', items: sequence([]) },
                synthetic: truthValue(false),
                contract,
                framework,
                source,
            };
            return createDomainAstJudgment({ kind: 'resource_ast', semantic: definition, source });
        },
        poly: () => { throw Error(`Resource '${resourceName.value.value}' has multiple semantic model candidates at the AST boundary`); },
        unbacked_dto: binding => { throw Error(`Resource '${resourceName.value.value}' cannot cross the AST semantic boundary: ${binding.reason.value}`); },
    });
}

export const requireVariableTargetName = (target: PhpAssignmentTarget): string =>
    relationOptionFold(variableTarget(target), () => { throw Error('Expected a variable assignment target at the Resource boundary'); }, value => value.name);

export const requireStringArrayKey = (key: PhpArrayKey): string => stringArrayKey(key);
