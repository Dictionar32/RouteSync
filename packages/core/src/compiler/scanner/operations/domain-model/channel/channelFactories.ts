/**
 * Typed runtime operations for creating broadcast channel domain values.
 *
 * @module core/compiler/scanner/operations/domain-model/channel
 */

import {
  BroadcastChannelKind,
  type PublicBroadcastChannelDescriptor,
  type PrivateBroadcastChannelDescriptor,
  type PresenceBroadcastChannelDescriptor,
  type BroadcastChannelDescriptor,
} from '../../../../../types/domain/channels';
import type { RouteParameter } from '../../../../../types/upstream/route';
import { broadcastRuntimePatternCompiler } from './patternCompiler';

type BroadcastChannelDescriptorParams = {
  readonly name: string;
  readonly kind: BroadcastChannelKind;
  readonly pattern: string;
  readonly runtimePattern: string;
  readonly parameters: readonly RouteParameter[];
  readonly isPrivate: boolean;
  readonly isPresence: boolean;
};

export interface BroadcastChannelFactoryOperationsInterface {
  readonly createBroadcastChannel: (input: {
    readonly name: string;
    readonly pattern: string;
    readonly kind: BroadcastChannelKind;
    readonly parameters: readonly RouteParameter[];
    readonly isPrivate: boolean;
    readonly isPresence: boolean;
  }) => BroadcastChannelDescriptor;
  readonly createPublicChannel: (input: {
    readonly name: string;
    readonly pattern?: string;
    readonly parameters?: readonly RouteParameter[];
  }) => PublicBroadcastChannelDescriptor;
  readonly createPrivateChannel: (input: {
    readonly name: string;
    readonly pattern?: string;
    readonly parameters?: readonly RouteParameter[];
  }) => PrivateBroadcastChannelDescriptor;
  readonly createPresenceChannel: (input: {
    readonly name: string;
    readonly pattern?: string;
    readonly parameters?: readonly RouteParameter[];
  }) => PresenceBroadcastChannelDescriptor;
  readonly createNoneChannel: () => BroadcastChannelDescriptor;
  readonly createEmptyChannel: (name: string) => BroadcastChannelDescriptor;
}

const createDescriptor = (params: BroadcastChannelDescriptorParams): BroadcastChannelDescriptor =>
  Object.freeze({ ...params });

const createBroadcastChannelImplementation: BroadcastChannelFactoryOperationsInterface['createBroadcastChannel'] = ({
  name, pattern, kind, parameters, isPrivate, isPresence,
}) => {
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = broadcastRuntimePatternCompiler.compile(pattern, frozenParams);
  return createDescriptor({ name, kind, pattern, runtimePattern, parameters: frozenParams, isPrivate, isPresence });
};

const createPublicChannelImplementation: BroadcastChannelFactoryOperationsInterface['createPublicChannel'] = ({
  name, pattern, parameters = [],
}) => {
  const resolvedPattern = typeof pattern === 'string' ? pattern : name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = broadcastRuntimePatternCompiler.compile(resolvedPattern, frozenParams);
  return createDescriptor({
    name, kind: BroadcastChannelKind.Public, pattern: resolvedPattern, runtimePattern,
    parameters: frozenParams, isPrivate: false, isPresence: false,
  }) as PublicBroadcastChannelDescriptor;
};

const createPrivateChannelImplementation: BroadcastChannelFactoryOperationsInterface['createPrivateChannel'] = ({
  name, pattern, parameters = [],
}) => {
  const resolvedPattern = typeof pattern === 'string' ? pattern : name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = broadcastRuntimePatternCompiler.compile(resolvedPattern, frozenParams);
  return createDescriptor({
    name, kind: BroadcastChannelKind.Private, pattern: resolvedPattern, runtimePattern,
    parameters: frozenParams, isPrivate: true, isPresence: false,
  }) as PrivateBroadcastChannelDescriptor;
};

const createPresenceChannelImplementation: BroadcastChannelFactoryOperationsInterface['createPresenceChannel'] = ({
  name, pattern, parameters = [],
}) => {
  const resolvedPattern = typeof pattern === 'string' ? pattern : name;
  const frozenParams = Object.freeze([...parameters]);
  const runtimePattern = broadcastRuntimePatternCompiler.compile(resolvedPattern, frozenParams);
  return createDescriptor({
    name, kind: BroadcastChannelKind.Presence, pattern: resolvedPattern, runtimePattern,
    parameters: frozenParams, isPrivate: true, isPresence: true,
  }) as PresenceBroadcastChannelDescriptor;
};

const createNoneChannelImplementation: BroadcastChannelFactoryOperationsInterface['createNoneChannel'] = () =>
  createDescriptor({
    name: 'none', kind: BroadcastChannelKind.Public, pattern: 'none', runtimePattern: 'none',
    parameters: Object.freeze([]), isPrivate: false, isPresence: false,
  });

const createEmptyChannelImplementation: BroadcastChannelFactoryOperationsInterface['createEmptyChannel'] = (name) =>
  createDescriptor({
    name, kind: BroadcastChannelKind.Public, pattern: name, runtimePattern: name,
    parameters: Object.freeze([]), isPrivate: false, isPresence: false,
  });

export const channelFactoryOperations: BroadcastChannelFactoryOperationsInterface = Object.freeze({
  createBroadcastChannel: createBroadcastChannelImplementation,
  createPublicChannel: createPublicChannelImplementation,
  createPrivateChannel: createPrivateChannelImplementation,
  createPresenceChannel: createPresenceChannelImplementation,
  createNoneChannel: createNoneChannelImplementation,
  createEmptyChannel: createEmptyChannelImplementation,
});
