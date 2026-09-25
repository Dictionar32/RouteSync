import type { ResourceAst } from "../../../types/upstream/ast";
import type { ResourceDefinition, ResourceField, ResourceTransformation, ResourceInheritance, ResourceDocumentation, ResourceRepresentation, ResourceDynamicEntry, ResourceDynamicEntries } from "../../../types/upstream/resource";
import type { Assignments, Properties, Sequence } from "../../../types/upstream/collections";
import type { Expression } from "../../../types/upstream/expression";
import type { PropertyType } from "../../../types/upstream/property";
import type { ResponseReference, ModelReference } from "../../../types/upstream/semanticReferences";
import type { SourceFile } from "../../../types/upstream/names";
import { produceResourceField } from "./resource/resourceFieldProducer";
import { propertyProducer } from './model/propertyProducer';
import { mapResourcePhpStatementsToSourceStatements } from "./resource/resourceUpstreamExpressionCanonical";
import { mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode, sourceSpanFromRange } from "./resource/resourceUpstreamExpressionMappings";
import { mapAstValueToExpression } from "./resource/resourceAstExpressionMapper";
import { responseRef, modelRef } from "../../../types/upstream/semanticReferences";
import type { SourceSpan } from "../../../types/upstream/provenance";
import type { ResourceName, ClassName, VariableName } from "../../../types/upstream/names";
import { createSourceFile } from "../../../types/upstream/names";
import type { PhpArrayEntry } from "../lexer/PhpAst";
import type { PhpArrayKey } from "../lexer/phpAstExpressionTypes";
import type { PhpClassPropertyAst } from "../lexer/phpAstDeclarationTypes";
import type { PhpStatement } from "../lexer/phpAstTypes";
import type { PhpMethodAst } from "../lexer/phpMethodAstTypes";
import type { ResourceWrapping, ResourceFrameworkFeatures, ResourceCollectionFeatures, JsonApiResourceFeatures, JsonApiRelationshipDeclaration } from "../../../types/upstream/resource";
import type { ModelReference } from "../../../types/upstream/semanticReferences";
import type { OriginModelSymbol } from "../symbols/model/originModelSymbol";

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
        const fields: ResourceField[] = input.entries.flatMap(entry => {
            if (entry.kind !== 'keyed' || entry.key.kind !== 'string') return [];
            return [produceResourceField(entry.key.value, entry.value, sourceFile.value.value, input.resourceName.value.value, model)];
        });
        const dynamicEntries: ResourceDynamicEntries = {
            kind: 'resource_dynamic_entries',
            items: seq(input.entries.flatMap(entry => resourceDynamicEntry(entry, sourceFile.value.value))),
        };
        const assignments: Assignments = {
            kind: 'assignments',
            items: seq(input.assignments.filter((statement): statement is Extract<PhpStatement, { kind: 'assignment' }> => statement.kind === 'assignment').map(statement => {
                const expression: Expression = mapAstValueToExpression(statement.value, sourceFile.value.value).upstream;
                return {
                    kind: 'assignment' as const,
                    target: mapAssignmentTarget(statement.target, (value, file) => mapAstValueToExpression(value, file).upstream, sourceFile.value.value),
                    expression,
                    operator: mapAssignmentOperator(statement.operator.kind),
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
        const methods = new Map(input.methods.map(method => [method.name.value, method] as const));
        const sourceStatements = (method: PhpMethodAst | undefined) => method === undefined
            ? undefined
            : mapResourcePhpStatementsToSourceStatements(method.body, sourceFile.value.value);
        const propertyValue = (name: string): PhpArrayEntry[] => {
            const property = input.properties.find(item => item.name.value === name);
            if (property?.initialization.kind !== 'present') return [];
            const value = property.initialization.value;
            return value.kind === 'array' ? value.entries : [];
        };
        const jsonApi = input.baseClass.value.value === 'JsonApiResource' ? buildJsonApiFeatures(input, methods, sourceStatements) : { kind: 'json_api_absent' as const };
        const collection: ResourceCollectionFeatures = {
            kind: 'resource_collection_features',
            preserveKeys: input.preserveKeys,
            collects: input.collectsResource,
            paginationInformation: sourceStatements(methods.get('paginationInformation')) ?? { kind: 'pagination_information_absent' },
            preserveQuery: sourceStatements(methods.get('preserveQuery')) ?? { kind: 'preserve_query_absent' },
            withQuery: sourceStatements(methods.get('withQuery')) ?? { kind: 'with_query_absent' },
            count: sourceStatements(methods.get('count')) ?? { kind: 'count_override_absent' },
        };
        const framework: ResourceFrameworkFeatures = {
            kind: 'resource_framework_features',
            collection,
            jsonApi,
            with: sourceStatements(methods.get('with')) ?? { kind: 'with_absent' },
            withResponse: sourceStatements(methods.get('withResponse')) ?? { kind: 'with_response_absent' },
            paginationInformation: sourceStatements(methods.get('paginationInformation')) ?? { kind: 'pagination_information_absent' },
            additional: { kind: 'supported_at_invocation' },
            forceWrapping: input.forceWrapping,
            jsonOptions: sourceStatements(methods.get('jsonOptions')) ?? { kind: 'json_options_absent' },
            toJson: sourceStatements(methods.get('toJson')) ?? { kind: 'to_json_absent' },
            toPrettyJson: sourceStatements(methods.get('toPrettyJson')) ?? { kind: 'to_pretty_json_absent' },
            response: sourceStatements(methods.get('response')) ?? { kind: 'response_absent' },
            toResponse: sourceStatements(methods.get('toResponse')) ?? { kind: 'to_response_absent' },
            withProperty: propertyExpressionOr(input.properties, 'with', sourceFile.value.value, { kind: 'with_property_absent' }),
            additionalProperty: propertyExpressionOr(input.properties, 'additional', sourceFile.value.value, { kind: 'additional_property_absent' }),
        };
        const representation: ResourceRepresentation = input.baseClass.value.value === 'ResourceCollection' ? { kind: 'json_resource_collection' } : input.baseClass.value.value === 'JsonApiResource' ? { kind: 'json_api_resource' } : { kind: 'json_resource' };
        const modelReference: ModelReference = modelRef(model.name.value.value);
        const response: ResponseReference = responseRef(input.resourceName);
        const resourceClassName: ClassName = { kind: 'class_name', value: { kind: 'string_value', value: input.resourceName.value.value } };
        const properties: Properties = {
            kind: 'properties',
            items: seq(input.properties.map(property => propertyProducer.produce({
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
        const operations = { kind: 'resource_operations' as const, items: seq(fields.flatMap(field => field.output.kind === 'operation' ? [field.output.operation] : [])) };
        const contract = {
            kind: 'resource_serialization_contract' as const,
            representation,
            wrapping: input.wrapping,
            inputModel: modelReference,
            requestAware: { kind: 'truth_value', value: true },
            request: transformation.request,
            operations,
            responseCustomization: input.methods.some(method => method.name.value === 'withResponse') ? { kind: 'response_customization_method' as const, withResponse: sourceStatements(input.methods.find(method => method.name.value === 'withResponse'))!, source: input.source } : { kind: 'response_customization_absent' as const },
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
    const property = properties.find(item => item.name.value === name);
    if (property?.initialization.kind !== 'present') return absent;
    return mapAstValueToExpression(property.initialization.value, sourceFile).upstream;
}

function propertyArrayEntryExpressionOr<T>(
    properties: readonly PhpClassPropertyAst[],
    propertyNameValue: string,
    entryName: string,
    sourceFile: string,
    absent: T,
): Expression | T {
    const property = properties.find(item => item.name.value === propertyNameValue);
    if (property?.initialization.kind !== 'present' || property.initialization.value.kind !== 'array') return absent;
    const entry = property.initialization.value.entries.find(item => item.kind === 'keyed' && item.key.kind === 'string' && item.key.value === entryName);
    if (entry?.kind !== 'keyed') return absent;
    return mapAstValueToExpression(entry.value, sourceFile).upstream;
}

function hasPropertyTrue(properties: readonly PhpClassPropertyAst[], name: string): boolean {
    const property = properties.find(item => item.name.value === name);
    return property?.initialization.kind === 'present' && property.initialization.value.kind === 'literal' && property.initialization.value.value.kind === 'boolean' && property.initialization.value.value.value;
}
function returnExpression(method: PhpMethodAst | undefined, input: ResourceProducerInput, fallback: 'default_resource_type' | 'default_resource_id'): Expression | { readonly kind: 'default_resource_type' } | { readonly kind: 'default_resource_id' } {
    const returned = method?.body.find(statement => statement.kind === 'return_with_value');
    return returned?.kind === 'return_with_value' ? mapAstValueToExpression(returned.expression, input.source.file.value.value).upstream : { kind: fallback };
}

function buildJsonApiFeatures(input: ResourceProducerInput, methods: ReadonlyMap<string, PhpMethodAst>, sourceStatements: (method: PhpMethodAst | undefined) => import('../../../types/upstream/collections').SourceStatements | undefined): JsonApiResourceFeatures {
    const attributeEntries = input.jsonAttributes;
    const relationshipEntries = input.jsonRelationships;
    const attributes = seq(attributeEntries.flatMap(entry => entry.kind === 'positional' && entry.value.kind === 'literal' && entry.value.value.kind === 'string' ? [{ kind: 'property_name' as const, value: { kind: 'string_value' as const, value: entry.value.value.value } }] : []));
    const relationships = seq(relationshipEntries.flatMap(entry => {
        if (entry.kind === 'positional' && entry.value.kind === 'literal' && entry.value.value.kind === 'string') return [{ kind: 'json_api_relationship' as const, name: { kind: 'property_name' as const, value: { kind: 'string_value' as const, value: entry.value.value.value } }, resource: { kind: 'resource_inference' as const }, source: input.source }];
        if (entry.kind === 'keyed' && entry.key.kind === 'string') return [{ kind: 'json_api_relationship' as const, name: { kind: 'property_name' as const, value: { kind: 'string_value' as const, value: entry.key.value } }, resource: { kind: 'resource_inference' as const }, source: input.source }];
        return [];
    }));
    return {
        kind: 'json_api_resource_features',
        attributes,
        relationships,
        toAttributes: sourceStatements(methods.get('toAttributes')) ?? { kind: 'to_attributes_absent' },
        toRelationships: sourceStatements(methods.get('toRelationships')) ?? { kind: 'to_relationships_absent' },
        type: returnExpression(methods.get('toType'), input, 'default_resource_type'),
        id: returnExpression(methods.get('toId'), input, 'default_resource_id'),
        links: sourceStatements(methods.get('toLinks')) ?? { kind: 'to_links_absent' },
        meta: sourceStatements(methods.get('toMeta')) ?? { kind: 'to_meta_absent' },
        resolveResourceObject: sourceStatements(methods.get('resolveResourceObject')) ?? { kind: 'resolve_resource_object_absent' },
        resolveResourceIdentifier: sourceStatements(methods.get('resolveResourceIdentifier')) ?? { kind: 'resolve_resource_identifier_absent' },
        resolveResourceType: sourceStatements(methods.get('resolveResourceType')) ?? { kind: 'resolve_resource_type_absent' },
        resolveResourceAttributes: sourceStatements(methods.get('resolveResourceAttributes')) ?? { kind: 'resolve_resource_attributes_absent' },
        resolveResourceRelationshipIdentifiers: sourceStatements(methods.get('resolveResourceRelationshipIdentifiers')) ?? { kind: 'resolve_resource_relationship_identifiers_absent' },
        compileResourceRelationships: sourceStatements(methods.get('compileResourceRelationships')) ?? { kind: 'compile_resource_relationships_absent' },
        resolveIncludedResourceObjects: sourceStatements(methods.get('resolveIncludedResourceObjects')) ?? { kind: 'resolve_included_resource_objects_absent' },
        resolveResourceLinks: sourceStatements(methods.get('resolveResourceLinks')) ?? { kind: 'resolve_resource_links_absent' },
        resolveResourceMetaInformation: sourceStatements(methods.get('resolveResourceMetaInformation')) ?? { kind: 'resolve_resource_meta_information_absent' },
        respectFieldsAndIncludesMethod: sourceStatements(methods.get('respectFieldsAndIncludesInQueryString')) ?? { kind: 'respect_fields_and_includes_method_absent' },
        ignoreFieldsAndIncludesInQueryString: sourceStatements(methods.get('ignoreFieldsAndIncludesInQueryString')) ?? { kind: 'ignore_fields_and_includes_absent' },
        includePreviouslyLoadedRelationships: sourceStatements(methods.get('includePreviouslyLoadedRelationships')) ?? { kind: 'include_previously_loaded_relationships_absent' },
        resolveJsonApiRequestFrom: sourceStatements(methods.get('resolveJsonApiRequestFrom')) ?? { kind: 'resolve_json_api_request_absent' },
        configure: sourceStatements(methods.get('configure')) ?? { kind: 'json_api_configure_absent' },
        sparseFieldsets: input.usesRequestQueryString.value ? { kind: 'enabled' } : { kind: 'disabled' },
        includes: input.usesRequestQueryString.value ? { kind: 'enabled' } : { kind: 'disabled' },
        previouslyLoadedRelationships: input.includesPreviouslyLoadedRelationships.value ? { kind: 'enabled' } : { kind: 'disabled' },
        requestQueryIncludesRespect: input.usesRequestQueryString.value ? { kind: 'enabled' } : { kind: 'disabled' },
        maxRelationshipDepth: methods.get('maxRelationshipDepth')?.body.find(statement => statement.kind === 'return_with_value')?.kind === 'return_with_value' ? mapAstValueToExpression(methods.get('maxRelationshipDepth')!.body.find(statement => statement.kind === 'return_with_value')!.expression, input.source.file.value.value).upstream : { kind: 'default_relationship_depth' },
        jsonApiInformation: propertyExpressionOr(input.properties, 'jsonApiInformation', input.source.file.value.value, { kind: 'json_api_configuration_absent' }),
        jsonApiVersion: propertyArrayEntryExpressionOr(input.properties, 'jsonApiInformation', 'version', input.source.file.value.value, { kind: 'json_api_version_absent' }),
        jsonApiExtensions: propertyArrayEntryExpressionOr(input.properties, 'jsonApiInformation', 'ext', input.source.file.value.value, { kind: 'json_api_extensions_absent' }),
        jsonApiProfiles: propertyArrayEntryExpressionOr(input.properties, 'jsonApiInformation', 'profile', input.source.file.value.value, { kind: 'json_api_profiles_absent' }),
        jsonApiMetaConfiguration: propertyArrayEntryExpressionOr(input.properties, 'jsonApiInformation', 'meta', input.source.file.value.value, { kind: 'json_api_meta_configuration_absent' }),
        resourceLinksProperty: propertyExpressionOr(input.properties, 'jsonApiLinks', input.source.file.value.value, { kind: 'resource_links_property_absent' }),
        resourceMetaProperty: propertyExpressionOr(input.properties, 'jsonApiMeta', input.source.file.value.value, { kind: 'resource_meta_property_absent' }),
    };
}

function resourceDynamicEntry(entry: PhpArrayEntry, file: string): readonly ResourceDynamicEntry[] {
    const value = mapAstValueToExpression(entry.value, file).upstream;
    const source = sourceSpanFromRange(createSourceFile(file), entry.source);
    switch (entry.kind) {
        case 'positional': return [{ kind: 'positional', value, source }];
        case 'unpacked': return [{ kind: 'unpacked', value, source }];
        case 'keyed':
            switch (entry.key.kind) {
                case 'string': return [];
                case 'integer': return [{ kind: 'integer_key', key: { kind: 'number_value', value: entry.key.value }, value, source }];
                case 'expression': return [{ kind: 'dynamic_key', key: mapAstValueToExpression(entry.key.value, file).upstream, value, source }];
            }
    }
}

function seq<T>(items: readonly T[]): Sequence<T> {
    return items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
}
