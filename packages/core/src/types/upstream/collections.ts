import type { Assignment } from './assignment';
import type { SourceStatement, SourceCatchHandler } from './sourceStatements';
import type { Expression, ResolvedExpression } from './expression';
import type { ModelAccessor, ModelCast, ModelConstant, ModelMethod, ModelRelation } from './model';
import type { PropertyDefinition } from './property';
import type { RequestField, ValidationRule } from './request';
import type { ResourceAction, ResourceField } from './resource';
import type { RouteAst, ModelAst, ResourceAst, RequestAst, ControllerAst, ServiceAst, MigrationAst, ResponseAst, DtoAst, MiddlewareAst, ProviderAst, AttributeAst } from './ast';
import type { RouteMiddleware, RouteMethod, RouteParameter } from './route';
import type { ColumnDefinition, ForeignKey, IndexDefinition } from './databaseVocabulary';
import type { RelationName, PropertyName, VariableName, TraitName } from './names';
import type { SemanticValue } from './primitiveVocabulary';
import type { ServiceParameter } from './service';
import type { CompletenessFailure } from './completeness';

export type Option<T> =
  | { readonly kind: 'none' }
  | { readonly kind: 'some'; readonly value: T };

export type Lookup<T> =
  | { readonly kind: 'missing' }
  | { readonly kind: 'found'; readonly value: T };

export type LookupVisitor<T, R> = {
  readonly missing: (lookup: Extract<Lookup<T>, { readonly kind: 'missing' }>) => R;
  readonly found: (lookup: Extract<Lookup<T>, { readonly kind: 'found' }>) => R;
};

export function matchLookup<T, R>(lookup: Lookup<T>, visitor: LookupVisitor<T, R>): R {
  switch (lookup.kind) {
    case 'missing': return visitor.missing(lookup);
    case 'found': return visitor.found(lookup);
  }
}

export type Sequence<T> = { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: Sequence<T> };
export type Discovered<T> = { readonly kind: 'discovered_empty' } | { readonly kind: 'discovered_many'; readonly items: Sequence<T> };
export type SourceDiscovery<T> = { readonly kind: 'not_scanned' } | { readonly kind: 'scanned'; readonly result: Discovered<T> };

export type SourceDiscoveryVisitor<T, R> = {
  readonly notScanned: (discovery: Extract<SourceDiscovery<T>, { readonly kind: 'not_scanned' }>) => R;
  readonly scanned: (discovery: Extract<SourceDiscovery<T>, { readonly kind: 'scanned' }>) => R;
};

export function matchSourceDiscovery<T, R>(discovery: SourceDiscovery<T>, visitor: SourceDiscoveryVisitor<T, R>): R {
  return {
    not_scanned: () => visitor.notScanned(discovery),
    scanned: () => visitor.scanned(discovery),
  }[discovery.kind]();
}

export function matchDiscovered<T, R>(discovery: Discovered<T>, visitor: {
  readonly empty: (value: Extract<Discovered<T>, { readonly kind: 'discovered_empty' }>) => R;
  readonly many: (value: Extract<Discovered<T>, { readonly kind: 'discovered_many' }>) => R;
}): R {
  return {
    discovered_empty: () => visitor.empty(discovery),
    discovered_many: () => visitor.many(discovery),
  }[discovery.kind]();
}

export type SemanticValues = { readonly kind: 'semantic_values'; readonly items: Sequence<SemanticValue> };
export type PropertyNames = { readonly kind: 'property_names'; readonly items: Sequence<PropertyName> };
export type Expressions = { readonly kind: 'expressions'; readonly items: Sequence<Expression> };
export type SqlExpressions = { readonly kind: 'sql_expressions'; readonly items: Sequence<import('./expression').SqlExpression> };
export type ResolvedExpressions = { readonly kind: 'resolved_expressions'; readonly items: Sequence<ResolvedExpression> };
export type Assignments = { readonly kind: 'assignments'; readonly items: Sequence<Assignment> };
export type CatchHandlers = { readonly kind: 'catch_handlers'; readonly items: Sequence<SourceCatchHandler> };
export type ObjectProperties = { readonly kind: 'object_properties'; readonly items: Sequence<import('./expression').ObjectProperty> };
export type MatchArms = { readonly kind: 'match_arms'; readonly items: Sequence<import('./expression').MatchArm> };
export type SourceStatements = { readonly kind: 'source_statements'; readonly items: Sequence<SourceStatement> };
export type Properties = { readonly kind: 'properties'; readonly items: Sequence<PropertyDefinition> };
export type ModelRelations = { readonly kind: 'model_relations'; readonly items: Sequence<ModelRelation> };
export type ModelCasts = { readonly kind: 'model_casts'; readonly items: Sequence<ModelCast> };
export type ModelColumnFacts = { readonly kind: 'model_column_facts'; readonly items: Sequence<import('./modelSourceFacts').ModelColumnFact> };
export type ModelAccessors = { readonly kind: 'model_accessors'; readonly items: Sequence<ModelAccessor> };
export type ModelConstants = { readonly kind: 'model_constants'; readonly items: Sequence<ModelConstant> };
export type ModelMethods = { readonly kind: 'model_methods'; readonly items: Sequence<ModelMethod> };
export type ModelTraits = { readonly kind: 'model_traits'; readonly items: Sequence<TraitName> };
export type ResourceFields = { readonly kind: 'resource_fields'; readonly items: Sequence<ResourceField> };
export type ResourceActions = { readonly kind: 'resource_actions'; readonly items: Sequence<ResourceAction> };
export type RoutePaths = { readonly kind: 'route_paths'; readonly items: Sequence<import('./names').RoutePath> };
export type RequestFields = { readonly kind: 'request_fields'; readonly items: Sequence<RequestField> };
export type ValidationRules = { readonly kind: 'validation_rules'; readonly items: Sequence<ValidationRule> };
export type RouteMethods = { readonly kind: 'route_methods'; readonly items: Sequence<RouteMethod> };
export type RouteParameters = { readonly kind: 'route_parameters'; readonly items: Sequence<RouteParameter> };
export type RouteMiddlewares = { readonly kind: 'route_middlewares'; readonly items: Sequence<RouteMiddleware> };
export type Columns = { readonly kind: 'columns'; readonly items: Sequence<ColumnDefinition> };
export type Indexes = { readonly kind: 'indexes'; readonly items: Sequence<IndexDefinition> };
export type ForeignKeys = { readonly kind: 'foreign_keys'; readonly items: Sequence<ForeignKey> };
export type ModelAsts = { readonly kind: 'model_asts'; readonly items: SourceDiscovery<ModelAst> };
export type ChannelAsts = { readonly kind: 'channel_asts'; readonly items: SourceDiscovery<import('./ast').ChannelAst> };
export type ResourceAsts = { readonly kind: 'resource_asts'; readonly items: SourceDiscovery<ResourceAst> };
export type RequestAsts = { readonly kind: 'request_asts'; readonly items: SourceDiscovery<RequestAst> };
export type RouteAsts = { readonly kind: 'route_asts'; readonly items: SourceDiscovery<RouteAst> };
export type ControllerAsts = { readonly kind: 'controller_asts'; readonly items: SourceDiscovery<ControllerAst> };
export type ServiceAsts = { readonly kind: 'service_asts'; readonly items: SourceDiscovery<ServiceAst> };
export type MigrationAsts = { readonly kind: 'migration_asts'; readonly items: SourceDiscovery<MigrationAst> };
export type ResponseAsts = { readonly kind: 'response_asts'; readonly items: SourceDiscovery<ResponseAst> };
export type DtoAsts = { readonly kind: 'dto_asts'; readonly items: SourceDiscovery<DtoAst> };
import type { MiddlewareAsts, ProviderAsts, AttributeAsts } from './application';
export type SourceAsts = { readonly kind: 'source_asts'; readonly models: ModelAsts; readonly resources: ResourceAsts; readonly requests: RequestAsts; readonly routes: RouteAsts; readonly controllers: ControllerAsts; readonly services: ServiceAsts; readonly migrations: MigrationAsts; readonly responses: ResponseAsts; readonly dtos: DtoAsts; readonly middlewares: MiddlewareAsts; readonly providers: ProviderAsts; readonly attributes: AttributeAsts; readonly channels: ChannelAsts };
export type PropertyPaths = { readonly kind: 'property_paths'; readonly items: Sequence<PropertyPath> };
export type ColumnNames = { readonly kind: 'column_names'; readonly items: Sequence<import('./names').ColumnName> };
export type RelationPaths = { readonly kind: 'relation_paths'; readonly items: Sequence<RelationPath> };
export type RelationPath = { readonly kind: 'relation_path'; readonly segments: Sequence<RelationName> };
export type PropertyPath = { readonly kind: 'property_path'; readonly segments: Sequence<PropertyName> };
export type ClosureCaptures = { readonly kind: 'closure_captures'; readonly items: Sequence<import('./expression').ClosureCapture> };
export type VariableNames = { readonly kind: 'variable_names'; readonly items: Sequence<VariableName> };
export type ServiceParameters = { readonly kind: 'service_parameters'; readonly items: Sequence<ServiceParameter> };
export type CompletenessFailures = { readonly kind: 'completeness_failures'; readonly items: Sequence<CompletenessFailure> };
