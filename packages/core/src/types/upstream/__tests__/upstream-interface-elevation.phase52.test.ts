import type { RouteAst } from '../ast';
import type { RouteDefinition, RouteProducer, RouteProducerInput } from '../route';
import { routeAstConstructor } from '../../../compiler/scanner/upstream/routeAstConstruction';

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

const routeAstConstructionShape: (input: Parameters<typeof routeAstConstructor.construct>[0]) => RouteAst =
  input => routeAstConstructor.construct(input);

void semanticProducer;
void routeAstConstructionShape;
