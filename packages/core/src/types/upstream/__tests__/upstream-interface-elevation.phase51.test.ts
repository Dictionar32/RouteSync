import type { RouteDefinition, RouteProducer, RouteProducerInput } from '../route';

// Phase 51 contract: the semantic route producer must not require or return AST.
const semanticProducer: RouteProducer = {
  produce(input: RouteProducerInput): RouteDefinition {
    return {
      kind: 'route',
      identity: input.identity,
      special: input.special,
      domain: input.domain,
      group: input.group,
      bindings: input.bindings,
      returnSemantic: input.returnSemantic,
      security: input.security,
      capability: input.capability,
      defaults: input.defaults,
      transport: input.transport,
      provenance: input.provenance,
    };
  },
};

void semanticProducer;
