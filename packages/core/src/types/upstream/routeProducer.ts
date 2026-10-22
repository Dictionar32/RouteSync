import type { RouteProducer } from './route';
import { createDomainAstJudgment, type RouteAst } from './ast';

/**
 * Canonical RouteProducer implementation owned beside its upstream contract.
 * This operation only materializes the already-resolved route contract into
 * the canonical RouteAst; it does not classify source syntax or infer meaning.
 */
export const routeProducer: RouteProducer = Object.freeze({
  produce(input): RouteAst {
    const definition = Object.freeze({
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
    });
    return createDomainAstJudgment({
      kind: 'route_ast',
      semantic: { kind: 'route_ast_semantic', declaration: input.declaration, definition },
      source: input.source,
    });
  },
});
