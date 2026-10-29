import type { BroadcastChannelDescriptor } from '../../../types/route';
import { createDomainAstJudgment, type ChannelAst } from '../../../types/upstream/ast';
import { channelKindFactory, type ChannelDefinition } from '../../../types/upstream/channel';
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


export const channelProducer: ChannelProducer = {
  produce(input): ChannelAst {
    const channelKind = channelKindFactory.fromSourceKind(input.channel.kind);
    const definition: ChannelDefinition = {
      kind: 'channel',
      name: createChannelName(input.channel.name),
      channelKind,
      pattern: createChannelName(input.channel.pattern),
      runtimePattern: createChannelName(input.channel.runtimePattern),
      parameters: Object.freeze([...input.channel.parameters]),
    };

    return createDomainAstJudgment({ kind: 'channel_ast', semantic: definition, source: input.source });
  },
};
