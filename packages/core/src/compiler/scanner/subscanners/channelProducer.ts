import type { BroadcastChannelDescriptor } from '../../../types/route';
import { createDomainAstJudgment, type ChannelAst } from '../../../types/upstream/ast';
import type { ChannelDefinition, ChannelKind } from '../../../types/upstream/channel';
import type { Sequence } from '../../../types/upstream/collections';
import { createChannelName } from '../../../types/upstream/names';
import { relationFoldRight, relationGate } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
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
  relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (head, tail) => ({ kind: 'cons', head, tail }));

const channelKind = (kind: BroadcastChannelDescriptor['kind']): ChannelKind => relationGate(relationEqual(kind, 'public'), () => ({ kind: 'public' as const }), () => relationGate(relationEqual(kind, 'private'), () => ({ kind: 'private' as const }), () => ({ kind: 'presence' as const })));

const requiresAuthentication = (kind: BroadcastChannelDescriptor['kind']): ChannelDefinition['requiresAuthentication'] =>
  relationGate(relationEqual(kind, 'public'), () => ({ kind: 'false' as const }), () => ({ kind: 'true' as const }));

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

    return createDomainAstJudgment({ kind: 'channel_ast', semantic: definition, source: input.source });
  },
};
