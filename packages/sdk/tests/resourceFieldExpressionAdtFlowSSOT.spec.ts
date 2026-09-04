import { describe, test, expect } from 'vitest'
import {
  matchResourceFieldExpression,
  matchResourceExpression,
  RESOURCE_EXPRESSION_REGISTRY,
  ResourceExpressionKind,
  ResourceFieldExpressionFactory,
  ResourceFieldExpression
} from '../../core/src'

describe('ResourceFieldExpression ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchResourceFieldExpression executes pure catamorphism for primitive & literal expressions', () => {
    const prim = ResourceFieldExpressionFactory.primitive('number')
    const primResult = matchResourceFieldExpression(prim, {
      primitive: (expr) => `PRIM:${expr.type}`,
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(primResult).toBe('PRIM:number')

    const lit = ResourceFieldExpressionFactory.literal('active')
    const litResult = matchResourceFieldExpression(lit, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: (expr) => `LIT:${String(expr.value)}`,
      unknown: () => 'U'
    })

    expect(litResult).toBe('LIT:active')
  })

  test('2. matchResourceFieldExpression executes pure catamorphism for model & resource references', () => {
    const modelExpr = ResourceFieldExpressionFactory.model('User', true)
    const modelResult = matchResourceFieldExpression(modelExpr, {
      primitive: () => 'P',
      model: (expr) => `MODEL:${expr.model}:col=${expr.collection}`,
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(modelResult).toBe('MODEL:User:col=true')

    const resExpr = ResourceFieldExpressionFactory.resource('UserResource', false, 'User')
    const resResult = matchResourceFieldExpression(resExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: (expr) => `RES:${expr.resource}:model=${expr.model}:col=${expr.collection}`,
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(resResult).toBe('RES:UserResource:model=User:col=false')
  })

  test('3. matchResourceFieldExpression executes pure catamorphism for containers (object, array)', () => {
    const objExpr = ResourceFieldExpressionFactory.object([
      { name: 'id', propertyName: 'id', expression: ResourceFieldExpressionFactory.primitive('number'), semanticType: 'number', nullable: false }
    ])
    const objResult = matchResourceFieldExpression(objExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: (expr) => `OBJ:count=${expr.fields.length}:${expr.fields[0].name}`,
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(objResult).toBe('OBJ:count=1:id')

    const arrExpr = ResourceFieldExpressionFactory.array({
      name: 'tag',
      propertyName: 'tag',
      expression: ResourceFieldExpressionFactory.primitive('string'),
      semanticType: 'string',
      nullable: false
    })
    const arrResult = matchResourceFieldExpression(arrExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: (expr) => `ARR:${expr.element.name}:${expr.element.semanticType}`,
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(arrResult).toBe('ARR:tag:string')
  })

  test('4. matchResourceFieldExpression executes pure catamorphism for property access & traversal', () => {
    const propExpr = ResourceFieldExpressionFactory.propertyAccess('$this->user', 'name')
    const propResult = matchResourceFieldExpression(propExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: (expr) => `PROP:${expr.target}->${expr.property}`,
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(propResult).toBe('PROP:$this->user->name')

    const nullsafeExpr = ResourceFieldExpressionFactory.nullsafePropertyAccess('$this->profile', 'bio')
    const nullsafeResult = matchResourceFieldExpression(nullsafeExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: (expr) => `NULLSAFE:${expr.target}?->${expr.property}`,
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(nullsafeResult).toBe('NULLSAFE:$this->profile?->bio')

    const varExpr = ResourceFieldExpressionFactory.variable('$totalPrice')
    const varResult = matchResourceFieldExpression(varExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: (expr) => `VAR:${expr.name}`,
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(varResult).toBe('VAR:$totalPrice')
  })

  test('5. matchResourceFieldExpression executes pure catamorphism for computation & method calls', () => {
    const castExpr = ResourceFieldExpressionFactory.typeCast('int', {
      name: 'amount',
      propertyName: 'amount',
      expression: ResourceFieldExpressionFactory.variable('$rawAmount'),
      semanticType: 'string',
      nullable: false
    })
    const castResult = matchResourceFieldExpression(castExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: (expr) => `CAST:(${expr.type}):${expr.expression.name}`,
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(castResult).toBe('CAST:(int):amount')

    const binExpr = ResourceFieldExpressionFactory.binary(
      '.',
      { name: 'first', propertyName: 'first', expression: ResourceFieldExpressionFactory.variable('$a'), semanticType: 'string', nullable: false },
      { name: 'last', propertyName: 'last', expression: ResourceFieldExpressionFactory.variable('$b'), semanticType: 'string', nullable: false }
    )
    const binResult = matchResourceFieldExpression(binExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: (expr) => `BIN:${expr.left.name}${expr.operator}${expr.right.name}`,
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(binResult).toBe('BIN:first.last')

    const methodExpr = ResourceFieldExpressionFactory.methodCall('formatPrice')
    const methodResult = matchResourceFieldExpression(methodExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: (expr) => `METHOD:${expr.method}()`,
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(methodResult).toBe('METHOD:formatPrice()')

    const staticExpr = ResourceFieldExpressionFactory.staticMethodCall('Carbon', 'now')
    const staticResult = matchResourceFieldExpression(staticExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: (expr) => `STATIC:${expr.class}::${expr.method}()`,
      literal: () => 'L',
      unknown: () => 'U'
    })

    expect(staticResult).toBe('STATIC:Carbon::now()')
  })

  test('6. matchResourceFieldExpression handles unknown fallback gracefully', () => {
    const unkExpr = ResourceFieldExpressionFactory.unknown()
    const unkResult = matchResourceFieldExpression(unkExpr, {
      primitive: () => 'P',
      model: () => 'M',
      resource: () => 'R',
      object: () => 'O',
      array: () => 'A',
      property_access: () => 'PA',
      nullsafe_property_access: () => 'NPA',
      variable: () => 'V',
      type_cast: () => 'TC',
      binary_expression: () => 'B',
      method_call: () => 'MC',
      static_method_call: () => 'SMC',
      literal: () => 'L',
      unknown: () => 'UNKNOWN_FALLBACK'
    })

    expect(unkResult).toBe('UNKNOWN_FALLBACK')
  })

  test('7. matchResourceExpression alias behaves identically to matchResourceFieldExpression', () => {
    const prim = ResourceFieldExpressionFactory.primitive('boolean')
    const res = matchResourceExpression(prim, {
      primitive: (p) => p.type,
      model: () => '',
      resource: () => '',
      object: () => '',
      array: () => '',
      property_access: () => '',
      nullsafe_property_access: () => '',
      variable: () => '',
      type_cast: () => '',
      binary_expression: () => '',
      method_call: () => '',
      static_method_call: () => '',
      literal: () => '',
      unknown: () => ''
    })

    expect(res).toBe('boolean')
  })

  test('8. RESOURCE_EXPRESSION_REGISTRY provides frozen O(1) specifications for all 14 variants', () => {
    expect(Object.isFrozen(RESOURCE_EXPRESSION_REGISTRY)).toBe(true)

    const allKinds = Object.values(ResourceExpressionKind)
    expect(allKinds).toHaveLength(14)

    for (const kind of allKinds) {
      const spec = RESOURCE_EXPRESSION_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.category).toBe('string')
      expect(typeof spec.isTerminal).toBe('boolean')
      expect(typeof spec.isResolvableToModel).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }

    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.Primitive].category).toBe('primitive')
    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.Model].isResolvableToModel).toBe(true)
    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.Resource].isResolvableToModel).toBe(true)
    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.PropertyAccess].isResolvableToModel).toBe(true)
    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.Object].category).toBe('container')
    expect(RESOURCE_EXPRESSION_REGISTRY[ResourceExpressionKind.Unknown].category).toBe('fallback')
  })

  test('9. ResourceFieldExpressionFactory creates frozen instances with correct shapes', () => {
    const exprs: readonly ResourceFieldExpression[] = [
      ResourceFieldExpressionFactory.primitive('string'),
      ResourceFieldExpressionFactory.model('Post'),
      ResourceFieldExpressionFactory.resource('PostResource'),
      ResourceFieldExpressionFactory.object([]),
      ResourceFieldExpressionFactory.array({ name: 'x', propertyName: 'x', expression: ResourceFieldExpressionFactory.primitive(), semanticType: 'string', nullable: false }),
      ResourceFieldExpressionFactory.propertyAccess('a', 'b'),
      ResourceFieldExpressionFactory.nullsafePropertyAccess('a', 'b'),
      ResourceFieldExpressionFactory.variable('$x'),
      ResourceFieldExpressionFactory.typeCast('int', { name: 'x', propertyName: 'x', expression: ResourceFieldExpressionFactory.primitive(), semanticType: 'number', nullable: false }),
      ResourceFieldExpressionFactory.binary('+', { name: 'a', propertyName: 'a', expression: ResourceFieldExpressionFactory.primitive(), semanticType: 'number', nullable: false }, { name: 'b', propertyName: 'b', expression: ResourceFieldExpressionFactory.primitive(), semanticType: 'number', nullable: false }),
      ResourceFieldExpressionFactory.methodCall('m'),
      ResourceFieldExpressionFactory.staticMethodCall('C', 'm'),
      ResourceFieldExpressionFactory.literal(123),
      ResourceFieldExpressionFactory.unknown()
    ]

    expect(exprs).toHaveLength(14)
    for (const expr of exprs) {
      expect(Object.isFrozen(expr)).toBe(true)
    }
  })

  test('10. Pure functional expression inspector pipeline without branching (Zero-if pattern)', () => {
    const expressions: readonly ResourceFieldExpression[] = [
      ResourceFieldExpressionFactory.primitive('string'),
      ResourceFieldExpressionFactory.model('Order', true),
      ResourceFieldExpressionFactory.resource('OrderResource', false, 'Order'),
      ResourceFieldExpressionFactory.propertyAccess('$this', 'title'),
      ResourceFieldExpressionFactory.literal(null),
      ResourceFieldExpressionFactory.unknown()
    ]

    const summaries = expressions.map(expr => {
      const spec = RESOURCE_EXPRESSION_REGISTRY[expr.kind]
      const label = matchResourceFieldExpression(expr, {
        primitive: (e) => `Primitive(${e.type})`,
        model: (e) => `Model(${e.model}${e.collection ? '[]' : ''})`,
        resource: (e) => `Resource(${e.resource})`,
        object: () => 'Object',
        array: () => 'Array',
        property_access: (e) => `Property(${e.property})`,
        nullsafe_property_access: (e) => `NullsafeProperty(${e.property})`,
        variable: (e) => `Variable(${e.name})`,
        type_cast: (e) => `Cast(${e.type})`,
        binary_expression: (e) => `Binary(${e.operator})`,
        method_call: (e) => `Method(${e.method})`,
        static_method_call: (e) => `Static(${e.class}::${e.method})`,
        literal: (e) => `Literal(${String(e.value)})`,
        unknown: () => 'Unknown'
      })

      return `${spec.category}:${label}`
    })

    expect(summaries).toEqual([
      'primitive:Primitive(string)',
      'model_ref:Model(Order[])',
      'model_ref:Resource(OrderResource)',
      'traversal:Property(title)',
      'primitive:Literal(null)',
      'fallback:Unknown'
    ])
  })
})
