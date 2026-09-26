import type { BroadcastChannelDescriptor } from '../../../types/route';
import type { ChannelAst } from '../../../types/upstream/ast';
import type { ChannelDefinition, ChannelKind } from '../../../types/upstream/channel';
import type { Sequence } from '../../../types/upstream/collections';
import { createChannelName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';

/**
 * Semantic channel descriptor plus the exact Laravel declaration provenance.
 *
 * Channel discovery and token recognition remain scanner work. This producer
 * owns conversion from the legacy broadcast descriptor into the canonical
 * upstream ChannelDefinition and ChannelAst contracts.
 */
export type ChannelProducerInput = {
  readonly channel: BroadcastChannelDescriptor;
  readonly source: SourceSpan;
};

export interface ChannelProducer {
  readonly produce: (input: ChannelProducerInput) => ChannelAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> =>
  items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const channelKind = (kind: BroadcastChannelDescriptor['kind']): ChannelKind => {
  switch (kind) {
    case 'public': return { kind: 'public' };
    case 'private': return { kind: 'private' };
    case 'presence': return { kind: 'presence' };
  }
};

const requiresAuthentication = (kind: BroadcastChannelDescriptor['kind']): ChannelDefinition['requiresAuthentication'] =>
  kind === 'public' ? { kind: 'false' } : { kind: 'true' };

export const channelProducer: ChannelProducer = {
  produce(input): ChannelAst {
    const definition: ChannelDefinition = {
      kind: 'channel',
      name: createChannelName(input.channel.name),
      channelKind: channelKind(input.channel.kind),
      pattern: createChannelName(input.channel.pattern),
      runtimePattern: createChannelName(input.channel.runtimePattern),
      parameters: sequence(input.channel.parameters),
      requiresAuthentication: requiresAuthentication(input.channel.kind),
    };

    return {
      kind: 'channel_ast',
      definition,
      source: input.source,
    };
  },
};
