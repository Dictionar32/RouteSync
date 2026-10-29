import type { ChannelName } from './names';
import type { RouteParameter } from './route';

/** Exhaustive domain continuation for channel-kind outcomes. */
export interface ChannelKindHandlers<Result> {
  readonly public: (kind: PublicChannelKind) => Result;
  readonly private: (kind: PrivateChannelKind) => Result;
  readonly presence: (kind: PresenceChannelKind) => Result;
}

export interface PublicChannelKind {
  readonly kind: 'public';
  readonly continueWith: <Result>(handlers: ChannelKindHandlers<Result>) => Result;
  readonly requiresAuthentication: () => ChannelAuthenticationRequirement;
}

export interface PrivateChannelKind {
  readonly kind: 'private';
  readonly continueWith: <Result>(handlers: ChannelKindHandlers<Result>) => Result;
  readonly requiresAuthentication: () => ChannelAuthenticationRequirement;
}

export interface PresenceChannelKind {
  readonly kind: 'presence';
  readonly continueWith: <Result>(handlers: ChannelKindHandlers<Result>) => Result;
  readonly requiresAuthentication: () => ChannelAuthenticationRequirement;
}

export type ChannelAuthenticationRequirement = Readonly<{ readonly kind: 'true' }> | Readonly<{ readonly kind: 'false' }>;

/** Channel kind is an actionable ADT rather than a tag that downstream must reinterpret. */
export type ChannelKind = PublicChannelKind | PrivateChannelKind | PresenceChannelKind;

export interface ChannelKindFactoryInterface {
  readonly public: () => PublicChannelKind;
  readonly private: () => PrivateChannelKind;
  readonly presence: () => PresenceChannelKind;
  readonly fromSourceKind: (sourceKind: ChannelKind['kind']) => ChannelKind;
}

export const channelKindFactory: ChannelKindFactoryInterface = Object.freeze({
  public: (): PublicChannelKind => {
    const kind: PublicChannelKind = Object.freeze({
      kind: 'public',
      continueWith: handlers => handlers.public(kind),
      requiresAuthentication: () => Object.freeze({ kind: 'false' }),
    });
    return kind;
  },
  private: (): PrivateChannelKind => {
    const kind: PrivateChannelKind = Object.freeze({
      kind: 'private',
      continueWith: handlers => handlers.private(kind),
      requiresAuthentication: () => Object.freeze({ kind: 'true' }),
    });
    return kind;
  },
  presence: (): PresenceChannelKind => {
    const kind: PresenceChannelKind = Object.freeze({
      kind: 'presence',
      continueWith: handlers => handlers.presence(kind),
      requiresAuthentication: () => Object.freeze({ kind: 'true' }),
    });
    return kind;
  },
  fromSourceKind: (sourceKind: ChannelKind['kind']): ChannelKind => {
    switch (sourceKind) {
      case 'public': return channelKindFactory.public();
      case 'private': return channelKindFactory.private();
      case 'presence': return channelKindFactory.presence();
      default: throw new Error('Unsupported source channel kind');
    }
  },
});

export type ChannelDefinition = {
  readonly kind: 'channel';
  readonly name: ChannelName;
  readonly channelKind: ChannelKind;
  readonly pattern: ChannelName;
  readonly runtimePattern: ChannelName;
  readonly parameters: readonly RouteParameter[];
};
