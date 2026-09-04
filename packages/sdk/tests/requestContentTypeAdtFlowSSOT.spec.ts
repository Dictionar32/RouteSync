import { describe, test, expect } from 'vitest'
import {
  matchRequestContentType,
  REQUEST_CONTENT_TYPE_REGISTRY,
  RequestContentType,
  JsonRequestContentTypeDescriptor,
  MultipartRequestContentTypeDescriptor,
  UrlEncodedRequestContentTypeDescriptor,
  NoneRequestContentTypeDescriptor,
  ScannedRequestContentTypeDescriptor
} from '../../core/src'

describe('RequestContentType ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRequestContentType executes pure catamorphism for Json content type', () => {
    const desc: JsonRequestContentTypeDescriptor = ScannedRequestContentTypeDescriptor.json()

    const result = matchRequestContentType(desc, {
      json: (d) => `JSON:${d.mimeType}:${d.isBinary}:${d.hasPayload}`,
      multipart: (d) => `MULTIPART:${d.mimeType}`,
      urlEncoded: (d) => `URLENCODED:${d.mimeType}`,
      none: () => 'NONE'
    })

    expect(result).toBe('JSON:application/json:false:true')
    expect(desc.kind).toBe(RequestContentType.Json)
    expect(desc.mimeType).toBe('application/json')
    expect(desc.isBinary).toBe(false)
    expect(desc.hasPayload).toBe(true)
  })

  test('2. matchRequestContentType executes pure catamorphism for Multipart content type', () => {
    const desc: MultipartRequestContentTypeDescriptor = ScannedRequestContentTypeDescriptor.multipart()

    const result = matchRequestContentType(desc, {
      json: () => 'JSON',
      multipart: (d) => `MULTIPART:${d.mimeType}:${d.isBinary}:${d.hasPayload}`,
      urlEncoded: () => 'URLENCODED',
      none: () => 'NONE'
    })

    expect(result).toBe('MULTIPART:multipart/form-data:true:true')
    expect(desc.kind).toBe(RequestContentType.Multipart)
    expect(desc.mimeType).toBe('multipart/form-data')
    expect(desc.isBinary).toBe(true)
    expect(desc.hasPayload).toBe(true)
  })

  test('3. matchRequestContentType executes pure catamorphism for UrlEncoded content type', () => {
    const desc: UrlEncodedRequestContentTypeDescriptor = ScannedRequestContentTypeDescriptor.urlEncoded()

    const result = matchRequestContentType(desc, {
      json: () => 'JSON',
      multipart: () => 'MULTIPART',
      urlEncoded: (d) => `URLENCODED:${d.mimeType}:${d.isBinary}:${d.hasPayload}`,
      none: () => 'NONE'
    })

    expect(result).toBe('URLENCODED:application/x-www-form-urlencoded:false:true')
    expect(desc.kind).toBe(RequestContentType.UrlEncoded)
    expect(desc.mimeType).toBe('application/x-www-form-urlencoded')
    expect(desc.isBinary).toBe(false)
    expect(desc.hasPayload).toBe(true)
  })

  test('4. matchRequestContentType executes pure catamorphism for None content type', () => {
    const desc: NoneRequestContentTypeDescriptor = ScannedRequestContentTypeDescriptor.none()

    const result = matchRequestContentType(desc, {
      json: () => 'JSON',
      multipart: () => 'MULTIPART',
      urlEncoded: () => 'URLENCODED',
      none: (d) => `NONE:${d.mimeType}:${d.isBinary}:${d.hasPayload}`
    })

    expect(result).toBe('NONE:null:false:false')
    expect(desc.kind).toBe(RequestContentType.None)
    expect(desc.mimeType).toBeNull()
    expect(desc.isBinary).toBe(false)
    expect(desc.hasPayload).toBe(false)
  })

  test('5. REQUEST_CONTENT_TYPE_REGISTRY enforces frozen specifications for all 4 content types', () => {
    expect(Object.isFrozen(REQUEST_CONTENT_TYPE_REGISTRY)).toBe(true)

    expect(REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Json]).toEqual({
      kind: RequestContentType.Json,
      mimeType: 'application/json',
      isBinary: false,
      hasPayload: true,
      headerExpression: "'Content-Type': 'application/json'"
    })

    expect(REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Multipart]).toEqual({
      kind: RequestContentType.Multipart,
      mimeType: 'multipart/form-data',
      isBinary: true,
      hasPayload: true,
      headerExpression: "'Content-Type': 'multipart/form-data'"
    })

    expect(REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.UrlEncoded]).toEqual({
      kind: RequestContentType.UrlEncoded,
      mimeType: 'application/x-www-form-urlencoded',
      isBinary: false,
      hasPayload: true,
      headerExpression: "'Content-Type': 'application/x-www-form-urlencoded'"
    })

    expect(REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.None]).toEqual({
      kind: RequestContentType.None,
      mimeType: null,
      isBinary: false,
      hasPayload: false,
      headerExpression: null
    })
  })

  test('6. ScannedRequestContentTypeDescriptor semantic factories produce frozen instances', () => {
    const j = ScannedRequestContentTypeDescriptor.json()
    const m = ScannedRequestContentTypeDescriptor.multipart()
    const u = ScannedRequestContentTypeDescriptor.urlEncoded()
    const n = ScannedRequestContentTypeDescriptor.none()
    const fromK = ScannedRequestContentTypeDescriptor.fromKind(RequestContentType.Json)

    expect(Object.isFrozen(j)).toBe(true)
    expect(Object.isFrozen(m)).toBe(true)
    expect(Object.isFrozen(u)).toBe(true)
    expect(Object.isFrozen(n)).toBe(true)
    expect(Object.isFrozen(fromK)).toBe(true)
  })

  test('7. matchRequestContentType accepts either a descriptor instance or raw kind string', () => {
    const fromString = matchRequestContentType(RequestContentType.Multipart, {
      json: () => 'is_json',
      multipart: () => 'is_multipart',
      urlEncoded: () => 'is_urlencoded',
      none: () => 'is_none'
    })

    const fromDescriptor = matchRequestContentType(ScannedRequestContentTypeDescriptor.multipart(), {
      json: () => 'is_json',
      multipart: () => 'is_multipart',
      urlEncoded: () => 'is_urlencoded',
      none: () => 'is_none'
    })

    expect(fromString).toBe('is_multipart')
    expect(fromDescriptor).toBe('is_multipart')
  })

  test('8. Pure functional pipeline transforms content types into HTTP fetch options without branching', () => {
    const routes = [
      { path: '/api/users', contentType: RequestContentType.None },
      { path: '/api/users', contentType: RequestContentType.Json },
      { path: '/api/avatar', contentType: RequestContentType.Multipart },
      { path: '/api/oauth/token', contentType: RequestContentType.UrlEncoded }
    ]

    const fetchConfigHeaders = routes.map(r => matchRequestContentType(r.contentType, {
      json: () => ({ 'Content-Type': 'application/json', bodyMode: 'json_stringify' }),
      multipart: () => ({ bodyMode: 'form_data' }),
      urlEncoded: () => ({ 'Content-Type': 'application/x-www-form-urlencoded', bodyMode: 'url_search_params' }),
      none: () => ({ bodyMode: 'no_body' })
    }))

    expect(fetchConfigHeaders).toEqual([
      { bodyMode: 'no_body' },
      { 'Content-Type': 'application/json', bodyMode: 'json_stringify' },
      { bodyMode: 'form_data' },
      { 'Content-Type': 'application/x-www-form-urlencoded', bodyMode: 'url_search_params' }
    ])
  })
})
