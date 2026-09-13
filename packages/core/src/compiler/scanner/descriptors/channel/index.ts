/**
 * index.ts
 *
 * Sub-domain exports for channel descriptors.
 *
 * @module core/compiler/scanner/descriptors/channel
 */

export { compileBroadcastRuntimePattern } from './patternCompiler';
export {
  createBroadcastChannel,
  createPublicChannel,
  createPrivateChannel,
  createPresenceChannel,
  createNoneChannel,
  createEmptyChannel
} from './channelFactories';
export {
  ScannedBroadcastChannelDescriptor,
  type ScannedBroadcastChannelParams
} from './channelDescriptorClass';
