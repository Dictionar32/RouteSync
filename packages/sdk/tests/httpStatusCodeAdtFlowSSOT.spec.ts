import { describe, test, expect } from 'vitest'
import {
  HttpStatusCode,
  HTTP_STATUS_CODE_REGISTRY,
  matchHttpStatusCode,
  HttpStatusCodeVisitor,
  KnownHttpStatusCode
} from '../../core/src'

describe('HttpStatusCode ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchHttpStatusCode executes pure catamorphism for success codes (200, 201, 202, 204)', () => {
    const visitor: HttpStatusCodeVisitor<string> = {
      200: (spec) => `SUCCESS:${spec.code}:${spec.statusText}`,
      201: (spec) => `CREATED:${spec.code}:${spec.statusText}`,
      202: (spec) => `ACCEPTED:${spec.code}:${spec.statusText}`,
      204: (spec) => `NO_CONTENT:${spec.code}:${spec.hasResponseBody}`,
      400: () => 'ERROR',
      401: () => 'ERROR',
      403: () => 'ERROR',
      404: () => 'ERROR',
      405: () => 'ERROR',
      409: () => 'ERROR',
      422: () => 'ERROR',
      429: () => 'ERROR',
      500: () => 'ERROR'
    }

    expect(matchHttpStatusCode(HttpStatusCode.Ok, visitor)).toBe('SUCCESS:200:OK')
    expect(matchHttpStatusCode(HttpStatusCode.Created, visitor)).toBe('CREATED:201:Created')
    expect(matchHttpStatusCode(HttpStatusCode.Accepted, visitor)).toBe('ACCEPTED:202:Accepted')
    expect(matchHttpStatusCode(HttpStatusCode.NoContent, visitor)).toBe('NO_CONTENT:204:false')
  })

  test('2. matchHttpStatusCode executes pure catamorphism for client error codes (400, 401, 403, 404, 422, etc.)', () => {
    const visitor: HttpStatusCodeVisitor<string> = {
      200: () => 'OK',
      201: () => 'OK',
      202: () => 'OK',
      204: () => 'OK',
      400: (spec) => `CLIENT_ERR:${spec.name}`,
      401: (spec) => `AUTH_ERR:${spec.name}`,
      403: (spec) => `PERM_ERR:${spec.name}`,
      404: (spec) => `NOT_FOUND:${spec.name}`,
      405: (spec) => `METHOD_NOT_ALLOWED:${spec.name}`,
      409: (spec) => `CONFLICT:${spec.name}`,
      422: (spec) => `VALIDATION_ERR:${spec.name}`,
      429: (spec) => `RATE_LIMITED:${spec.name}`,
      500: () => 'SERVER_ERR'
    }

    expect(matchHttpStatusCode(HttpStatusCode.BadRequest, visitor)).toBe('CLIENT_ERR:BadRequest')
    expect(matchHttpStatusCode(HttpStatusCode.Unauthorized, visitor)).toBe('AUTH_ERR:Unauthorized')
    expect(matchHttpStatusCode(HttpStatusCode.Forbidden, visitor)).toBe('PERM_ERR:Forbidden')
    expect(matchHttpStatusCode(HttpStatusCode.NotFound, visitor)).toBe('NOT_FOUND:NotFound')
    expect(matchHttpStatusCode(HttpStatusCode.UnprocessableEntity, visitor)).toBe('VALIDATION_ERR:UnprocessableEntity')
    expect(matchHttpStatusCode(HttpStatusCode.TooManyRequests, visitor)).toBe('RATE_LIMITED:TooManyRequests')
  })

  test('3. matchHttpStatusCode executes pure catamorphism for server error code (500)', () => {
    const visitor: HttpStatusCodeVisitor<string> = {
      200: () => 'OK',
      201: () => 'OK',
      202: () => 'OK',
      204: () => 'OK',
      400: () => 'ERR',
      401: () => 'ERR',
      403: () => 'ERR',
      404: () => 'ERR',
      405: () => 'ERR',
      409: () => 'ERR',
      422: () => 'ERR',
      429: () => 'ERR',
      500: (spec) => `SERVER_ERR:${spec.isServerError}:${spec.statusText}`
    }

    expect(matchHttpStatusCode(HttpStatusCode.InternalServerError, visitor)).toBe('SERVER_ERR:true:Internal Server Error')
  })

  test('4. matchHttpStatusCode accepts response objects with status or statusCode property', () => {
    const responseWithStatus = { status: 422, message: 'Validation Failed' }
    const responseWithStatusCode = { statusCode: 401, error: 'Unauthorized' }

    const visitor: HttpStatusCodeVisitor<string> = {
      200: () => 'OK',
      201: () => 'OK',
      202: () => 'OK',
      204: () => 'OK',
      400: () => 'ERR',
      401: () => 'MATCHED_401',
      403: () => 'ERR',
      404: () => 'ERR',
      405: () => 'ERR',
      409: () => 'ERR',
      422: () => 'MATCHED_422',
      429: () => 'ERR',
      500: () => 'ERR'
    }

    expect(matchHttpStatusCode(responseWithStatus, visitor)).toBe('MATCHED_422')
    expect(matchHttpStatusCode(responseWithStatusCode, visitor)).toBe('MATCHED_401')
  })

  test('5. HTTP_STATUS_CODE_REGISTRY provides frozen O(1) specifications for all 13 status codes', () => {
    expect(Object.isFrozen(HTTP_STATUS_CODE_REGISTRY)).toBe(true)

    const allCodes: readonly KnownHttpStatusCode[] = Object.values(HttpStatusCode)
    expect(allCodes.length).toBe(13)

    for (const code of allCodes) {
      const spec = HTTP_STATUS_CODE_REGISTRY[code]
      expect(spec).toBeDefined()
      expect(spec.code).toBe(code)
      expect(typeof spec.name).toBe('string')
      expect(['informational', 'success', 'redirection', 'client_error', 'server_error']).toContain(spec.category)
      expect(typeof spec.isSuccess).toBe('boolean')
      expect(typeof spec.isError).toBe('boolean')
      expect(typeof spec.isClientError).toBe('boolean')
      expect(typeof spec.isServerError).toBe('boolean')
      expect(typeof spec.hasResponseBody).toBe('boolean')
      expect(typeof spec.statusText).toBe('string')
      expect(typeof spec.description).toBe('string')
    }

    // Success codes
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.Ok].isSuccess).toBe(true)
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.Created].isSuccess).toBe(true)
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.NoContent].hasResponseBody).toBe(false)

    // Client errors
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.BadRequest].isClientError).toBe(true)
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.Unauthorized].isClientError).toBe(true)
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.UnprocessableEntity].isClientError).toBe(true)

    // Server error
    expect(HTTP_STATUS_CODE_REGISTRY[HttpStatusCode.InternalServerError].isServerError).toBe(true)
  })

  test('6. Zero-if pipeline classifying HTTP responses via HTTP_STATUS_CODE_REGISTRY', () => {
    const responses = [
      { endpoint: '/orders', status: 200 },
      { endpoint: '/orders', status: 201 },
      { endpoint: '/orders', status: 422 },
      { endpoint: '/orders', status: 500 }
    ]

    const classifications = responses.map(r => {
      const spec = HTTP_STATUS_CODE_REGISTRY[r.status as KnownHttpStatusCode]
      return `${r.endpoint} -> ${spec.category} (${spec.statusText})`
    })

    expect(classifications).toEqual([
      '/orders -> success (OK)',
      '/orders -> success (Created)',
      '/orders -> client_error (Unprocessable Entity)',
      '/orders -> server_error (Internal Server Error)'
    ])
  })
})
