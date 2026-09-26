import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ChannelScanner } from '../../core/src/compiler/scanner/subscanners/ChannelScanner';
import { channelProducer } from '../../core/src/compiler/scanner/subscanners/channelProducer';
import { ScannedBroadcastChannelDescriptor } from '../../core/src/compiler/scanner/descriptors/channelDescriptors';
import { ScannedRouteParameterDescriptor } from '../../core/src/compiler/scanner/descriptors/route/params/routeParameterDescriptorClass';
import type { Sequence } from '../../core/src/types/upstream/collections';
import type { SourceProjectIdentity } from '../../core/src/types/upstream/highLevelSourceModel';
import type { SourceSpan } from '../../core/src/types/upstream/provenance';

const sequenceToArray = <T>(items: Sequence<T>): readonly T[] => {
  const values: T[] = [];
  let current = items;
  while (current.kind === 'cons') {
    values.push(current.head);
    current = current.tail;
  }
  return values;
};

const source = (file: string, start: number, end = start): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
  start: { kind: 'number_value', value: start },
  end: { kind: 'number_value', value: end },
});

const project = (root: string): SourceProjectIdentity => ({
  kind: 'laravel_project',
  root: source(root, 1).file,
  source: source(root, 1),
});

describe('ChannelAst producer', () => {
  it('maps a Laravel orders channel descriptor into the canonical high-level channel interface', () => {
    const fixtureFile = '/project/routes/channels.php';
    const channel = ScannedBroadcastChannelDescriptor.fromPattern({
      name: 'orders.{orderId}',
      pattern: 'orders.{orderId}',
      parameters: [ScannedRouteParameterDescriptor.fromPathSegment('orderId')],
      kind: 'private',
      isPrivate: true,
      isPresence: false,
    });

    const ast = channelProducer.produce({ channel, source: source(fixtureFile, 3, 29) });

    expect(ast).toMatchObject({
      kind: 'channel_ast',
      definition: {
        kind: 'channel',
        name: { kind: 'channel_name', value: { kind: 'string_value', value: 'orders.{orderId}' } },
        channelKind: { kind: 'private' },
        pattern: { kind: 'channel_name', value: { kind: 'string_value', value: 'orders.{orderId}' } },
        runtimePattern: { kind: 'channel_name', value: { kind: 'string_value', value: 'orders.${orderId}' } },
        requiresAuthentication: { kind: 'true' },
      },
      source: source(fixtureFile, 3, 29),
    });
    expect(sequenceToArray(ast.definition.parameters).map(parameter => parameter.name.value.value)).toEqual(['orderId']);
  });

  it('routes Laravel routes/channels.php declarations through channelProducer with declaration provenance', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'routesync-channel-producer-'));
    const routesDirectory = path.join(root, 'routes');
    const fixtureFile = path.join(routesDirectory, 'channels.php');
    await mkdir(routesDirectory, { recursive: true });
    await writeFile(fixtureFile, [
      '<?php',
      'use Illuminate\\Support\\Facades\\Broadcast;',
      "Broadcast::channel('orders.{orderId}', function ($user, $orderId) { return true; });",
    ].join('\n'));

    try {
      const channels = await ChannelScanner.scanCanonicalAsts(project(root));

      expect(channels).toHaveLength(1);
      expect(channels[0]).toMatchObject({
        kind: 'channel_ast',
        definition: {
          kind: 'channel',
          name: { kind: 'channel_name', value: { kind: 'string_value', value: 'orders.{orderId}' } },
          channelKind: { kind: 'private' },
          requiresAuthentication: { kind: 'true' },
        },
        source: {
          kind: 'source_span',
          file: { kind: 'source_file', value: { kind: 'string_value', value: fixtureFile } },
        },
      });
      expect(channels[0].source.start.value).toBeGreaterThan(0);
      expect(channels[0].source.file.value.value).not.toBe(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
