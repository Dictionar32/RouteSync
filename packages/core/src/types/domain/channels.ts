import type { RouteParameter } from "./parameters";

/**
 * BroadcastChannelDescriptor
 *
 * Explicit Domain Model for Laravel Broadcast Channels (routes/channels.php).
 */
export const BroadcastChannelKind = Object.freeze({
  Public: 'public',
  Private: 'private',
  Presence: 'presence'
} as const);

export type BroadcastChannelKind = typeof BroadcastChannelKind[keyof typeof BroadcastChannelKind];

export interface BroadcastChannelDescriptor {
  readonly name: string;
  readonly kind: BroadcastChannelKind;
  readonly pattern: string;
  readonly runtimePattern: string;
  readonly parameters: readonly RouteParameter[];
  readonly isPrivate: boolean;
  readonly isPresence: boolean;
}

export interface PublicBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'public';
  readonly isPrivate: false;
  readonly isPresence: false;
}

export interface PrivateBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'private';
  readonly isPrivate: true;
  readonly isPresence: false;
}

export interface PresenceBroadcastChannelDescriptor extends BroadcastChannelDescriptor {
  readonly kind: 'presence';
  readonly isPrivate: true;
  readonly isPresence: true;
}

export interface BroadcastChannelSpecification<K extends BroadcastChannelKind = BroadcastChannelKind> {
  readonly kind: K;
  readonly echoMethod: 'channel' | 'private' | 'join';
  readonly requiresAuth: boolean;
  readonly supportsPresenceData: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key BroadcastChannelKind.
 */
export type BroadcastChannelRegistry = {
  readonly [K in BroadcastChannelKind]: BroadcastChannelSpecification<K>;
};

export const BROADCAST_CHANNEL_REGISTRY: BroadcastChannelRegistry = Object.freeze({
  [BroadcastChannelKind.Public]: {
    kind: BroadcastChannelKind.Public,
    echoMethod: 'channel',
    requiresAuth: false,
    supportsPresenceData: false,
  },
  [BroadcastChannelKind.Private]: {
    kind: BroadcastChannelKind.Private,
    echoMethod: 'private',
    requiresAuth: true,
    supportsPresenceData: false,
  },
  [BroadcastChannelKind.Presence]: {
    kind: BroadcastChannelKind.Presence,
    echoMethod: 'join',
    requiresAuth: true,
    supportsPresenceData: true,
  },
});

export interface BroadcastChannelVisitor<R> {
  readonly public: (channel: PublicBroadcastChannelDescriptor) => R;
  readonly private: (channel: PrivateBroadcastChannelDescriptor) => R;
  readonly presence: (channel: PresenceBroadcastChannelDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian BroadcastChannelDescriptor dengan exhaustive type safety
 */
export function matchBroadcastChannel<R>(
  channel: BroadcastChannelDescriptor,
  visitor: BroadcastChannelVisitor<R>
): R {
  return visitor[channel.kind](channel as any);
}

