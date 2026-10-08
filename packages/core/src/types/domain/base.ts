import type { BroadcastChannelDescriptor } from "./channels";
import type { ModelAst } from "../upstream/ast";
import type { ResourceAst } from "../upstream/ast";
import type { RouteSemanticFlow } from "./routes";
import type { ResourceGroupDescriptor } from "./resourceGroupDescriptors";
import type { PageValue } from "./pageValues";
import type { DomainName, ModelName, ResourceName, RouteName, SourceFilePath, SourceLineNumber, PropertyName } from "./semanticValues";
import type { TypeExpression } from "../upstream/typeVocabulary";

/**
 * First-Class Domain Operation Entry (Ordered).
 */
export interface DomainOperationEntry {
  readonly name: PropertyName;
  readonly operation: TypeExpression;
}

/**
 * First-Class Domain Config Key-Value Entry (Ordered).
 */
export interface DomainConfigEntry {
  readonly key: PropertyName;
  readonly value: TypeExpression;
}

/**
 * Resolved domain intent config (Ordered).
 */
export interface DomainIntentConfig {
  readonly type: DomainName;
  readonly operations: readonly DomainOperationEntry[];
  readonly config: readonly DomainConfigEntry[];
}

/**
 * First-Class Route Group Alias Entry (Ordered).
 */
export interface GroupAliasEntry {
  readonly alias: string;
  readonly targetGroup: string;
}

/**
 * First-Class Domain Definition Entry (Ordered).
 */
export interface DomainDefinitionEntry {
  readonly name: DomainName;
  readonly intent: DomainIntentConfig;
}

/**
 * First-Class Frontend Configuration (0 Record).
 */
export interface FrontendConfig {
  readonly router: string;
  readonly groupAliases: readonly GroupAliasEntry[];
  readonly domains: readonly DomainDefinitionEntry[];
}

/**
 * First-Class Page Property Definition (Ordered).
 */
export interface PagePropEntry {
  readonly key: string;
  readonly value: PageValue;
}

/**
 * First-Class Page Metadata Entry (Ordered).
 */
export interface PageMetaEntry {
  readonly key: string;
  readonly value: PageValue;
}

/**
 * Pure Ordered Page Configuration (0 Record, 0 Object.entries).
 */
export interface PageConfig {
  readonly pageName: string;
  readonly component: string;
  readonly layout: string;
  readonly props: readonly PagePropEntry[];
  readonly meta: readonly PageMetaEntry[];
}

/**
 * ResourceRouteGroup: Kelompok rute yang terikat pada satu nama resource kanonikal.
 */
/**
 * Canonical resource-group domain model.
 * Classification, identity, capabilities and routes are one semantic ADT;
 * consumers must not reconstruct a group kind from a route array.
 */
export type ResourceRouteGroup = ResourceGroupDescriptor<RouteSemanticFlow>;

export type FrontendConfiguration =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'configured'; readonly config: FrontendConfig };

export interface RouteManifestDomainSurface {
  readonly version: string;
  readonly baseURL: string;
  readonly routes: readonly RouteSemanticFlow[];
  readonly resources: readonly ResourceAst[];
  readonly models: readonly ModelAst[];
  /** Closed upstream Resource -> Model -> primary-key capability. */
  readonly resourceModelKeyCapabilities: readonly import('../upstream/resourceModelKeyCapability').ResourceModelKeyCapabilityContract[];
  /** Upstream-composed group shape; CLI generators must consume rather than infer it. */
  readonly resourceGroupCapabilities?: readonly import('../upstream/resourceGroupCapability').ResourceGroupCapabilityContract[];
  readonly routeGroups: readonly ResourceRouteGroup[];       // ✅ Murni native readonly array (0 wrapper class)
  readonly generatedAt: string;
  readonly channels: readonly BroadcastChannelDescriptor[];
  readonly frontend: FrontendConfiguration;
  readonly pages: readonly PageConfig[];
}

/**
 * Compatibility name for the domain-only manifest surface.
 * The downstream compiler RouteManifest lives in scanner/wiring.
 */
export type RouteManifest = RouteManifestDomainSurface;

/**
 * ParsedChannel
 *
 * Canonical Alias to BroadcastChannelDescriptor SSOT.
 */
export type ParsedChannel = BroadcastChannelDescriptor;

