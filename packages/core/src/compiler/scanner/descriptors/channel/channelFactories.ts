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
  parameters,
  isPrivate,
  isPresence
}: {
  readonly name: string;
  readonly pattern: string;
  readonly kind: BroadcastChannelKind;
  readonly parameters: readonly RouteParameter[];
  readonly isPrivate: boolean;
  readonly isPresence: boolean;
}): ScannedBroadcastChannelDescriptor {
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(pattern, frozenParams);
  return new ScannedBroadcastChannelDescriptor({
    name,
    kind,
    pattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate,
    isPresence
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
