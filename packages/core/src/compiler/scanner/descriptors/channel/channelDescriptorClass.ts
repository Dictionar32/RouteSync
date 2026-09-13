/**
 * channelDescriptorClass.ts
 *
 * Implements ScannedBroadcastChannelDescriptor class with frozen fields.
 *
 * @module core/compiler/scanner/descriptors/channel
 */

import {
  BroadcastChannelKind,
  type BroadcastChannelDescriptor,
  type PublicBroadcastChannelDescriptor,
  type PrivateBroadcastChannelDescriptor,
  type PresenceBroadcastChannelDescriptor,
  type RouteParameter
} from '../../../../types/route';
import {
  createBroadcastChannel,
  createPublicChannel,
  createPrivateChannel,
  createPresenceChannel,
  createNoneChannel,
  createEmptyChannel
} from './channelFactories';

export interface ScannedBroadcastChannelParams {
  readonly name: string;
  readonly kind: BroadcastChannelKind;
  readonly pattern: string;
  readonly runtimePattern: string;
  readonly parameters: readonly RouteParameter[];
  readonly isPrivate: boolean;
  readonly isPresence: boolean;
}

export class ScannedBroadcastChannelDescriptor implements BroadcastChannelDescriptor {
  public readonly name: string;
  public readonly kind: BroadcastChannelKind;
  public readonly pattern: string;
  public readonly runtimePattern: string;
  public readonly parameters: readonly RouteParameter[];
  public readonly isPrivate: boolean;
  public readonly isPresence: boolean;

  constructor({ name, kind, pattern, runtimePattern, parameters, isPrivate, isPresence }: ScannedBroadcastChannelParams) {
    this.name = name;
    this.kind = kind;
    this.pattern = pattern;
    this.runtimePattern = runtimePattern;
    this.parameters = parameters;
    this.isPrivate = isPrivate;
    this.isPresence = isPresence;
    Object.freeze(this);
  }

  public static create(args: Parameters<typeof createBroadcastChannel>[0]): ScannedBroadcastChannelDescriptor {
    return createBroadcastChannel(args);
  }

  public static fromPattern(args: Parameters<typeof createBroadcastChannel>[0]): ScannedBroadcastChannelDescriptor {
    return createBroadcastChannel(args);
  }

  public static public(args: Parameters<typeof createPublicChannel>[0]): PublicBroadcastChannelDescriptor {
    return createPublicChannel(args);
  }

  public static private(args: Parameters<typeof createPrivateChannel>[0]): PrivateBroadcastChannelDescriptor {
    return createPrivateChannel(args);
  }

  public static presence(args: Parameters<typeof createPresenceChannel>[0]): PresenceBroadcastChannelDescriptor {
    return createPresenceChannel(args);
  }

  public static none(): ScannedBroadcastChannelDescriptor {
    return createNoneChannel();
  }

  public static empty(name: string): ScannedBroadcastChannelDescriptor {
    return createEmptyChannel(name);
  }
}
