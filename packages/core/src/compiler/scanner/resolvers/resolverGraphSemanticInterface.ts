/**
 * Closed resolver-graph semantic authority.
 *
 * Resolver implementations produce evidence; this authority projects the
 * already-resolved domain judgments into a closed, operation-bearing graph ADT.
 */
import type { CrudRole, HttpMethod, RouteSecurityDescriptor } from '../../../types/route';
import type { RoutePath } from '../../../types/upstream/names';
import type { AstMappingInterface } from '../../../types/upstream/astMappingInterface';
import type { RouteDomainResolutionContext, RouteDomainResolutionJudgment } from '../../../types/upstream/routeDomainAuthority';
import type { RouteSecurityResolution } from './RouteSecurityResolver';
import { routeDomainAuthority } from '../../../types/upstream/routeDomainAuthority';
import type { RouteCapabilityContract } from '../../../types/upstream/route';

export type ResolverGraphFact =
  | Readonly<{ readonly kind: 'domain_candidate'; readonly value: RouteDomainResolutionJudgment['result'] }>
  | Readonly<{ readonly kind: 'security_resolution'; readonly value: RouteSecurityDescriptor }>
  | Readonly<{ readonly kind: 'crud_resolution'; readonly value: CrudRole }>
  | Readonly<{ readonly kind: 'mapping_refinement'; readonly value: AstMappingInterface['judgment'] }>;

export type ResolverGraphEdge = Readonly<{
  readonly kind: 'resolver_edge';
  readonly from: 'route_input' | 'mapping_input' | 'domain_input' | 'security_input' | 'crud_input';
  readonly to: ResolverGraphFact['kind'];
}>;

export interface ResolverGraphSemanticJudgmentContinuationHandlersInterface<Result> {
  readonly candidate_selected: (judgment: ResolverGraphCandidateSelectedJudgment) => Result;
  readonly default_applied: (judgment: ResolverGraphDefaultAppliedJudgment) => Result;
}

type ResolverGraphSemanticJudgmentBase = Readonly<{
  readonly kind: 'resolver_graph_semantic_judgment';
  readonly mapping: AstMappingInterface['judgment'];
  readonly domain: RouteDomainResolutionJudgment;
  readonly security: RouteSecurityResolution;
  readonly crudRole: CrudRole;
  readonly facts: readonly ResolverGraphFact[];
  readonly edges: readonly ResolverGraphEdge[];
  readonly authority: 'resolver_graph_judgment';
  readonly closed: true;
}>;

export type ResolverGraphCandidateSelectedJudgment = ResolverGraphSemanticJudgmentBase & Readonly<{
  readonly domainOutcome: 'candidate_selected';
  readonly continueWith: <Result>(handlers: ResolverGraphSemanticJudgmentContinuationHandlersInterface<Result>) => Result;
}>;

export type ResolverGraphDefaultAppliedJudgment = ResolverGraphSemanticJudgmentBase & Readonly<{
  readonly domainOutcome: 'default_applied';
  readonly continueWith: <Result>(handlers: ResolverGraphSemanticJudgmentContinuationHandlersInterface<Result>) => Result;
}>;

export type ResolverGraphSemanticJudgment = ResolverGraphCandidateSelectedJudgment | ResolverGraphDefaultAppliedJudgment;

export type ResolverGraphSemanticInterface = Readonly<{
  readonly kind: 'resolver_graph_semantic_interface';
  readonly authority: 'resolver_graph_judgment';
  readonly judgment: ResolverGraphSemanticJudgment;
  readonly closed: true;
}>;

export type ResolverGraphInput = Readonly<{
  readonly domain: RouteDomainResolutionContext;
  /** Pre-resolved security judgment; this graph consumes it without recomputing security. */
  readonly security: RouteSecurityResolution;
  readonly method: HttpMethod;
  readonly path: RoutePath;
  readonly mapping: AstMappingInterface;
  readonly capability: RouteCapabilityContract;
}>;

const resolveResolverGraphJudgmentImplementation = (input: ResolverGraphInput): ResolverGraphSemanticJudgment => {
  const domain = routeDomainAuthority.resolveJudgment(input.domain);
  const security = input.security;
  const crudRole = input.capability.crudRole;
  const mapping = input.mapping.judgment;
  const facts: readonly ResolverGraphFact[] = Object.freeze([
    Object.freeze({ kind: 'domain_candidate' as const, value: domain.result }),
    Object.freeze({ kind: 'security_resolution' as const, value: security.security }),
    Object.freeze({ kind: 'crud_resolution' as const, value: crudRole }),
    Object.freeze({ kind: 'mapping_refinement' as const, value: mapping }),
  ]);
  const edges = Object.freeze([
    Object.freeze({ kind: 'resolver_edge' as const, from: 'domain_input' as const, to: 'domain_candidate' as const }),
    Object.freeze({ kind: 'resolver_edge' as const, from: 'security_input' as const, to: 'security_resolution' as const }),
    Object.freeze({ kind: 'resolver_edge' as const, from: 'crud_input' as const, to: 'crud_resolution' as const }),
    Object.freeze({ kind: 'resolver_edge' as const, from: 'mapping_input' as const, to: 'mapping_refinement' as const }),
  ] satisfies readonly ResolverGraphEdge[]);
  const base: ResolverGraphSemanticJudgmentBase = Object.freeze({
    kind: 'resolver_graph_semantic_judgment', mapping, domain, security, crudRole, facts, edges,
    authority: 'resolver_graph_judgment', closed: true,
  });
  switch (domain.selected.kind) {
    case 'candidate_selected': {
      let judgment: ResolverGraphCandidateSelectedJudgment;
      judgment = Object.freeze({
        ...base,
        domainOutcome: 'candidate_selected',
        continueWith: handlers => handlers.candidate_selected(judgment),
      });
      return judgment;
    }
    case 'default_applied': {
      let judgment: ResolverGraphDefaultAppliedJudgment;
      judgment = Object.freeze({
        ...base,
        domainOutcome: 'default_applied',
        continueWith: handlers => handlers.default_applied(judgment),
      });
      return judgment;
    }
  }
};

const createResolverGraphSemanticInterfaceImplementation = (input: ResolverGraphInput): ResolverGraphSemanticInterface => Object.freeze({
  kind: 'resolver_graph_semantic_interface', authority: 'resolver_graph_judgment', judgment: resolveResolverGraphJudgmentImplementation(input), closed: true,
});

export interface ResolverGraphSemanticOperationsInterface {
  readonly resolveJudgment: (input: ResolverGraphInput) => ResolverGraphSemanticJudgment;
  readonly createInterface: (input: ResolverGraphInput) => ResolverGraphSemanticInterface;
}

export const resolverGraphSemanticOperations: ResolverGraphSemanticOperationsInterface = Object.freeze({
  resolveJudgment: resolveResolverGraphJudgmentImplementation,
  createInterface: createResolverGraphSemanticInterfaceImplementation,
});
