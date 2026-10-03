import { strict as assert } from 'node:assert';
import { adaptRouteConstraintsAst } from '../routeConstraintAstAdapter';
import { resolveRouteConstraintFlow } from '../routeConstraintFlowResolver';

describe('phase 67 route constraint semantic elevation', () => {
  it('extracts route syntax as semantic facts without resolving Laravel meaning at the AST boundary', () => {
    const facts = adaptRouteConstraintsAst({
      routeConstraints: [{ method: 'where', parameter: 'id', value: '[0-9]+' }],
      groupConstraints: [],
    } as any);

    assert.equal(facts[0].parameter.value.value, 'id');
    assert.equal(facts[0].kind, 'regex');
    assert.equal(facts[0].value?.value, '[0-9]+');
    assert.equal(facts[0].source.kind, 'route');
  });

  it('resolves Laravel helper constraints into semantic matchers upstream', () => {
    const facts = adaptRouteConstraintsAst({
      routeConstraints: [
        { method: 'whereNumber', parameter: 'id', value: undefined },
        { method: 'whereUuid', parameter: 'token', value: undefined },
      ],
      groupConstraints: [],
    } as any);

    const flow = resolveRouteConstraintFlow({ facts });
    assert.equal(flow.effective[0].matcher.kind, 'number');
    assert.equal(flow.effective[1].matcher.kind, 'uuid');
  });

  it('preserves merged group and route constraints in the semantic flow', () => {
    const facts = adaptRouteConstraintsAst({
      groupConstraints: [{ method: 'where', parameter: 'id', value: '[A-Za-z]+' }],
      routeConstraints: [{ method: 'where', parameter: 'slug', value: '[a-z-]+' }],
    } as any);

    const flow = resolveRouteConstraintFlow({ facts });
    assert.equal(flow.effective.length, 2);
    assert.equal(flow.effective[0].source.kind, 'group');
    assert.equal(flow.effective[1].source.kind, 'route');
  });
});
