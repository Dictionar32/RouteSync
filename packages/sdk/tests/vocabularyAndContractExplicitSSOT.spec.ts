import { describe, it, expect } from 'vitest'
import {
  DatabaseColumnKind,
  DatabaseColumnTypeMapper,
  HttpStatusCode,
  RouteSecurityClassifier,
  SecuritySchemeKind,
  ScannedRouteDescriptor,
  ScannedModelColumnDescriptor,
  RouteParameterType,
  PrimitiveKind
} from '@routesync/core'

describe('Explicit Core Vocabulary & Domain Models SSOT', () => {
  it('1. DatabaseColumnKind and DatabaseColumnTypeMapper should classify SQL types without loose strings', () => {
    expect(DatabaseColumnTypeMapper.toColumnKind('bigint(20) unsigned')).toBe(DatabaseColumnKind.BigInt)
    expect(DatabaseColumnTypeMapper.toColumnKind('tinyint(1)')).toBe(DatabaseColumnKind.TinyInt)
    expect(DatabaseColumnTypeMapper.toColumnKind('varchar(255)')).toBe(DatabaseColumnKind.String)
    expect(DatabaseColumnTypeMapper.toColumnKind('text')).toBe(DatabaseColumnKind.Text)
    expect(DatabaseColumnTypeMapper.toColumnKind('datetime')).toBe(DatabaseColumnKind.DateTime)
    expect(DatabaseColumnTypeMapper.toColumnKind('enum(\'pending\',\'paid\')')).toBe(DatabaseColumnKind.Enum)
    expect(DatabaseColumnTypeMapper.toColumnKind('json')).toBe(DatabaseColumnKind.Json)
    expect(DatabaseColumnTypeMapper.toColumnKind('unknown_engine_type')).toBe(DatabaseColumnKind.Unknown)

    const col = ScannedModelColumnDescriptor.create({
      name: 'status',
      type: 'enum(\'active\',\'inactive\')',
      enumValues: ['active', 'inactive'],
      nullable: false
    })

    expect(col.columnKind).toBe(DatabaseColumnKind.Enum)
    expect(col.propertyName).toBe('status')
  })

  it('2. HttpStatusCode should define explicit status codes', () => {
    expect(HttpStatusCode.Ok).toBe(200)
    expect(HttpStatusCode.Created).toBe(201)
    expect(HttpStatusCode.NoContent).toBe(204)
    expect(HttpStatusCode.BadRequest).toBe(400)
    expect(HttpStatusCode.Unauthorized).toBe(401)
    expect(HttpStatusCode.Forbidden).toBe(403)
    expect(HttpStatusCode.NotFound).toBe(404)
    expect(HttpStatusCode.UnprocessableEntity).toBe(422)
    expect(HttpStatusCode.TooManyRequests).toBe(429)
  })

  it('3. RouteSecurityClassifier should extract Sanctum/Passport abilities into explicit model', () => {
    const security = RouteSecurityClassifier.classify([
      'auth:sanctum',
      'ability:admin,manage-orders',
      'abilities:view-reports'
    ])

    expect(security.isProtected).toBe(true)
    expect(security.scheme).toBe(SecuritySchemeKind.Sanctum)
    expect(security.guards).toEqual(['sanctum'])
    expect(security.abilities).toEqual(['admin', 'manage-orders', 'view-reports'])
  })

  it('4. ScannedRouteDescriptor should parse throttle middleware into RateLimitDescriptor', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/login',
      resourceName: 'AuthResource',
      actionName: 'login',
      actionKind: 'create',
      isMutating: true,
      middleware: ['throttle:5,1', 'guest']
    })

    expect(route.rateLimit).toBeDefined()
    expect(route.rateLimit?.maxAttempts).toBe(5)
    expect(route.rateLimit?.decayMinutes).toBe(1)
  })

  it('5. RouteParameterType should include expanded vocabulary: ulid, date, slug', () => {
    expect(RouteParameterType.Ulid).toBe('ulid')
    expect(RouteParameterType.Date).toBe('date')
    expect(RouteParameterType.Slug).toBe('slug')
  })
})
