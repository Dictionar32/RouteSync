import type { ModelDefinition } from './model';
import type { ResourceDefinition } from './resource';
import type { RequestDefinition } from './request';
import type { RouteDeclarationAst } from '../../compiler/scanner/lexer/routeAst/routeDeclarationAst';
import type { ControllerAction } from './controller';
import type { SourceSpan } from './provenance';
import type { ServiceDefinition } from './service';
import type { MigrationDefinition } from './migration';
import type { ResponseDefinition } from './response';
import type { DtoDefinition, MiddlewareDefinition, ProviderDefinition, AttributeDefinition } from './application';
import type { SourceAsts } from './collections';
import type { ModelFacts } from './modelSourceFacts';
import type { RouteDefinition } from './route';
import type { ChannelDefinition } from './channel';

export const completeSourceProof: unique symbol = Symbol('completeSourceProof');

export type ModelAst = { readonly kind: 'model_ast'; readonly definition: ModelDefinition; readonly facts: ModelFacts; readonly source: SourceSpan };
export type ResourceAst = { readonly kind: 'resource_ast'; readonly definition: ResourceDefinition; readonly source: SourceSpan };
export type RequestAst = { readonly kind: 'request_ast'; readonly definition: RequestDefinition; readonly source: SourceSpan };
export type RouteAst = { readonly kind: 'route_ast'; readonly declaration: RouteDeclarationAst; readonly definition: RouteDefinition; readonly source: SourceSpan };
export type ControllerAst = { readonly kind: 'controller_ast'; readonly action: ControllerAction; readonly source: SourceSpan };
export type ResponseAst = { readonly kind: 'response_ast'; readonly definition: ResponseDefinition; readonly source: SourceSpan };
export type ServiceAst = { readonly kind: 'service_ast'; readonly definition: ServiceDefinition; readonly source: SourceSpan };
export type MigrationAst = { readonly kind: 'migration_ast'; readonly definition: MigrationDefinition; readonly source: SourceSpan };
export type DtoAst = { readonly kind: 'dto_ast'; readonly definition: DtoDefinition; readonly source: SourceSpan };
export type MiddlewareAst = { readonly kind: 'middleware_ast'; readonly definition: MiddlewareDefinition; readonly source: SourceSpan };
export type ProviderAst = { readonly kind: 'provider_ast'; readonly definition: ProviderDefinition; readonly source: SourceSpan };
export type AttributeAst = { readonly kind: 'attribute_ast'; readonly definition: AttributeDefinition; readonly source: SourceSpan };
export type ChannelAst = { readonly kind: 'channel_ast'; readonly definition: ChannelDefinition; readonly source: SourceSpan };

export type SourceAst = SourceAsts;
export type CompleteSourceAst = { readonly kind: 'complete_source_ast'; readonly ast: SourceAst; readonly [completeSourceProof]: 'complete' };

export type { SourceAsts } from './collections';
