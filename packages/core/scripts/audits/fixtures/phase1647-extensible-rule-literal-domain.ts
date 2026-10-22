import type {
  SemanticJudgmentDerivationProgram,
  SemanticJudgmentRuleTerm,
} from '../../../src/types/upstream/semanticJudgmentDerivationInterface';
import { compileSemanticJudgmentRule } from '../../../src/types/upstream/semanticJudgmentRuleCompiler';

type RouteLiteral = 'route:invocation' | 'route:callable';
type BrandedRouteId = string & Readonly<{ readonly __brand: 'RouteId' }>;

declare const brandedRouteId: BrandedRouteId;

const routeLiteralTerm: SemanticJudgmentRuleTerm<RouteLiteral> = Object.freeze({
  kind: 'literal',
  value: 'route:invocation',
});

const brandedRouteTerm: SemanticJudgmentRuleTerm<BrandedRouteId> = Object.freeze({
  kind: 'literal',
  value: brandedRouteId,
});

const routeProgram: SemanticJudgmentDerivationProgram<'route-edge', RouteLiteral> = Object.freeze({
  kind: 'semantic_judgment_derivation_program',
  premises: Object.freeze([Object.freeze({
    relation: 'route-edge',
    arguments: Object.freeze([
      Object.freeze({ kind: 'variable', name: 'source' }),
      routeLiteralTerm,
    ]),
    polarity: 'positive',
  })]),
  conclusions: Object.freeze([Object.freeze({
    relation: 'route-edge',
    arguments: Object.freeze([
      Object.freeze({ kind: 'variable', name: 'source' }),
      Object.freeze({ kind: 'variable', name: 'target' }),
    ]),
    polarity: 'positive',
  })]),
  proof: Object.freeze({ retainPremiseWitnesses: true, retainBindings: true }),
});

const compiled = compileSemanticJudgmentRule<'route-edge', RouteLiteral>({
  id: 'route-literal-extension',
  priority: 0,
  derivation: routeProgram,
});

void brandedRouteTerm;
void compiled;
