import { describe, test, expect } from 'vitest'
import {
  matchRouteParameter,
  PARAMETER_LOCATION_REGISTRY,
  RouteParameterLocation,
  RouteParameterType,
  PathParameterDescriptor,
  QueryParameterDescriptor,
  HeaderParameterDescriptor,
  ScannedRouteParameterDescriptor
} from '../../core/src'

describe('RouteParameter ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRouteParameter executes pure catamorphism for path parameter', () => {
    const param: PathParameterDescriptor = ScannedRouteParameterDescriptor.path({
      name: 'order_id',
      type: RouteParameterType.Number
    })

    const result = matchRouteParameter(param, {
      path: (p) => `PATH:${p.propertyName}:${p.type}:${p.required}`,
      query: (p) => `QUERY:${p.propertyName}`,
      header: (p) => `HEADER:${p.propertyName}`
    })

    expect(result).toBe('PATH:orderId:number:true')
  })

  test('2. matchRouteParameter executes pure catamorphism for query parameter', () => {
    const param: QueryParameterDescriptor = ScannedRouteParameterDescriptor.query({
      name: 'search_term'
    })

    const result = matchRouteParameter(param, {
      path: (p) => `PATH:${p.propertyName}`,
      query: (p) => `QUERY:${p.propertyName}:${p.required}`,
      header: (p) => `HEADER:${p.propertyName}`
    })

    expect(result).toBe('QUERY:searchTerm:false')
  })

  test('3. matchRouteParameter executes pure catamorphism for header parameter', () => {
    const param: HeaderParameterDescriptor = ScannedRouteParameterDescriptor.header({
      name: 'x_api_key'
    })

    const result = matchRouteParameter(param, {
      path: (p) => `PATH:${p.propertyName}`,
      query: (p) => `QUERY:${p.propertyName}`,
      header: (p) => `HEADER:${p.propertyName}:${p.in}`
    })

    expect(result).toBe('HEADER:xApiKey:header')
  })

  test('4. PARAMETER_LOCATION_REGISTRY enforces metadata specifications for all RouteParameterLocations', () => {
    expect(Object.isFrozen(PARAMETER_LOCATION_REGISTRY)).toBe(true)

    expect(PARAMETER_LOCATION_REGISTRY[RouteParameterLocation.Path]).toEqual({
      location: 'path',
      defaultRequired: true,
      isUrlSegment: true,
      isTransportHeader: false
    })

    expect(PARAMETER_LOCATION_REGISTRY[RouteParameterLocation.Query]).toEqual({
      location: 'query',
      defaultRequired: false,
      isUrlSegment: true,
      isTransportHeader: false
    })

    expect(PARAMETER_LOCATION_REGISTRY[RouteParameterLocation.Header]).toEqual({
      location: 'header',
      defaultRequired: true,
      isUrlSegment: false,
      isTransportHeader: true
    })
  })

  test('5. ScannedRouteParameterDescriptor semantic factories return frozen and typed descriptors', () => {
    const pathParam = ScannedRouteParameterDescriptor.fromPathSegment('post:slug')
    const queryParam = ScannedRouteParameterDescriptor.query({ name: 'page' })
    const headerParam = ScannedRouteParameterDescriptor.header({ name: 'x_request_id' })

    expect(Object.isFrozen(pathParam)).toBe(true)
    expect(pathParam.in).toBe(RouteParameterLocation.Path)
    expect(pathParam.name).toBe('post')
    expect(pathParam.propertyName).toBe('post')
    expect(pathParam.bindingField).toBe('slug')
    expect(pathParam.type).toBe(RouteParameterType.String)

    expect(Object.isFrozen(queryParam)).toBe(true)
    expect(queryParam.in).toBe(RouteParameterLocation.Query)
    expect(queryParam.propertyName).toBe('page')

    expect(Object.isFrozen(headerParam)).toBe(true)
    expect(headerParam.in).toBe(RouteParameterLocation.Header)
    expect(headerParam.propertyName).toBe('xRequestId')
  })

  test('6. Pure catamorphic parameter dispatcher builds transport payload partition', () => {
    const params = [
      ScannedRouteParameterDescriptor.path({ name: 'category_id', type: RouteParameterType.Number }),
      ScannedRouteParameterDescriptor.query({ name: 'sort' }),
      ScannedRouteParameterDescriptor.header({ name: 'authorization' })
    ]

    const pathKeys: string[] = []
    const queryKeys: string[] = []
    const headerKeys: string[] = []

    params.forEach(p => matchRouteParameter(p, {
      path: (pt) => { pathKeys.push(pt.propertyName) },
      query: (q) => { queryKeys.push(q.propertyName) },
      header: (h) => { headerKeys.push(h.propertyName) }
    }))

    expect(pathKeys).toEqual(['categoryId'])
    expect(queryKeys).toEqual(['sort'])
    expect(headerKeys).toEqual(['authorization'])
  })
})
