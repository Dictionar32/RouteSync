import { describe, it, expect } from 'vitest'
import {
  ScannedBroadcastChannelDescriptor,
  ScannedRouteManifestDescriptor,
  BroadcastChannelDescriptor,
  BroadcastChannelKind,
  ParsedChannel
} from '@routesync/core'
import { EchoGenerator } from '@routesync/cli/src/generators/EchoGenerator'

describe('BroadcastChannelDescriptor & ParsedChannel SSOT Unification', () => {
  it('1. BroadcastChannelDescriptor is canonical and ParsedChannel is a compatible type alias', () => {
    const channel: BroadcastChannelDescriptor = ScannedBroadcastChannelDescriptor.create({
      name: 'orders.{orderId}',
      kind: BroadcastChannelKind.Private,
      pattern: 'orders.{orderId}',
      parameters: []
    })

    // Compatible assignment to ParsedChannel alias without intersection cast
    const parsedChannel: ParsedChannel = channel
    expect(parsedChannel.name).toBe('orders.{orderId}')
    expect(parsedChannel.kind).toBe(BroadcastChannelKind.Private)
    expect(parsedChannel.runtimePattern).toBe('orders.${orderId}')
    expect(parsedChannel.isPrivate).toBe(true)
    expect(parsedChannel.isPresence).toBe(false)
  })

  it('2. ScannedRouteManifestDescriptor holds guaranteed channels of type readonly BroadcastChannelDescriptor[]', () => {
    const channel = ScannedBroadcastChannelDescriptor.create({
      name: 'notifications',
      kind: BroadcastChannelKind.Public,
      pattern: 'notifications',
      parameters: []
    })

    const manifest = ScannedRouteManifestDescriptor.create({
      channels: [channel]
    })

    expect(manifest.channels).toBeDefined()
    expect(manifest.channels.length).toBe(1)
    expect(manifest.channels[0].name).toBe('notifications')
    expect(manifest.channels[0].kind).toBe(BroadcastChannelKind.Public)
    expect(Object.isFrozen(manifest.channels)).toBe(true)
  })

  it('3. EchoGenerator consumes pure readonly BroadcastChannelDescriptor[]', async () => {
    // Should not throw with empty channels
    await expect(EchoGenerator.generate([], '/tmp/routesync-test-echo')).resolves.not.toThrow()
  })
})
