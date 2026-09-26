import type { RouteAst } from '../../../types/upstream/ast';
import type { RouteDefinition, RouteProducer } from '../../../types/upstream/route';

const implementation: RouteProducer = {
  produce(input): RouteAst {
    const definition: RouteDefinition = {
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
    return {
      kind: 'route_ast',
      declaration: input.declaration,
      definition,
      source: input.source,
    };
  },
};

export const routeProducer: RouteProducer = implementation;
