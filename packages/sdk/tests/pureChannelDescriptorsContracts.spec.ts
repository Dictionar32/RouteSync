import { describe, it, expect } from 'vitest';
import {
    ScannedBroadcastChannelDescriptor,
    ScannedRouteParameterDescriptor,
    BroadcastChannelKind,
    PublicBroadcastChannelDescriptor,
    PrivateBroadcastChannelDescriptor,
    PresenceBroadcastChannelDescriptor,
    matchBroadcastChannel,
    compileBroadcastRuntimePattern
} from '../../core/src';

describe('Complete Contract & Semantic Factory Pattern SSOT (channelDescriptors)', () => {
    describe('1. ScannedBroadcastChannelDescriptor Constructor', () => {
        it('assigns all parameters directly and freezes instance (0 defensive fallback in constructor)', () => {
            const param = ScannedRouteParameterDescriptor.fromPathSegment('orderId');
            const descriptor = new ScannedBroadcastChannelDescriptor({
                name: 'orders.{orderId}',
                kind: BroadcastChannelKind.Private,
                pattern: 'orders.{orderId}',
                runtimePattern: 'orders.${orderId}',
                parameters: Object.freeze([param]),
                isPrivate: true,
                isPresence: false
            });

            expect(descriptor.name).toBe('orders.{orderId}');
            expect(descriptor.kind).toBe(BroadcastChannelKind.Private);
            expect(descriptor.pattern).toBe('orders.{orderId}');
            expect(descriptor.runtimePattern).toBe('orders.${orderId}');
            expect(descriptor.parameters.length).toBe(1);
            expect(descriptor.isPrivate).toBe(true);
            expect(descriptor.isPresence).toBe(false);
            expect(Object.isFrozen(descriptor)).toBe(true);
        });
    });

    describe('2. compileBroadcastRuntimePattern Origin Helper', () => {
        it('interpolates route parameters into template string format', () => {
            const param1 = ScannedRouteParameterDescriptor.fromPathSegment('tenant_id');
            const param2 = ScannedRouteParameterDescriptor.fromPathSegment('user_id');
            const pattern = 'tenants.{tenant_id}.users.{user_id}';
            const compiled = compileBroadcastRuntimePattern(pattern, [param1, param2]);

            expect(compiled).toBe('tenants.${tenantId}.users.${userId}');
        });

        it('falls back gracefully to parameter segment name when unindexed', () => {
            const compiled = compileBroadcastRuntimePattern('chat.{roomId}', []);
            expect(compiled).toBe('chat.${roomId}');
        });
    });

    describe('3. Static Semantic Factories', () => {
        it('.create() resolves defaults, freezes parameters, and compiles runtimePattern', () => {
            const param = ScannedRouteParameterDescriptor.fromPathSegment('id');
            const channel = ScannedBroadcastChannelDescriptor.create({
                name: 'posts.{id}',
                parameters: [param]
            });

            expect(channel.name).toBe('posts.{id}');
            expect(channel.pattern).toBe('posts.{id}');
            expect(channel.runtimePattern).toBe('posts.${id}');
            expect(channel.kind).toBe(BroadcastChannelKind.Private);
            expect(channel.isPrivate).toBe(true);
            expect(channel.isPresence).toBe(false);
            expect(Object.isFrozen(channel.parameters)).toBe(true);
            expect(Object.isFrozen(channel)).toBe(true);
        });

        it('.fromPattern() delegates cleanly to .create()', () => {
            const channel = ScannedBroadcastChannelDescriptor.fromPattern({
                name: 'system.alerts'
            });

            expect(channel.name).toBe('system.alerts');
            expect(channel.kind).toBe(BroadcastChannelKind.Private);
        });

        it('.public(), .private(), and .presence() return official class instances', () => {
            const pub = ScannedBroadcastChannelDescriptor.public({
                name: 'announcements'
            });
            expect(pub).toBeInstanceOf(ScannedBroadcastChannelDescriptor);
            expect(pub.kind).toBe(BroadcastChannelKind.Public);
            expect(pub.isPrivate).toBe(false);
            expect(pub.isPresence).toBe(false);

            const priv = ScannedBroadcastChannelDescriptor.private({
                name: 'user.{id}'
            });
            expect(priv).toBeInstanceOf(ScannedBroadcastChannelDescriptor);
            expect(priv.kind).toBe(BroadcastChannelKind.Private);
            expect(priv.isPrivate).toBe(true);
            expect(priv.isPresence).toBe(false);

            const pres = ScannedBroadcastChannelDescriptor.presence({
                name: 'room.{roomId}'
            });
            expect(pres).toBeInstanceOf(ScannedBroadcastChannelDescriptor);
            expect(pres.kind).toBe(BroadcastChannelKind.Presence);
            expect(pres.isPrivate).toBe(true);
            expect(pres.isPresence).toBe(true);
        });

        it('.none() and .empty() provide Null Object pattern without null/undefined', () => {
            const none = ScannedBroadcastChannelDescriptor.none();
            expect(none.name).toBe('none');
            expect(none.pattern).toBe('none');
            expect(none.runtimePattern).toBe('none');
            expect(none.parameters.length).toBe(0);
            expect(none.isPrivate).toBe(false);

            const empty = ScannedBroadcastChannelDescriptor.empty('custom.empty');
            expect(empty.name).toBe('custom.empty');
            expect(empty.pattern).toBe('custom.empty');
            expect(empty.runtimePattern).toBe('custom.empty');
        });
    });

    describe('4. Catamorphic Dispatch Integration', () => {
        it('works seamlessly with matchBroadcastChannel', () => {
            const channel = ScannedBroadcastChannelDescriptor.presence({
                name: 'chat.lobby'
            });

            const result = matchBroadcastChannel(channel, {
                public: () => 'PUB',
                private: () => 'PRIV',
                presence: (ch) => `PRESENCE:${ch.name}`
            });

            expect(result).toBe('PRESENCE:chat.lobby');
        });
    });
});
