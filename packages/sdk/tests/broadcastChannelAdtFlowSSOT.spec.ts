import { describe, test, expect } from 'vitest'
import {
  matchBroadcastChannel,
  BROADCAST_CHANNEL_REGISTRY,
  BroadcastChannelKind,
  PublicBroadcastChannelDescriptor,
  PrivateBroadcastChannelDescriptor,
  PresenceBroadcastChannelDescriptor,
  ScannedBroadcastChannelDescriptor,
  ScannedRouteParameterDescriptor
} from '../../core/src'
import { EchoGenerator } from '../../cli/src/generators/EchoGenerator'

describe('BroadcastChannel ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchBroadcastChannel executes pure catamorphism for public channel', () => {
    const channel: PublicBroadcastChannelDescriptor = ScannedBroadcastChannelDescriptor.public({
      name: 'announcements',
      pattern: 'announcements'
    })

    const result = matchBroadcastChannel(channel, {
      public: (ch) => `PUBLIC:${ch.name}:${ch.isPrivate}`,
      private: (ch) => `PRIVATE:${ch.name}:${ch.isPrivate}`,
      presence: (ch) => `PRESENCE:${ch.name}:${ch.isPresence}`
    })

    expect(result).toBe('PUBLIC:announcements:false')
  })

  test('2. matchBroadcastChannel executes pure catamorphism for private channel', () => {
    const param = new ScannedRouteParameterDescriptor({ name: 'orderId' })
    const channel: PrivateBroadcastChannelDescriptor = ScannedBroadcastChannelDescriptor.private({
      name: 'orders.{orderId}',
      pattern: 'orders.{orderId}',
      parameters: [param]
    })

    const result = matchBroadcastChannel(channel, {
      public: (ch) => `PUBLIC:${ch.name}`,
      private: (ch) => `PRIVATE:${ch.name}:${ch.runtimePattern}:${ch.isPrivate}`,
      presence: (ch) => `PRESENCE:${ch.name}`
    })

    expect(result).toBe('PRIVATE:orders.{orderId}:orders.${orderId}:true')
  })

  test('3. matchBroadcastChannel executes pure catamorphism for presence channel', () => {
    const param = new ScannedRouteParameterDescriptor({ name: 'roomId' })
    const channel: PresenceBroadcastChannelDescriptor = ScannedBroadcastChannelDescriptor.presence({
      name: 'chat.{roomId}',
      pattern: 'chat.{roomId}',
      parameters: [param]
    })

    const result = matchBroadcastChannel(channel, {
      public: (ch) => `PUBLIC:${ch.name}`,
      private: (ch) => `PRIVATE:${ch.name}`,
      presence: (ch) => `PRESENCE:${ch.name}:${ch.runtimePattern}:${ch.isPresence}`
    })

    expect(result).toBe('PRESENCE:chat.{roomId}:chat.${roomId}:true')
  })

  test('4. BROADCAST_CHANNEL_REGISTRY enforces metadata specifications for all BroadcastChannelKinds', () => {
    expect(Object.isFrozen(BROADCAST_CHANNEL_REGISTRY)).toBe(true)

    expect(BROADCAST_CHANNEL_REGISTRY[BroadcastChannelKind.Public]).toEqual({
      kind: 'public',
      echoMethod: 'channel',
      requiresAuth: false,
      supportsPresenceData: false
    })

    expect(BROADCAST_CHANNEL_REGISTRY[BroadcastChannelKind.Private]).toEqual({
      kind: 'private',
      echoMethod: 'private',
      requiresAuth: true,
      supportsPresenceData: false
    })

    expect(BROADCAST_CHANNEL_REGISTRY[BroadcastChannelKind.Presence]).toEqual({
      kind: 'presence',
      echoMethod: 'join',
      requiresAuth: true,
      supportsPresenceData: true
    })
  })

  test('5. ScannedBroadcastChannelDescriptor semantic factories return frozen descriptors', () => {
    const pub = ScannedBroadcastChannelDescriptor.public({ name: 'news' })
    const priv = ScannedBroadcastChannelDescriptor.private({ name: 'user.1' })
    const pres = ScannedBroadcastChannelDescriptor.presence({ name: 'room.general' })

    expect(Object.isFrozen(pub)).toBe(true)
    expect(pub.kind).toBe(BroadcastChannelKind.Public)
    expect(pub.isPrivate).toBe(false)
    expect(pub.isPresence).toBe(false)

    expect(Object.isFrozen(priv)).toBe(true)
    expect(priv.kind).toBe(BroadcastChannelKind.Private)
    expect(priv.isPrivate).toBe(true)
    expect(priv.isPresence).toBe(false)

    expect(Object.isFrozen(pres)).toBe(true)
    expect(pres.kind).toBe(BroadcastChannelKind.Presence)
    expect(pres.isPrivate).toBe(true)
    expect(pres.isPresence).toBe(true)
  })

  test('6. EchoGenerator dispatches echo methods using BROADCAST_CHANNEL_REGISTRY', async () => {
    const pub = ScannedBroadcastChannelDescriptor.public({ name: 'news' })
    const priv = ScannedBroadcastChannelDescriptor.private({ name: 'orders.{orderId}', parameters: [new ScannedRouteParameterDescriptor({ name: 'orderId' })] })
    const pres = ScannedBroadcastChannelDescriptor.presence({ name: 'room.{roomId}', parameters: [new ScannedRouteParameterDescriptor({ name: 'roomId' })] })

    const output = await EchoGenerator.generate([pub, priv, pres])

    expect(output).toContain("echo.channel(`news`)")
    expect(output).toContain("echo.private(`orders.${orderId}`)")
    expect(output).toContain("echo.join(`room.${roomId}`)")
  })
})
