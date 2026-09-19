import type { FormAction, RequestType } from "../../compiler/artifacts/RequestTypesArtifact";
import type { ObjectType } from "../../compiler/types/SemanticType";
import type { BroadcastChannelDescriptor } from "./channels";
import type { EndpointContract } from "./contracts";
import type { ParsedModel } from "./database";
import type { ParsedResource } from "./expressions";
import type { ParsedRoute } from "./routes";
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
export interface ResourceRouteGroup {
  readonly resourceName: ResourceName;
  readonly formTypeName: string;
  readonly routes: readonly ParsedRoute[];
  readonly formActions: readonly FormAction[]; // ✅ Guaranteed directly from Upstream PHP Scanner
}

export type FrontendConfiguration =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'configured'; readonly config: FrontendConfig };

export interface RouteManifest {
  readonly version: string;
  readonly baseURL: string;
  readonly routes: readonly ParsedRoute[];
  readonly contracts: readonly EndpointContract[];           // ✅ Pure CDA Top-Level Manifest Contracts SSOT
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ParsedModel[];
  readonly routeGroups: readonly ResourceRouteGroup[];       // ✅ Murni native readonly array (0 wrapper class)
  readonly requestTypes: readonly RequestType[];              // ✅ 100% Guaranteed directly from Upstream Scanner!
  readonly semanticTypes: readonly ObjectType[];              // ✅ SATU ALIRAN UTUH (0 Fragmentasi, 0 Penyambungan Manual)!
  readonly generatedAt: string;
  readonly channels: readonly BroadcastChannelDescriptor[];
  readonly frontend: FrontendConfiguration;
  readonly pages: readonly PageConfig[];
}

/**
 * ParsedChannel
 *
 * Canonical Alias to BroadcastChannelDescriptor SSOT.
 */
export type ParsedChannel = BroadcastChannelDescriptor;

