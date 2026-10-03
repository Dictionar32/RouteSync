import type { RouteProducer } from '../../../types/upstream/route';
import { createDomainAstJudgment, type RouteAst } from '../../../types/upstream/ast';

const implementation: RouteProducer = {
  produce(input): RouteAst {
    const definition = {
      kind: 'route' as const,
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
    return createDomainAstJudgment({
      kind: 'route_ast',
      semantic: { kind: 'route_ast_semantic', declaration: input.declaration, definition },
      source: input.source,
    });
  },
};

export const routeProducer: RouteProducer = implementation;
