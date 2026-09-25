import type { Expression } from './expression';
import type { ActionName, ClassName, MethodName, PropertyName, ResourceName, RoutePath } from './names';
import type { StringValue } from './valueObjects';
import type { Assignments, Properties, ResourceFields, ResourceActions, RoutePaths, Sequence, SourceStatements } from './collections';
import type { TypeExpression } from './typeVocabulary';
import type { Presence } from './primitiveVocabulary';
import type { SourceSpan } from './provenance';
import type { TruthValue } from './valueObjects';
import type { ModelReference, PropertyReference, ResourceReference, ResponseReference } from './semanticReferences';
import type { EloquentRelationCardinality, ModelPropertyMultiplicity } from './model';
import type { ModelRelationTargetShape, ModelRelationTraversalTarget } from './modelSourceFacts';


export type ResourceDocumentation = {
  readonly kind: 'resource_documentation';
  readonly mixins: Sequence<ModelReference>;
  readonly source: SourceSpan;
};

export type ResourceInheritance = {
  readonly kind: 'resource_inheritance';
  readonly base: ClassName;
  readonly source: SourceSpan;
};

export type ResourceTransformation = {
  readonly kind: 'resource_transformation';
  readonly method: MethodName;
  readonly visibility: import('./model').ModelMethodVisibility;
  readonly request: ResourceRequestAwareness;
  readonly returnType: TypeExpression;
  readonly body: SourceStatements;
  readonly source: SourceSpan;
};

export type ResourceFieldOperation = Exclude<
  import('./resourceVocabulary').ResourceOperation,
  | { readonly kind: 'additional' }
  | { readonly kind: 'with' }
>;

export type ResourceRepresentation =
  | { readonly kind: 'json_resource' }
  | { readonly kind: 'json_resource_collection' }
  | { readonly kind: 'json_api_resource' };

export type ResourceWrapping =
  | { readonly kind: 'framework_default' }
  | { readonly kind: 'wrapped'; readonly key: StringValue }
  | { readonly kind: 'unwrapped' };

export type ResourceFieldPresence =
  | { readonly kind: 'always_present' }
  | { readonly kind: 'relation_loaded'; readonly relation: import('./names').RelationName }
  | { readonly kind: 'conditional'; readonly condition: Expression }
  | { readonly kind: 'null_when_unavailable' };

export type ResourceRequestAwareness =
  | { readonly kind: 'request_parameter_declared'; readonly parameter: import('./names').VariableName }
  | { readonly kind: 'request_parameter_unused'; readonly parameter: import('./names').VariableName }
  | { readonly kind: 'request_parameter_used'; readonly parameter: import('./names').VariableName; readonly expressions: import('./collections').Expressions };

export type ResourceOperations = { readonly kind: 'resource_operations'; readonly items: Sequence<import('./resourceVocabulary').ResourceOperation> };


export type ResourceDynamicEntry =
  | { readonly kind: 'dynamic_key'; readonly key: Expression; readonly value: Expression; readonly source: SourceSpan }
  | { readonly kind: 'integer_key'; readonly key: import('./valueObjects').NumberValue; readonly value: Expression; readonly source: SourceSpan }
  | { readonly kind: 'positional'; readonly value: Expression; readonly source: SourceSpan }
  | { readonly kind: 'unpacked'; readonly value: Expression; readonly source: SourceSpan };

export type ResourceDynamicEntries = { readonly kind: 'resource_dynamic_entries'; readonly items: Sequence<ResourceDynamicEntry> };

export type ResourceFieldOutput =
  | { readonly kind: 'scalar_or_expression'; readonly expression: Expression }
  | { readonly kind: 'operation'; readonly operation: ResourceFieldOperation }
  | { readonly kind: 'nested_object'; readonly fields: ResourceFields; readonly dynamicEntries: ResourceDynamicEntries }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly expression: Expression }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceReference; readonly expression: Expression };


export type ResourceResponseCustomization =
  | { readonly kind: 'response_customization_absent' }
  | {
      readonly kind: 'response_customization_present';
      readonly jsonOptions: Expression;
      readonly withResponse: SourceStatements;
      readonly source: SourceSpan;
    }
  | {
      readonly kind: 'response_customization_method';
      readonly withResponse: SourceStatements;
      readonly source: SourceSpan;
    };

export type ResourceCollectionFeatures = {
  readonly kind: 'resource_collection_features';
  readonly preserveKeys: TruthValue;
  readonly collects: ResourceReference | { readonly kind: 'collection_resource_inference' };
  readonly paginationInformation: SourceStatements | { readonly kind: 'pagination_information_absent' };
  readonly preserveQuery: SourceStatements | { readonly kind: 'preserve_query_absent' };
  readonly withQuery: SourceStatements | { readonly kind: 'with_query_absent' };
  readonly count: SourceStatements | { readonly kind: 'count_override_absent' };
};

export type JsonApiRelationshipDeclaration = {
  readonly kind: 'json_api_relationship';
  readonly name: PropertyName;
  readonly resource: ResourceReference | { readonly kind: 'resource_inference' };
  readonly source: SourceSpan;
};

export type JsonApiResourceFeatures = {
  readonly kind: 'json_api_resource_features';
  readonly attributes: Sequence<PropertyName>;
  readonly relationships: Sequence<JsonApiRelationshipDeclaration>;
  readonly toAttributes: SourceStatements | { readonly kind: 'to_attributes_absent' };
  readonly toRelationships: SourceStatements | { readonly kind: 'to_relationships_absent' };
  readonly type: Expression | { readonly kind: 'default_resource_type' };
  readonly id: Expression | { readonly kind: 'default_resource_id' };
  readonly links: SourceStatements | { readonly kind: 'to_links_absent' };
  readonly meta: SourceStatements | { readonly kind: 'to_meta_absent' };
  readonly resolveResourceObject: SourceStatements | { readonly kind: 'resolve_resource_object_absent' };
  readonly resolveResourceIdentifier: SourceStatements | { readonly kind: 'resolve_resource_identifier_absent' };
  readonly resolveResourceType: SourceStatements | { readonly kind: 'resolve_resource_type_absent' };
  readonly resolveResourceAttributes: SourceStatements | { readonly kind: 'resolve_resource_attributes_absent' };
  readonly resolveResourceRelationshipIdentifiers: SourceStatements | { readonly kind: 'resolve_resource_relationship_identifiers_absent' };
  readonly compileResourceRelationships: SourceStatements | { readonly kind: 'compile_resource_relationships_absent' };
  readonly resolveIncludedResourceObjects: SourceStatements | { readonly kind: 'resolve_included_resource_objects_absent' };
  readonly resolveResourceLinks: SourceStatements | { readonly kind: 'resolve_resource_links_absent' };
  readonly resolveResourceMetaInformation: SourceStatements | { readonly kind: 'resolve_resource_meta_information_absent' };
  readonly respectFieldsAndIncludesMethod: SourceStatements | { readonly kind: 'respect_fields_and_includes_method_absent' };
  readonly ignoreFieldsAndIncludesInQueryString: SourceStatements | { readonly kind: 'ignore_fields_and_includes_absent' };
  readonly includePreviouslyLoadedRelationships: SourceStatements | { readonly kind: 'include_previously_loaded_relationships_absent' };
  readonly resolveJsonApiRequestFrom: SourceStatements | { readonly kind: 'resolve_json_api_request_absent' };
  readonly configure: SourceStatements | { readonly kind: 'json_api_configure_absent' };
  readonly sparseFieldsets: { readonly kind: 'enabled' } | { readonly kind: 'disabled' };
  readonly includes: { readonly kind: 'enabled' } | { readonly kind: 'disabled' };
  readonly previouslyLoadedRelationships: { readonly kind: 'enabled' } | { readonly kind: 'disabled' };
  readonly requestQueryIncludesRespect: { readonly kind: 'enabled' } | { readonly kind: 'disabled' };
  readonly maxRelationshipDepth: Expression | { readonly kind: 'default_relationship_depth' };
  readonly jsonApiInformation: Expression | { readonly kind: 'json_api_configuration_absent' };
  readonly jsonApiVersion: Expression | { readonly kind: 'json_api_version_absent' };
  readonly jsonApiExtensions: Expression | { readonly kind: 'json_api_extensions_absent' };
  readonly jsonApiProfiles: Expression | { readonly kind: 'json_api_profiles_absent' };
  readonly jsonApiMetaConfiguration: Expression | { readonly kind: 'json_api_meta_configuration_absent' };
  readonly resourceLinksProperty: Expression | { readonly kind: 'resource_links_property_absent' };
  readonly resourceMetaProperty: Expression | { readonly kind: 'resource_meta_property_absent' };
};

export type ResourceFrameworkFeatures = {
  readonly kind: 'resource_framework_features';
  readonly collection: ResourceCollectionFeatures;
  readonly jsonApi: JsonApiResourceFeatures | { readonly kind: 'json_api_absent' };
  readonly with: SourceStatements | { readonly kind: 'with_absent' };
  readonly withResponse: SourceStatements | { readonly kind: 'with_response_absent' };
  readonly paginationInformation: SourceStatements | { readonly kind: 'pagination_information_absent' };
  readonly additional: { readonly kind: 'supported_at_invocation' };
  readonly forceWrapping: TruthValue;
  readonly jsonOptions: SourceStatements | { readonly kind: 'json_options_absent' };
  readonly toJson: SourceStatements | { readonly kind: 'to_json_absent' };
  readonly toPrettyJson: SourceStatements | { readonly kind: 'to_pretty_json_absent' };
  readonly response: SourceStatements | { readonly kind: 'response_absent' };
  readonly toResponse: SourceStatements | { readonly kind: 'to_response_absent' };
  readonly withProperty: Expression | { readonly kind: 'with_property_absent' };
  readonly additionalProperty: Expression | { readonly kind: 'additional_property_absent' };
};

export type ResourceSerializationContract = {
  readonly kind: 'resource_serialization_contract';
  readonly representation: ResourceRepresentation;
  readonly wrapping: ResourceWrapping;
  readonly inputModel: ModelReference;
  readonly requestAware: TruthValue;
  readonly request: ResourceRequestAwareness;
  readonly operations: ResourceOperations;
  readonly responseCustomization: ResourceResponseCustomization;
  readonly fields: ResourceFields;
  readonly dynamicEntries: ResourceDynamicEntries;
  readonly framework: ResourceFrameworkFeatures;
};

export type ResourceRelationProjection =
  | { readonly kind: 'value'; readonly expression: Expression }
  | {
      readonly kind: 'resource';
      readonly resource: ResourceReference;
      readonly targetModel: ModelReference;
      readonly cardinality: EloquentRelationCardinality;
      readonly multiplicity: ModelPropertyMultiplicity;
      readonly targetShape: ModelRelationTargetShape;
      readonly traversalTarget: ModelRelationTraversalTarget;
    };

export type ResourceFieldMeaning =
  | { readonly kind: 'property_projection'; readonly property: PropertyReference; readonly model: ModelReference }
  | { readonly kind: 'relation_projection'; readonly relation: PropertyReference; readonly projection: ResourceRelationProjection }
  | { readonly kind: 'computed_projection'; readonly expression: Expression };

export type ResourceField = {
  readonly kind: 'resource_field';
  readonly name: PropertyName;
  readonly expression: Expression;
  readonly meaning: ResourceFieldMeaning;
  readonly type: TypeExpression;
  readonly presence: ResourceFieldPresence;
  readonly output: ResourceFieldOutput;
  readonly source: SourceSpan;
};

export type ResourceFacts = {
  readonly kind: 'resource_facts';
  readonly identity: ResourceReference;
  readonly model: ModelReference;
  readonly response: ResponseReference;
  readonly fields: ResourceFields;
  readonly assignments: Assignments;
  readonly sourceProperties: Properties;
  readonly actions: ResourceActions;
  readonly endpoints: RoutePaths;
  readonly synthetic: TruthValue;
  readonly contract: ResourceSerializationContract;
  readonly source: SourceSpan;
};

export type ResourceDefinition = {
  readonly kind: 'resource';
  readonly name: ResourceName;
  readonly baseName: ResourceName;
  readonly inheritance: ResourceInheritance;
  readonly documentation: ResourceDocumentation;
  readonly transformation: ResourceTransformation;
  readonly model: ModelReference;
  readonly response: ResponseReference;
  readonly fields: ResourceFields;
  readonly assignments: Assignments;
  readonly sourceProperties: Properties;
  readonly actions: ResourceActions;
  readonly endpoints: RoutePaths;
  readonly synthetic: TruthValue;
  readonly contract: ResourceSerializationContract;
  readonly framework: ResourceFrameworkFeatures;
  readonly source: SourceSpan;
};

export type ResourceBody = { readonly kind: 'body_absent' } | { readonly kind: 'body_present' };
export type ResourceResponsePresence = { readonly kind: 'response_absent' } | { readonly kind: 'response_present' };
export type ResourceAction = {
  readonly kind: 'resource_action';
  readonly name: ActionName;
  readonly method: import('./route').RouteMethod;
  readonly body: ResourceBody;
  readonly response: ResourceResponsePresence;
  readonly routes: RoutePaths;
};
export type ResourceResponse =
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceName }
  | { readonly kind: 'resource_paginated'; readonly resource: ResourceName };
