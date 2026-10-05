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
  type PresenceBroadcastChannelDescriptor
} from '../../../../types/domain/channels';
import type { RouteParameter } from '../../../../types/upstream/route';
import { compileBroadcastRuntimePattern } from './patternCompiler';
import type { BroadcastChannelDescriptor } from '../../../../types/domain/channels';
import { relationGate } from '../../../../semantic/foundation/relationalSequence';

type BroadcastChannelDescriptorParams = { readonly name: string; readonly kind: BroadcastChannelKind; readonly pattern: string; readonly runtimePattern: string; readonly parameters: readonly RouteParameter[]; readonly isPrivate: boolean; readonly isPresence: boolean };

const createDescriptor = (params: BroadcastChannelDescriptorParams): BroadcastChannelDescriptor => Object.freeze({ ...params });

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
}): BroadcastChannelDescriptor {
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(pattern, frozenParams);
  return createDescriptor({
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
  const resolvedPattern = relationGate(Object.is(typeof pattern, 'string'), () => pattern as string, () => name);
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return createDescriptor({
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
  const resolvedPattern = relationGate(Object.is(typeof pattern, 'string'), () => pattern as string, () => name);
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return createDescriptor({
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
  const resolvedPattern = relationGate(Object.is(typeof pattern, 'string'), () => pattern as string, () => name);
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = compileBroadcastRuntimePattern(resolvedPattern, frozenParams);
  return createDescriptor({
    name,
    kind: BroadcastChannelKind.Presence,
    pattern: resolvedPattern,
    runtimePattern,
    parameters: frozenParams,
    isPrivate: true,
    isPresence: true
  }) as PresenceBroadcastChannelDescriptor;
}

export function createNoneChannel(): BroadcastChannelDescriptor {
  return createDescriptor({
    name: 'none',
    kind: BroadcastChannelKind.Public,
    pattern: 'none',
    runtimePattern: 'none',
    parameters: Object.freeze([]),
    isPrivate: false,
    isPresence: false
  });
}

export function createEmptyChannel(name: string): BroadcastChannelDescriptor {
  return createDescriptor({
    name,
    kind: BroadcastChannelKind.Public,
    pattern: name,
    runtimePattern: name,
    parameters: Object.freeze([]),
    isPrivate: false,
    isPresence: false
  });
}
