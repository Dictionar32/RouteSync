import type { ModelDefinition } from './model';
import type { ResourceDefinition } from './resource';
import type { RequestDefinition } from './request';
import type { RouteDeclarationAst } from '../../compiler/scanner/lexer/routeAst/routeDeclarationAst';
import type { ControllerMethod } from './controller';
import type { SourceSpan } from './provenance';
import type { ServiceDefinition } from './service';
import type { MigrationDefinition } from './migration';
import type { ResponseDefinition } from './response';
import type { DtoDefinition, MiddlewareDefinition, ProviderDefinition, AttributeDefinition } from './application';
import type { SourceAsts } from './collections';
import type { RouteDefinition } from './route';
import type { ChannelDefinition } from './channel';
import type { Expression } from './expression';
import type { ModelName, ResourceName, RequestName, ControllerName, ServiceName, PropertyName, MethodName, ActionName, RouteName, ClassName } from './names';

export const completeSourceProof: unique symbol = Symbol('completeSourceProof');

export type ModelAst = { readonly kind: 'model_ast'; readonly definition: ModelDefinition; readonly source: SourceSpan };
export type ResourceAst = { readonly kind: 'resource_ast'; readonly definition: ResourceDefinition; readonly source: SourceSpan };
export type RequestAst = { readonly kind: 'request_ast'; readonly definition: RequestDefinition; readonly source: SourceSpan };
export type RouteAst = { readonly kind: 'route_ast'; readonly declaration: RouteDeclarationAst; readonly definition: RouteDefinition; readonly source: SourceSpan };
export type ControllerAst = { readonly kind: 'controller_ast'; readonly methods: import('./collections').Sequence<ControllerMethod>; readonly source: SourceSpan };
export type ResponseAst = { readonly kind: 'response_ast'; readonly definition: ResponseDefinition; readonly source: SourceSpan };
export type ServiceAst = { readonly kind: 'service_ast'; readonly definition: ServiceDefinition; readonly source: SourceSpan };
export type MigrationAst = { readonly kind: 'migration_ast'; readonly definition: MigrationDefinition; readonly source: SourceSpan };
export type { SchemaAst } from './schema';
export type DtoAst = { readonly kind: 'dto_ast'; readonly definition: DtoDefinition; readonly source: SourceSpan };
export type MiddlewareAst = { readonly kind: 'middleware_ast'; readonly definition: MiddlewareDefinition; readonly source: SourceSpan };
export type ProviderAst = { readonly kind: 'provider_ast'; readonly definition: ProviderDefinition; readonly source: SourceSpan };
export type AttributeAst = { readonly kind: 'attribute_ast'; readonly definition: AttributeDefinition; readonly source: SourceSpan };
export type ExpressionOrigin =
  | { readonly kind: 'model_accessor'; readonly model: ModelName; readonly accessor: PropertyName }
  | { readonly kind: 'resource_field'; readonly resource: ResourceName; readonly field: PropertyName }
  | { readonly kind: 'request_rule'; readonly request: RequestName; readonly field: PropertyName }
  | { readonly kind: 'controller_method'; readonly controller: ControllerName; readonly method: MethodName }
  | { readonly kind: 'controller_action'; readonly controller: ControllerName; readonly action: ActionName }
  | { readonly kind: 'service_method'; readonly service: ServiceName; readonly method: MethodName }
  | { readonly kind: 'route_expression'; readonly route: RouteName }
  | { readonly kind: 'class_member'; readonly owner: ClassName; readonly member: PropertyName };

export type ExpressionSurface =
  | { readonly kind: 'php_literal' }
  | { readonly kind: 'php_variable' }
  | { readonly kind: 'php_magic_constant' }
  | { readonly kind: 'php_constant_reference' }
  | { readonly kind: 'php_property_access' }
  | { readonly kind: 'php_nullsafe_property_access' }
  | { readonly kind: 'php_method_call' }
  | { readonly kind: 'php_nullsafe_method_call' }
  | { readonly kind: 'php_static_call' }
  | { readonly kind: 'php_database_raw' }
  | { readonly kind: 'php_function_call' }
  | { readonly kind: 'php_array' }
  | { readonly kind: 'php_binary' }
  | { readonly kind: 'php_unary' }
  | { readonly kind: 'php_ternary' }
  | { readonly kind: 'php_short_ternary' }
  | { readonly kind: 'php_coalesce' }
  | { readonly kind: 'php_cast' }
  | { readonly kind: 'php_closure' }
  | { readonly kind: 'php_arrow_function' }
  | { readonly kind: 'php_match' }
  | { readonly kind: 'php_class_reference' }
  | { readonly kind: 'php_class_constant' }
  | { readonly kind: 'php_constructor' }
  | { readonly kind: 'php_assignment' }
  | { readonly kind: 'php_anonymous_class_constructor' }
  | { readonly kind: 'php_instance_of' }
  | { readonly kind: 'php_array_access' }
  | { readonly kind: 'php_interpolated_string' }
  | { readonly kind: 'php_unsupported' };

/**
 * Canonical expression boundary. The semantic expression is never detached from
 * the Laravel source datum that produced it. Consumers must not reconstruct the
 * origin or guess the PHP surface form later.
 */
export type ExpressionAst = {
  readonly kind: 'expression_ast';
  readonly expression: Expression;
  readonly origin: ExpressionOrigin;
  readonly surface: ExpressionSurface;
  readonly source: SourceSpan;
};
export type ChannelAst = { readonly kind: 'channel_ast'; readonly definition: ChannelDefinition; readonly source: SourceSpan };

export type SourceAst = SourceAsts;
export type CompleteSourceAst = { readonly kind: 'complete_source_ast'; readonly ast: SourceAst; readonly [completeSourceProof]: 'complete' };

export type { SourceAsts } from './collections';
export type { PropertyAst } from './property';
export type { AssignmentAst, MutationAst, SourceMutation } from './assignment';
export type { QueryAst } from './query';

export type { EloquentRelationAst } from './eloquent';
