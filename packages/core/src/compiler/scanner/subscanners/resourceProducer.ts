import type { ResourceAst } from "../../../types/upstream/ast";
import type { ResourceDefinition, ResourceField, ResourceTransformation, ResourceInheritance, ResourceDocumentation, ResourceRepresentation, ResourceDynamicEntry, ResourceDynamicEntries } from "../../../types/upstream/resource";
import type { Assignments, Properties, Sequence } from "../../../types/upstream/collections";
import type { Expression } from "../../../types/upstream/expression";
import type { ResponseReference, ModelReference, ResourceReference } from "../../../types/upstream/semanticReferences";
import type { SourceFile } from "../../../types/upstream/names";
import { produceResourceField } from "./resource/resourceFieldProducer";
import { propertyProducer } from './model/propertyProducer';
import { mapResourcePhpStatementsToSourceStatements } from "./resource/resourceUpstreamExpressionCanonical";
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode, sourceSpanFromRange } from "./resource/resourceUpstreamExpressionMappings";
import { resolveAstValueToExpression } from "./resource/resourceAstExpressionMapper";
import { responseRef, modelRef } from "../../../types/upstream/semanticReferences";
import type { SourceSpan } from "../../../types/upstream/provenance";
import type { ResourceName, ClassName, VariableName } from "../../../types/upstream/names";
import { createPropertyName } from "../../../types/upstream/names";
import { createSourceFile } from "../../../types/upstream/names";
import type { PhpArrayEntry } from "../lexer/PhpAst";
import type { PhpClassPropertyAst } from "../lexer/phpAstDeclarationTypes";
import type { PhpStatement } from "../lexer/phpAstTypes";
import type { PhpMethodAst } from "../lexer/phpMethodAstTypes";
import type { ResourceWrapping, ResourceFrameworkFeatures, ResourceCollectionFeatures, JsonApiResourceFeatures, JsonApiRelationshipDeclaration } from "../../../types/upstream/resource";
import type { OriginModelSymbol } from "../symbols/model/originModelSymbol";
import { relationLookup, relationOptionFold, relationProject, relationGate, relationSelect, relationFirstOption, relationExpand, relationRefine, relationSome, relationNone } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';

export type ResourceProducerInput = {
    readonly resourceName: ResourceName;
    readonly entries: readonly PhpArrayEntry[];
    readonly source: SourceSpan;
    readonly model: OriginModelSymbol;
    readonly assignments: readonly PhpStatement[];
    readonly method: PhpMethodAst;
    readonly baseClass: ClassName;
    readonly wrapping: ResourceWrapping;
    readonly requestParameter: VariableName;
    readonly documentationMixins: readonly ModelReference[];
    readonly methods: readonly PhpMethodAst[];
    readonly properties: readonly PhpClassPropertyAst[];
    readonly preserveKeys: import('../../../types/upstream/valueObjects').TruthValue;
    readonly forceWrapping: import('../../../types/upstream/valueObjects').TruthValue;
    readonly usesRequestQueryString: import('../../../types/upstream/valueObjects').TruthValue;
    readonly includesPreviouslyLoadedRelationships: import('../../../types/upstream/valueObjects').TruthValue;
    readonly jsonAttributes: readonly PhpArrayEntry[];
    readonly jsonRelationships: readonly PhpArrayEntry[];
    readonly collectsResource: ResourceReference | { readonly kind: 'collection_resource_inference' };
};

export interface ResourceProducer {
    readonly produce: (input: ResourceProducerInput) => ResourceAst;
}

export const resourceProducer: ResourceProducer = {
    produce(input): ResourceAst {
        const sourceFile: SourceFile = input.source.file;
        const model = input.model;
        const fields: ResourceField[] = relationExpand(input.entries, entry => relationGate(
            relationEqual(entry.kind, 'keyed'),
            () => relationGate(
                relationEqual(entry.key.kind, 'string'),
                () => [produceResourceField(entry.key.value, entry.value, sourceFile.value.value, input.resourceName.value.value, model)],
                () => [],
            ),
            () => [],
        ));
        const dynamicEntries: ResourceDynamicEntries = {
            kind: 'resource_dynamic_entries',
            items: seq(relationExpand(input.entries, entry => resourceDynamicEntry(entry, sourceFile.value.value))),
        };
        const assignmentStatements = relationExpand(input.assignments, statement => relationOptionFold(
            relationRefine(statement, (candidate): candidate is Extract<PhpStatement, { kind: 'assignment' }> => relationEqual(candidate.kind, 'assignment')),
            () => [],
            assignment => [assignment],
        ));
        const assignments: Assignments = {
            kind: 'assignments',
            items: seq(relationProject(assignmentStatements, statement => {
                const expression: Expression = resolveAstValueToExpression(statement.value, sourceFile.value.value).upstream;
                return {
                    kind: 'assignment' as const,
                    target: resolveAssignmentTarget(statement.target, (value, file) => resolveAstValueToExpression(value, file).upstream, sourceFile.value.value),
                    expression,
                    operator: resolveAssignmentOperator(statement.operator.kind),
                    reference: assignmentReferenceMode(statement.reference.kind),
                    source: sourceSpanFromRange(sourceFile, statement.source),
                };
            }))
        };
        const transformation: ResourceTransformation = {
            kind: 'resource_transformation',
            method: { kind: 'method_name', value: { kind: 'string_value', value: input.method.name } },
            visibility: { kind: 'public' },
            request: { kind: 'request_parameter_declared', parameter: input.requestParameter },
            returnType: { kind: 'array', element: { kind: 'mixed' } },
            body: mapResourcePhpStatementsToSourceStatements(input.method.body, sourceFile.value.value),
            source: input.source,
        };
        const inheritance: ResourceInheritance = { kind: 'resource_inheritance', base: input.baseClass, source: input.source };
        const documentation: ResourceDocumentation = { kind: 'resource_documentation', mixins: seq(input.documentationMixins), source: input.source };
        const methods = relationProject(input.methods, method => [method.name.value, method] as const);
        const sourceStatements = (method: PhpMethodAst) => mapResourcePhpStatementsToSourceStatements(method.body, sourceFile.value.value);
        const methodStatementsOr = <T>(name: string, absent: T) => relationOptionFold(
            relationLookup(methods, name),
            () => absent,
            value => mapResourcePhpStatementsToSourceStatements(value.body, sourceFile.value.value),
        );
        const jsonApi = relationGate(
            relationEqual(input.baseClass.value.value, 'JsonApiResource'),
            () => buildJsonApiFeatures(input, methods, sourceStatements),
            () => ({ kind: 'json_api_absent' as const }),
        );
        const collection: ResourceCollectionFeatures = {
            kind: 'resource_collection_features',
            preserveKeys: input.preserveKeys,
            collects: input.collectsResource,
            paginationInformation: methodStatementsOr('paginationInformation', { kind: 'pagination_information_absent' }),
            preserveQuery: methodStatementsOr('preserveQuery', { kind: 'preserve_query_absent' }),
            withQuery: methodStatementsOr('withQuery', { kind: 'with_query_absent' }),
            count: methodStatementsOr('count', { kind: 'count_override_absent' }),
        };
        const framework: ResourceFrameworkFeatures = {
            kind: 'resource_framework_features',
            collection,
            jsonApi,
            with: methodStatementsOr('with', { kind: 'with_absent' }),
            withResponse: methodStatementsOr('withResponse', { kind: 'with_response_absent' }),
            paginationInformation: methodStatementsOr('paginationInformation', { kind: 'pagination_information_absent' }),
            additional: { kind: 'supported_at_invocation' },
            forceWrapping: input.forceWrapping,
            jsonOptions: methodStatementsOr('jsonOptions', { kind: 'json_options_absent' }),
            toJson: methodStatementsOr('toJson', { kind: 'to_json_absent' }),
            toPrettyJson: methodStatementsOr('toPrettyJson', { kind: 'to_pretty_json_absent' }),
            response: methodStatementsOr('response', { kind: 'response_absent' }),
            toResponse: methodStatementsOr('toResponse', { kind: 'to_response_absent' }),
            withProperty: propertyExpressionOr(input.properties, 'with', sourceFile.value.value, { kind: 'with_property_absent' }),
            additionalProperty: propertyExpressionOr(input.properties, 'additional', sourceFile.value.value, { kind: 'additional_property_absent' }),
        };
        const representation: ResourceRepresentation = relationGate(relationEqual(input.baseClass.value.value, 'ResourceCollection'), () => ({ kind: 'json_resource_collection' as const }), () => relationGate(relationEqual(input.baseClass.value.value, 'JsonApiResource'), () => ({ kind: 'json_api_resource' as const }), () => ({ kind: 'json_resource' as const })));
        const modelReference: ModelReference = modelRef(model.name.value.value);
        const response: ResponseReference = responseRef(input.resourceName);
        const resourceClassName: ClassName = { kind: 'class_name', value: { kind: 'string_value', value: input.resourceName.value.value } };
        const properties: Properties = {
            kind: 'properties',
            items: seq(relationProject(input.properties, property => propertyProducer.produce({
                property,
                context: {
                    kind: 'class_property',
                    owner: resourceClassName,
                    declaration: { kind: 'class_property', owner: resourceClassName, role: { kind: 'resource_configuration' } },
                },
                source: {
                    kind: 'source_span',
                    file: input.source.file,
                    start: { kind: 'number_value', value: property.startOffset },
                    end: { kind: 'number_value', value: property.endOffset },
                },
            }).definition))
        };
        const operations = { kind: 'resource_operations' as const, items: seq(relationExpand(fields, field => relationGate(relationEqual(field.output.kind, 'operation'), () => [field.output.operation], () => []))) };
        const contract = {
            kind: 'resource_serialization_contract' as const,
            representation,
            wrapping: input.wrapping,
            inputModel: modelReference,
            requestAware: { kind: 'truth_value', value: true },
            request: transformation.request,
            operations,
            responseCustomization: relationOptionFold(
                relationFirstOption(input.methods, method => relationEqual(method.name.value, 'withResponse')),
                () => ({ kind: 'response_customization_absent' as const }),
                withResponse => ({ kind: 'response_customization_method' as const, withResponse: sourceStatements(withResponse), source: input.source }),
            ),
            fields: { kind: 'resource_fields' as const, items: seq(fields) },
            dynamicEntries,
            framework,
        };
        const baseName: ResourceName = { kind: 'resource_name', value: { kind: 'string_value', value: input.baseClass.value.value } };
        const definition: ResourceDefinition = {
            kind: 'resource', name: input.resourceName, baseName, inheritance, documentation, transformation, model: modelReference, response,
            fields: { kind: 'resource_fields', items: seq(fields) }, assignments, sourceProperties: properties,
            actions: { kind: 'resource_actions', items: seq([]) }, endpoints: { kind: 'route_paths', items: seq([]) },
            synthetic: { kind: 'truth_value', value: false }, contract, framework, source: input.source,
        };
        return { kind: 'resource_ast', definition, source: input.source };
    },
};


function propertyExpressionOr<T>(
    properties: readonly PhpClassPropertyAst[],
    name: string,
    sourceFile: string,
    absent: T,
): Expression | T {
    const catalog = relationProject(properties, property => [property.name.value, property] as const);
    return relationOptionFold(
        relationLookup(catalog, name),
        () => absent,
        property => relationOptionFold(
            relationGate(relationEqual(property.initialization.kind, 'present'), () => relationSome(property.initialization.value), () => relationNone()),
            () => absent,
            value => resolveAstValueToExpression(value, sourceFile).upstream,
        ),
    );
}

function propertyArrayEntryExpressionOr<T>(
    properties: readonly PhpClassPropertyAst[],
    propertyNameValue: string,
    entryName: string,
    sourceFile: string,
    absent: T,
): Expression | T {
    const catalog = relationProject(properties, property => [property.name.value, property] as const);
    return relationOptionFold(
        relationLookup(catalog, propertyNameValue),
        () => absent,
        property => relationGate(
            relationEqual(property.initialization.kind, 'present'),
            () => relationGate(
                relationEqual(property.initialization.value.kind, 'array'),
                () => relationOptionFold(
                    relationLookup(
                        relationProject(
                            relationSelect(property.initialization.value.entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => true, () => false), () => false)),
                            entry => [entry.key.value, entry] as const,
                        ),
                        entryName,
                    ),
                    () => absent,
                    entry => resolveAstValueToExpression(entry.value, sourceFile).upstream,
                ),
                () => absent,
            ),
            () => absent,
        ),
    );
}

function hasPropertyTrue(properties: readonly PhpClassPropertyAst[], name: string): boolean {
    return relationOptionFold(
        relationLookup(relationProject(properties, property => [property.name.value, property] as const), name),
        () => false,
        property => relationGate(
            relationEqual(property.initialization.kind, 'present'),
            () => relationGate(
                relationEqual(property.initialization.value.kind, 'literal'),
                () => relationGate(
                    relationEqual(property.initialization.value.value.kind, 'boolean'),
                    () => property.initialization.value.value.value,
                    () => false,
                ),
                () => false,
            ),
            () => false,
        ),
    );
}
function returnExpression(method: import('../../../semantic/kernel/relationalSequence').RelationOption<PhpMethodAst>, input: ResourceProducerInput, fallback: 'default_resource_type' | 'default_resource_id'): Expression | { readonly kind: 'default_resource_type' } | { readonly kind: 'default_resource_id' } {
    return relationOptionFold(
        method,
        () => ({ kind: fallback }),
        value => relationOptionFold(
            relationFirstOption(value.body, statement => relationEqual(statement.kind, 'return_with_value')),
            () => ({ kind: fallback }),
            statement => relationGate(relationEqual(statement.kind, 'return_with_value'), () => resolveAstValueToExpression(statement.expression, input.source.file.value.value).upstream, () => ({ kind: fallback })),
        ),
    );
}

function buildJsonApiFeatures(
    input: ResourceProducerInput,
    methods: readonly (readonly [string, PhpMethodAst])[],
    sourceStatements: (method: PhpMethodAst) => import('../../../types/upstream/collections').SourceStatements,
): JsonApiResourceFeatures {
    const keyedNames = (entries: readonly PhpArrayEntry[]) => relationProject(
        relationSelect(entries, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => true, () => false), () => false)),
        entry => createPropertyName(entry.key.value),
    );
    const relationships = relationProject(
        relationSelect(input.jsonRelationships, entry => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => true, () => false), () => false)),
        entry => ({
            kind: 'json_api_relationship' as const,
            name: createPropertyName(entry.key.value),
            resource: { kind: 'resource_inference' as const },
            source: sourceSpanFromRange(createSourceFile(input.source.file.value.value), entry.source),
        }),
    );
    const method = (name: string) => relationLookup(methods, name);
    const methodOr = <T>(name: string, absent: T): T | import('../../../types/upstream/collections').SourceStatements => relationOptionFold(method(name), () => absent, sourceStatements);
    const methodOption = (name: string) => relationLookup(methods, name);
    return {
        kind: 'json_api_resource_features',
        attributes: seq(keyedNames(input.jsonAttributes)),
        relationships: seq(relationships),
        toAttributes: methodOr('toAttributes', { kind: 'to_attributes_absent' }),
        toRelationships: methodOr('toRelationships', { kind: 'to_relationships_absent' }),
        type: returnExpression(methodOption('resolveResourceType'), input, 'default_resource_type'),
        id: returnExpression(methodOption('resolveResourceIdentifier'), input, 'default_resource_id'),
        links: methodOr('toLinks', { kind: 'to_links_absent' }),
        meta: methodOr('toMeta', { kind: 'to_meta_absent' }),
        resolveResourceObject: methodOr('resolveResourceObject', { kind: 'resolve_resource_object_absent' }),
        resolveResourceIdentifier: methodOr('resolveResourceIdentifier', { kind: 'resolve_resource_identifier_absent' }),
        resolveResourceType: methodOr('resolveResourceType', { kind: 'resolve_resource_type_absent' }),
        resolveResourceAttributes: methodOr('resolveResourceAttributes', { kind: 'resolve_resource_attributes_absent' }),
        resolveResourceRelationshipIdentifiers: methodOr('resolveResourceRelationshipIdentifiers', { kind: 'resolve_resource_relationship_identifiers_absent' }),
        compileResourceRelationships: methodOr('compileResourceRelationships', { kind: 'compile_resource_relationships_absent' }),
        resolveIncludedResourceObjects: methodOr('resolveIncludedResourceObjects', { kind: 'resolve_included_resource_objects_absent' }),
        resolveResourceLinks: methodOr('resolveResourceLinks', { kind: 'resolve_resource_links_absent' }),
        resolveResourceMetaInformation: methodOr('resolveResourceMetaInformation', { kind: 'resolve_resource_meta_information_absent' }),
        respectFieldsAndIncludesMethod: methodOr('respectFieldsAndIncludes', { kind: 'respect_fields_and_includes_method_absent' }),
        ignoreFieldsAndIncludesInQueryString: methodOr('ignoreFieldsAndIncludesInQueryString', { kind: 'ignore_fields_and_includes_absent' }),
        includePreviouslyLoadedRelationships: relationGate(input.includesPreviouslyLoadedRelationships.value, () => methodOr('includePreviouslyLoadedRelationships', { kind: 'include_previously_loaded_relationships_absent' }), () => ({ kind: 'include_previously_loaded_relationships_absent' as const })),
        resolveJsonApiRequestFrom: methodOr('resolveJsonApiRequestFrom', { kind: 'resolve_json_api_request_absent' }),
        configure: methodOr('configure', { kind: 'json_api_configure_absent' }),
        sparseFieldsets: relationGate(hasPropertyTrue(input.properties, 'sparseFieldsets'), () => ({ kind: 'enabled' as const }), () => ({ kind: 'disabled' as const })),
        includes: relationGate(hasPropertyTrue(input.properties, 'includes'), () => ({ kind: 'enabled' as const }), () => ({ kind: 'disabled' as const })),
        previouslyLoadedRelationships: relationGate(input.includesPreviouslyLoadedRelationships.value, () => ({ kind: 'enabled' as const }), () => ({ kind: 'disabled' as const })),
        requestQueryIncludesRespect: relationGate(input.usesRequestQueryString.value, () => ({ kind: 'enabled' as const }), () => ({ kind: 'disabled' as const })),
        maxRelationshipDepth: propertyExpressionOr(input.properties, 'maxRelationshipDepth', input.source.file.value.value, { kind: 'default_relationship_depth' }),
        jsonApiInformation: propertyExpressionOr(input.properties, 'jsonApiInformation', input.source.file.value.value, { kind: 'json_api_configuration_absent' }),
        jsonApiVersion: propertyExpressionOr(input.properties, 'jsonApiVersion', input.source.file.value.value, { kind: 'json_api_version_absent' }),
        jsonApiExtensions: propertyExpressionOr(input.properties, 'jsonApiExtensions', input.source.file.value.value, { kind: 'json_api_extensions_absent' }),
        jsonApiProfiles: propertyExpressionOr(input.properties, 'jsonApiProfiles', input.source.file.value.value, { kind: 'json_api_profiles_absent' }),
        jsonApiMetaConfiguration: propertyExpressionOr(input.properties, 'jsonApiMeta', input.source.file.value.value, { kind: 'json_api_meta_configuration_absent' }),
        resourceLinksProperty: propertyExpressionOr(input.properties, 'links', input.source.file.value.value, { kind: 'resource_links_property_absent' }),
        resourceMetaProperty: propertyExpressionOr(input.properties, 'meta', input.source.file.value.value, { kind: 'resource_meta_property_absent' }),
    };
}

function resourceDynamicEntry(entry: PhpArrayEntry, file: string): readonly ResourceDynamicEntry[] {
    const value = resolveAstValueToExpression(entry.value, file).upstream;
    const source = sourceSpanFromRange(createSourceFile(file), entry.source);
    return relationGate(relationEqual(entry.kind, 'positional'), () => [{ kind: 'positional' as const, value, source }], () => relationGate(
        relationEqual(entry.kind, 'unpacked'),
        () => [{ kind: 'unpacked' as const, value, source }],
        () => relationGate(
            relationEqual(entry.kind, 'keyed'),
            () => relationGate(relationEqual(entry.key.kind, 'string'), () => [], () => relationGate(
                relationEqual(entry.key.kind, 'integer'),
                () => [{ kind: 'integer_key' as const, key: { kind: 'number_value', value: entry.key.value }, value, source }],
                () => [{ kind: 'dynamic_key' as const, key: resolveAstValueToExpression(entry.key.value, file).upstream, value, source }],
            )),
            () => [],
        ),
    ));
}

function seq<T>(items: readonly T[], index = 0): Sequence<T> {
    return relationGate(index >= items.length, () => ({ kind: 'empty' as const }), () => ({ kind: 'cons' as const, head: items[index], tail: seq(items, index + 1) }));
}
