import type { ChannelName } from './names';
import type { RouteParameter } from './route';
import type { Sequence } from './collections';

export type ChannelKind =
  | { readonly kind: 'public' }
  | { readonly kind: 'private' }
  | { readonly kind: 'presence' };

export type ChannelDefinition = {
  readonly kind: 'channel';
  readonly name: ChannelName;
  readonly channelKind: ChannelKind;
  readonly pattern: ChannelName;
  readonly runtimePattern: ChannelName;
  readonly parameters: Sequence<RouteParameter>;
  readonly requiresAuthentication: { readonly kind: 'true' } | { readonly kind: 'false' };
};
