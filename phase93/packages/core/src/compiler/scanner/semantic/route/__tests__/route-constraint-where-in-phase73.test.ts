import { extractRouteConstraintFactsFromAst } from '../routeConstraintAstAdapter';
import { resolveRouteConstraintFlow } from '../routeConstraintFlowResolver';
import { createRoutePathLiteral, type RouteDeclarationAst } from '../../../lexer/routeAst/routeDeclarationAst';

describe('Phase 73 route whereIn semantic elevation', () => {
  it('elevates whereIn values into an explicit semantic matcher', () => {
    const declaration = {
      routeConstraints: [{ method: 'whereIn', parameter: 'category', value: undefined, values: ['movie', 'song', 'painting'] }],
      groupConstraints: [],
      path: createRoutePathLiteral('/category/{category}'),
    } as unknown as RouteDeclarationAst;

    const facts = extractRouteConstraintFactsFromAst(declaration);
    const flow = resolveRouteConstraintFlow({ facts });

    expect(facts[0]).toMatchObject({ method: 'whereIn', parameter: 'category' });
    expect(flow.route[0]?.matcher).toEqual({
      kind: 'in',
      values: [
        { kind: 'literal', value: 'movie' },
        { kind: 'literal', value: 'song' },
        { kind: 'literal', value: 'painting' },
      ],
    });
  });
});


describe('Phase 74 whereIn syntax fact boundary', () => {
  it('keeps Laravel method syntax in the fact and resolves enum cases upstream', () => {
    const declaration = {
      routeConstraints: [{ method: 'whereIn', parameter: 'category', value: undefined, values: ['CategoryEnum::cases()'] }],
      groupConstraints: [],
      path: createRoutePathLiteral('/category/{category}'),
    } as unknown as RouteDeclarationAst;

    const facts = extractRouteConstraintFactsFromAst(declaration);
    expect(facts[0]).toMatchObject({ method: 'whereIn', values: ['CategoryEnum::cases()'] });

    const flow = resolveRouteConstraintFlow({ facts });
    expect(flow.route[0]?.matcher).toEqual({
      kind: 'in',
      values: [{ kind: 'enum_cases', enum: 'CategoryEnum' }],
    });
  });
});
