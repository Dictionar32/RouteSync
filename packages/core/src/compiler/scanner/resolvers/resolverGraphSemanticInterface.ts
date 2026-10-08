/**
 * Closed resolver-graph semantic authority.
 *
 * Resolver implementations produce evidence; the graph itself is a relation
 * program. The semantic interface exposes only the saturated judgment.
 */
import type { CrudRole, HttpMethod, RouteSecurityDescriptor } from '../../../types/route';
import type { PropertyName, RoutePath } from '../../../types/upstream/names';
import type { AstMappingInterface } from '../../../types/upstream/astMappingInterface';
import type { RouteDomainResolutionContext, RouteDomainResolutionJudgment } from '../../../types/upstream/routeDomainAuthority';
import type { RouteSecurityResolution } from './RouteSecurityResolver';
import { routeDomainAuthority } from '../../../types/upstream/routeDomainAuthority';
import { routeSecurityAuthority } from '../../../types/upstream/routeSecurityAuthority';
import type { RouteCapabilityContract } from '../../../types/upstream/route';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import { truthValue } from '../../../types/upstream/valueObjects';
import { relationProject } from '../../../semantic/foundation/relationalSequence';
import { solveClosedSemanticRelations, semanticTextTerm, type SemanticRewriteFact, type SemanticRewritePattern, type SemanticRewritePatternTerm, type SemanticRewriteRule } from '../lexer/routeAst/semanticRewriteInterface';

export type ResolverGraphRelation =
  | 'route_input'
  | 'mapping_input'
  | 'domain_input'
  | 'security_input'
  | 'crud_input'
  | 'mapping_refinement'
  | 'domain_resolution'
  | 'security_resolution'
  | 'crud_resolution';

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

export type ResolverGraphSemanticJudgment = Readonly<{
  readonly kind: 'resolver_graph_semantic_judgment';
  readonly mapping: AstMappingInterface['judgment'];
  readonly domain: RouteDomainResolutionJudgment;
  readonly security: RouteSecurityResolution;
  readonly crudRole: CrudRole;
  readonly facts: readonly ResolverGraphFact[];
  readonly edges: readonly ResolverGraphEdge[];
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'resolver_graph_judgment';
  readonly closed: true;
}>;

export type ResolverGraphSemanticInterface = Readonly<{
  readonly kind: 'resolver_graph_semantic_interface';
  readonly authority: 'resolver_graph_judgment';
  readonly judgment: ResolverGraphSemanticJudgment;
  readonly closed: true;
}>;

export type ResolverGraphInput = Readonly<{
  readonly domain: RouteDomainResolutionContext;
  readonly middleware: import("../../../types/upstream/collections").RouteMiddlewares;
  readonly auth: import("../../../types/upstream/valueObjects").TruthValue;
  readonly method: HttpMethod;
  readonly path: RoutePath;
  readonly mapping: AstMappingInterface;
  readonly capability: RouteCapabilityContract;
}>;

const resolverGraphPattern = (relation: ResolverGraphRelation, polarity: 'positive' | 'negative', route: string): SemanticRewritePattern<ResolverGraphRelation> => Object.freeze({
  relation,
  arguments: Object.freeze([semanticTextTerm(route)] as readonly SemanticRewritePatternTerm[]),
  polarity,
});

const resolverGraphRule = (
  id: string,
  priority: number,
  when: readonly SemanticRewritePattern<ResolverGraphRelation>[],
  then: readonly SemanticRewritePattern<ResolverGraphRelation>[],
): SemanticRewriteRule<ResolverGraphRelation> => Object.freeze({
  id,
  priority,
  when: Object.freeze(when),
  then: Object.freeze(then),
});

const resolverGraphRules: readonly SemanticRewriteRule<ResolverGraphRelation>[] = Object.freeze([
  resolverGraphRule('resolver-map', 4,
    Object.freeze([resolverGraphPattern('route_input', 'positive', 'route'), resolverGraphPattern('mapping_input', 'positive', 'route')]),
    Object.freeze([resolverGraphPattern('mapping_refinement', 'positive', 'route')])),
  resolverGraphRule('resolver-domain', 3,
    Object.freeze([resolverGraphPattern('route_input', 'positive', 'route'), resolverGraphPattern('domain_input', 'positive', 'route')]),
    Object.freeze([resolverGraphPattern('domain_resolution', 'positive', 'route')])),
  resolverGraphRule('resolver-security', 2,
    Object.freeze([resolverGraphPattern('route_input', 'positive', 'route'), resolverGraphPattern('security_input', 'positive', 'route')]),
    Object.freeze([resolverGraphPattern('security_resolution', 'positive', 'route')])),
  resolverGraphRule('resolver-crud', 1,
    Object.freeze([resolverGraphPattern('route_input', 'positive', 'route'), resolverGraphPattern('crud_input', 'positive', 'route')]),
    Object.freeze([resolverGraphPattern('crud_resolution', 'positive', 'route')])),
]);

const relation = <R extends ResolverGraphRelation>(name: R, route: string): SemanticRewriteFact<R> => Object.freeze({ relation: name, arguments: Object.freeze([semanticTextTerm(route)]) });

export const resolveResolverGraphJudgment = (input: ResolverGraphInput): ResolverGraphSemanticJudgment => {
  const route = 'route';
  const domain = routeDomainAuthority.resolveJudgment(input.domain);
  const security = routeSecurityAuthority.resolve(input.middleware, input.auth);
  const crudRole = input.capability.crudRole;
  const mapping = input.mapping.judgment;
  const seeds: readonly SemanticRewriteFact<ResolverGraphRelation>[] = Object.freeze([
    relation('route_input', route), relation('mapping_input', route), relation('domain_input', route),
    relation('security_input', route), relation('crud_input', route),
  ]);
  const solved = solveClosedSemanticRelations(seeds, resolverGraphRules);
  const solvedKinds = relationProject(solved.facts, entry => entry.relation);
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
  return Object.freeze({
    kind: 'resolver_graph_semantic_judgment', mapping, domain, security, crudRole, facts, edges,
    closure: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', authority: 'resolver_graph_judgment', closed: true,
  });
};

export const resolverGraphSemanticInterface = (input: ResolverGraphInput): ResolverGraphSemanticInterface => Object.freeze({
  kind: 'resolver_graph_semantic_interface', authority: 'resolver_graph_judgment', judgment: resolveResolverGraphJudgment(input), closed: true,
});
