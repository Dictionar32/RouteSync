import type { RouteAst } from '../../../types/upstream/ast';
import type { RouteDefinition, RouteProducer, RouteProducerInput } from '../../../types/upstream/route';
import { routeProducer } from '../subscanners/routeProducer';

// Phase 52: RouteAst remains a construction artifact while semantic flow stays AST-free.
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

const routeAstConstructionShape: (input: Parameters<typeof routeProducer.produce>[0]) => RouteAst =
  input => routeProducer.produce(input);

void semanticProducer;
void routeAstConstructionShape;
