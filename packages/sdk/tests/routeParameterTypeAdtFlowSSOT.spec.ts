import { describe, test, expect } from 'vitest'
import {
  RouteParameterType,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  matchRouteParameterType,
  RouteParameterTypeVisitor,
  RouteParameter
} from '../../core/src'

describe('RouteParameterType ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRouteParameterType executes pure catamorphism for numeric and boolean types', () => {
    const visitor: RouteParameterTypeVisitor<string> = {
      number: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      string: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      boolean: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      uuid: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      ulid: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      date: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`,
      slug: (spec) => `TS:${spec.tsType}|REGEX:${spec.pattern}`
    }

    expect(matchRouteParameterType(RouteParameterType.Number, visitor)).toBe('TS:number|REGEX:^\\d+$')
    expect(matchRouteParameterType(RouteParameterType.Boolean, visitor)).toBe('TS:boolean|REGEX:^(true|false|1|0)$')
  })

  test('2. matchRouteParameterType executes pure catamorphism for string-like and identifier types', () => {
    const visitor: RouteParameterTypeVisitor<string> = {
      number: () => 'num',
      string: () => 'str',
      boolean: () => 'bool',
      uuid: () => 'uuid',
      ulid: () => 'ulid',
      date: () => 'date',
      slug: () => 'slug'
    }

    expect(matchRouteParameterType(RouteParameterType.String, visitor)).toBe('str')
    expect(matchRouteParameterType(RouteParameterType.Uuid, visitor)).toBe('uuid')
    expect(matchRouteParameterType(RouteParameterType.Ulid, visitor)).toBe('ulid')
    expect(matchRouteParameterType(RouteParameterType.Date, visitor)).toBe('date')
    expect(matchRouteParameterType(RouteParameterType.Slug, visitor)).toBe('slug')
  })

  test('3. matchRouteParameterType accepts RouteParameter descriptor objects as input', () => {
    const param: RouteParameter = {
      name: 'post_id',
      propertyName: 'postId',
      bindingField: null,
      in: 'path',
      required: true,
      type: RouteParameterType.Number
    }

    const result = matchRouteParameterType(param, {
      number: () => 'NUMBER_PARAM',
      string: () => 'STRING_PARAM',
      boolean: () => 'BOOLEAN_PARAM',
      uuid: () => 'UUID_PARAM',
      ulid: () => 'ULID_PARAM',
      date: () => 'DATE_PARAM',
      slug: () => 'SLUG_PARAM'
    })

    expect(result).toBe('NUMBER_PARAM')
  })

  test('4. ROUTE_PARAMETER_TYPE_REGISTRY provides frozen O(1) specifications for all 7 types', () => {
    expect(Object.isFrozen(ROUTE_PARAMETER_TYPE_REGISTRY)).toBe(true)

    const allTypes: readonly RouteParameterType[] = Object.values(RouteParameterType)
    expect(allTypes.length).toBe(7)

    for (const type of allTypes) {
      const spec = ROUTE_PARAMETER_TYPE_REGISTRY[type]
      expect(spec).toBeDefined()
      expect(spec.type).toBe(type)
      expect(['number', 'string', 'boolean']).toContain(spec.tsType)
      expect(typeof spec.isNumeric).toBe('boolean')
      expect(typeof spec.isStringLike).toBe('boolean')
      expect(typeof spec.isIdentifier).toBe('boolean')
      expect(typeof spec.pattern).toBe('string')
      expect(typeof spec.zodValidator).toBe('string')
      expect(typeof spec.description).toBe('string')
    }

    // Number
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Number].tsType).toBe('number')
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Number].isNumeric).toBe(true)
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Number].isIdentifier).toBe(true)

    // Boolean
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Boolean].tsType).toBe('boolean')
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Boolean].isNumeric).toBe(false)

    // Uuid / Ulid / Slug identifiers
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Uuid].isIdentifier).toBe(true)
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Ulid].isIdentifier).toBe(true)
    expect(ROUTE_PARAMETER_TYPE_REGISTRY[RouteParameterType.Slug].isIdentifier).toBe(true)
  })

  test('5. Zero-if pipeline for parameter declarations using ROUTE_PARAMETER_TYPE_REGISTRY', () => {
    const params: readonly RouteParameter[] = [
      { name: 'user_id', propertyName: 'userId', bindingField: null, in: 'path', required: true, type: RouteParameterType.Number },
      { name: 'slug', propertyName: 'slug', bindingField: 'slug', in: 'path', required: true, type: RouteParameterType.Slug },
      { name: 'include_meta', propertyName: 'includeMeta', bindingField: null, in: 'query', required: false, type: RouteParameterType.Boolean }
    ]

    const signatures = params.map(p => `${p.propertyName}${p.required ? '' : '?'}: ${ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType}`)
    expect(signatures).toEqual([
      'userId: number',
      'slug: string',
      'includeMeta?: boolean'
    ])
  })
})
