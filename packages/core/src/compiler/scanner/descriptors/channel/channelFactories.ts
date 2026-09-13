/**
 * channelFactories.ts
 *
 * Factory functions for creating broadcast channel descriptors.
 *
 * @module core/compiler/scanner/descriptors/channel
 */

import {
  BroadcastChannelKind,
  type PublicBroadcastChannelDescriptor,
  type PrivateBroadcastChannelDescriptor,
  type PresenceBroadcastChannelDescriptor,
  type RouteParameter
} from '../../../../types/route';
import { compileBroadcastRuntimePattern } from './patternCompiler';
import {
  ScannedBroadcastChannelDescriptor,
  type ScannedBroadcastChannelParams
} from './channelDescriptorClass';

export function createBroadcastChannel({
  name,
  pattern,
  kind,
  parameters = [],
  isPrivate,
  isPresence
}: {
  readonly name: string;
  readonly pattern?: string;
  readonly kind?: BroadcastChannelKind;
  readonly parameters?: readonly RouteParameter[];
  readonly isPrivate?: boolean;
  readonly isPresence?: boolean;
}): ScannedBroadcastChannelDescriptor {
  const resolvedPattern = pattern ?? name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  const presence = isPresence ?? (kind === BroadcastChannelKind.Presence || resolvedPattern.includes('presence') || resolvedPattern.includes('chat'));
  const priv = isPrivate ?? (kind === BroadcastChannelKind.Private || (!resolvedPattern.startsWith('public.') && !presence));
  const resolvedKind = kind ?? (presence ? BroadcastChannelKind.Presence : priv ? BroadcastChannelKind.Private : BroadcastChannelKind.Public);
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind: resolvedKind,
    pattern: resolvedPattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate: priv,
    isPresence: presence
  });
}

export function createPublicChannel({
  name,
  pattern,
  parameters = []
}: {
  readonly name: string;
  readonly pattern?: string;
  readonly parameters?: readonly RouteParameter[];
}): PublicBroadcastChannelDescriptor {
  const resolvedPattern = pattern ?? name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind: BroadcastChannelKind.Public,
    pattern: resolvedPattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate: false,
    isPresence: false
  }) as PublicBroadcastChannelDescriptor;
}

export function createPrivateChannel({
  name,
  pattern,
  parameters = []
}: {
  readonly name: string;
  readonly pattern?: string;
  readonly parameters?: readonly RouteParameter[];
}): PrivateBroadcastChannelDescriptor {
  const resolvedPattern = pattern ?? name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind: BroadcastChannelKind.Private,
    pattern: resolvedPattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate: true,
    isPresence: false
  }) as PrivateBroadcastChannelDescriptor;
}

export function createPresenceChannel({
  name,
  pattern,
  parameters = []
}: {
  readonly name: string;
  readonly pattern?: string;
  readonly parameters?: readonly RouteParameter[];
}): PresenceBroadcastChannelDescriptor {
  const resolvedPattern = pattern ?? name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind: BroadcastChannelKind.Presence,
    pattern: resolvedPattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate: true,
    isPresence: true
  }) as PresenceBroadcastChannelDescriptor;
}

export function createNoneChannel(): ScannedBroadcastChannelDescriptor {
  return new ScannedBroadcastChannelDescriptor({
    name: 'none',
    kind: BroadcastChannelKind.Public,
    pattern: 'none',
    runtimePattern: 'none',
    parameters: Object.freeze([]),
    isPrivate: false,
    isPresence: false
  });
}

export function createEmptyChannel(name: string): ScannedBroadcastChannelDescriptor {
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind: BroadcastChannelKind.Public,
    pattern: name,
    runtimePattern: name,
    parameters: Object.freeze([]),
    isPrivate: false,
    isPresence: false
  });
}
