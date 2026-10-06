import type { RouteGroupContext, RouteProducer, RouteProducerInput } from '../../../../types/upstream/route';
import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import { resolveRouteGroupContext } from '../../descriptors/route/routeGroupContextResolver';

const semanticProducer: RouteProducer = {
  produce(input: RouteProducerInput) {
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

// Phase 53 contract: Laravel group syntax is interpreted once at the upstream
// AST -> ADT boundary; RouteProducer remains AST-free.
const declaration = {
  method: 'get',
  targetMethods: ['get'],
  path: '/users',
  target: { kind: 'closure', action: 'closure_1', returns: [] },
  prefix: ['/admin'],
  middleware: ['auth'],
  source: { value: 'Route' },
  end: { value: ')' },
} as unknown as RouteDeclarationAst;

const group: RouteGroupContext = resolveRouteGroupContext(declaration);
if (group.prefix.kind !== 'some' || group.middlewareMutations.kind !== 'cons') {
  throw new Error('Phase 53 route-group semantic boundary failed');
}
