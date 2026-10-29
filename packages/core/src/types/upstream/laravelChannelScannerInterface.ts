import type { ChannelAst } from './ast';
import type { ChannelName } from './names';
import type { RouteParameter } from './route';
import type { SourceSpan } from './provenance';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type {
  BroadcastChannelDeclarationEvidence,
  BroadcastChannelKindJudgment,
  BroadcastChannelKindJudgmentAuthority,
  BroadcastChannelSubscriptionEvidence,
} from './laravelScannerSemanticJudgment';

/** Closed upstream contract for Laravel broadcast-channel evidence and semantic judgment. */
export interface LaravelChannelScannerInterface {
  readonly kind: 'laravel_channel_scanner';
  readonly closed: true;
  readonly contractVersion: 4;
  readonly scan: (input: LaravelChannelScanInput) => Promise<LaravelChannelScanJudgment>;
}

export interface LaravelChannelScanInput {
  readonly sourceProject: SourceProjectIdentity;
  /** Evidence must come from source-backed subscription declarations; names are not a semantic oracle. */
  readonly subscriptionEvidence: readonly BroadcastChannelSubscriptionEvidence[];
  /** The authority owns public/private/presence judgment and ambiguity preservation. */
  readonly classificationAuthority: BroadcastChannelKindJudgmentAuthority;
}

/** Source-only declaration shape: it deliberately has no public/private/presence classification. */
export interface BroadcastChannelDeclarationAst {
  readonly kind: 'broadcast_channel_declaration_ast';
  readonly name: ChannelName;
  readonly pattern: ChannelName;
  readonly runtimePattern: ChannelName;
  readonly parameters: Sequence<RouteParameter>;
  readonly source: SourceSpan;
}

export type ResolvedBroadcastChannelKindJudgment = BroadcastChannelKindJudgment & {
  readonly outcome: Extract<BroadcastChannelKindJudgment['outcome'], { readonly kind: 'resolved' }>;
};

export type UnresolvedBroadcastChannelKindJudgment = BroadcastChannelKindJudgment & {
  readonly outcome: Extract<BroadcastChannelKindJudgment['outcome'], { readonly kind: 'unresolved' }>;
};

export type AmbiguousBroadcastChannelKindJudgment = BroadcastChannelKindJudgment & {
  readonly outcome: Extract<BroadcastChannelKindJudgment['outcome'], { readonly kind: 'ambiguous' }>;
};

/** Canonical ChannelAst exists only when source-backed evidence resolves its semantic kind. */
export type LaravelChannelScanArtifact =
  | {
      readonly kind: 'resolved_laravel_channel';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly sourceAst: BroadcastChannelDeclarationAst;
      readonly classification: ResolvedBroadcastChannelKindJudgment;
      readonly ast: ChannelAst;
    }
  | {
      readonly kind: 'unresolved_laravel_channel';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly sourceAst: BroadcastChannelDeclarationAst;
      readonly classification: UnresolvedBroadcastChannelKindJudgment;
    }
  | {
      readonly kind: 'ambiguous_laravel_channel';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly sourceAst: BroadcastChannelDeclarationAst;
      readonly classification: AmbiguousBroadcastChannelKindJudgment;
    };

export interface LaravelChannelScanJudgment {
  readonly kind: 'laravel_channel_scan_judgment';
  readonly contractVersion: 4;
  readonly channels: readonly LaravelChannelScanArtifact[];
}

/**
 * Migration gate: the legacy ChannelScanner remains a temporary source-acquisition
 * implementation. It is not a permanent architecture boundary and must be removed
 * after its consumers use the upstream evidence and judgment contracts directly.
 */
export interface LaravelChannelScannerMigrationContract {
  readonly kind: 'laravel_channel_scanner_migration_contract';
  readonly version: 3;
  readonly currentRuntime: 'legacy-channel-scanner-still-classifies-public-private-presence-from-channel-pattern-without-client-subscription-evidence';
  readonly requiredCutover: 'collect-source-only-channel-declarations;obtain-source-backed-client-subscription-evidence-from-an-authoritative-source;delegate-kind-judgment-to-BroadcastChannelKindJudgmentAuthority;preserve-resolved-unresolved-and-ambiguous-outcomes-with-provenance';
  readonly retirement: 'delete-channel-scanner-after-all-consumers-use-upstream-source-evidence-and-judgment-contracts';
}

export const LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT: LaravelChannelScannerMigrationContract = Object.freeze({
  kind: 'laravel_channel_scanner_migration_contract',
  version: 3,
  currentRuntime: 'legacy-channel-scanner-still-classifies-public-private-presence-from-channel-pattern-without-client-subscription-evidence',
  requiredCutover: 'collect-source-only-channel-declarations;obtain-source-backed-client-subscription-evidence-from-an-authoritative-source;delegate-kind-judgment-to-BroadcastChannelKindJudgmentAuthority;preserve-resolved-unresolved-and-ambiguous-outcomes-with-provenance',
  retirement: 'delete-channel-scanner-after-all-consumers-use-upstream-source-evidence-and-judgment-contracts',
});
