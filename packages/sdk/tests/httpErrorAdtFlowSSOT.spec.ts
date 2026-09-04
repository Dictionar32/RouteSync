import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import {
  HttpErrorKind,
  HTTP_ERROR_KIND_REGISTRY,
  matchHttpError,
  HttpStatusCode,
  ScannedHttpErrorResponseDescriptor,
  ScannedRouteDescriptor,
  CrudRole,
  RouteHookKind,
  ResourceResponseDescriptor,
  RouteManifest
} from '@routesync/core'
import { ContractCodeBuilder } from '@routesync/core/src/compiler/generators/contract-generation/ContractCodeBuilder'
import { HookGenerator } from '@routesync/cli/src/generators/HookGenerator'
import { TypeGenerator } from '@routesync/cli/src/generators/TypeGenerator'

describe('HTTP Error ADT Flow SSOT (Zero-if Error Catamorphism Suite)', () => {
  const tmpDir = path.join(__dirname, 'tmp-http-error-adt-test')

  it('1. HTTP_ERROR_KIND_REGISTRY should enforce metadata specifications for all HttpErrorKinds', () => {
    const kinds = Object.values(HttpErrorKind)
    expect(kinds.length).toBe(6)

    for (const kind of kinds) {
      const spec = HTTP_ERROR_KIND_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.defaultStatusCode).toBe('number')
      expect(typeof spec.defaultName).toBe('string')
      expect(typeof spec.defaultTypeName).toBe('string')
      expect(typeof spec.isClientError).toBe('boolean')
      expect(typeof spec.isServerError).toBe('boolean')
      expect(spec.isClientError !== spec.isServerError).toBe(true)
    }

    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.Validation].defaultStatusCode).toBe(HttpStatusCode.UnprocessableEntity)
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.Validation].defaultTypeName).toBe('LaravelValidationError')
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.Unauthorized].defaultStatusCode).toBe(HttpStatusCode.Unauthorized)
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.Unauthorized].defaultTypeName).toBe('LaravelUnauthorizedError')
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.Forbidden].defaultStatusCode).toBe(HttpStatusCode.Forbidden)
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.NotFound].defaultStatusCode).toBe(HttpStatusCode.NotFound)
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.ServerError].defaultStatusCode).toBe(HttpStatusCode.InternalServerError)
    expect(HTTP_ERROR_KIND_REGISTRY[HttpErrorKind.ServerError].isServerError).toBe(true)
  })

  it('2. matchHttpError should execute pure catamorphism without if/switch', () => {
    const validationErr = ScannedHttpErrorResponseDescriptor.validation()
    const unauthorizedErr = ScannedHttpErrorResponseDescriptor.unauthorized()
    const forbiddenErr = ScannedHttpErrorResponseDescriptor.forbidden()
    const notFoundErr = ScannedHttpErrorResponseDescriptor.notFound()
    const serverErr = ScannedHttpErrorResponseDescriptor.serverError()
    const customErr = ScannedHttpErrorResponseDescriptor.custom(HttpStatusCode.Conflict, 'Conflict')

    const visitor = {
      validation: (err: any) => `VAL:${err.statusCode}`,
      unauthorized: (err: any) => `AUTH:${err.statusCode}`,
      forbidden: (err: any) => `FORBID:${err.statusCode}`,
      notFound: (err: any) => `NF:${err.statusCode}`,
      serverError: (err: any) => `500:${err.statusCode}`,
      custom: (err: any) => `CUST:${err.statusCode}`
    }

    expect(matchHttpError(validationErr, visitor)).toBe('VAL:422')
    expect(matchHttpError(unauthorizedErr, visitor)).toBe('AUTH:401')
    expect(matchHttpError(forbiddenErr, visitor)).toBe('FORBID:403')
    expect(matchHttpError(notFoundErr, visitor)).toBe('NF:404')
    expect(matchHttpError(serverErr, visitor)).toBe('500:500')
    expect(matchHttpError(customErr, visitor)).toBe('CUST:409')

    expect(matchHttpError(HttpErrorKind.Validation, visitor)).toBe('VAL:422')
    expect(matchHttpError(HttpErrorKind.Unauthorized, visitor)).toBe('AUTH:401')
  })

  it('3. ScannedHttpErrorResponseDescriptor semantic factories should return frozen complete contracts', () => {
    const val = ScannedHttpErrorResponseDescriptor.validation()
    expect(val.kind).toBe(HttpErrorKind.Validation)
    expect(val.statusCode).toBe(422)
    expect(val.typeName).toBe('LaravelValidationError')
    expect(Object.isFrozen(val)).toBe(true)
    expect(Object.isFrozen(val.schema)).toBe(true)

    const unauth = ScannedHttpErrorResponseDescriptor.unauthorized()
    expect(unauth.kind).toBe(HttpErrorKind.Unauthorized)
    expect(unauth.statusCode).toBe(401)
    expect(unauth.typeName).toBe('LaravelUnauthorizedError')
    expect(Object.isFrozen(unauth)).toBe(true)

    const forbid = ScannedHttpErrorResponseDescriptor.forbidden()
    expect(forbid.kind).toBe(HttpErrorKind.Forbidden)
    expect(forbid.statusCode).toBe(403)
    expect(forbid.typeName).toBe('LaravelForbiddenError')

    const nf = ScannedHttpErrorResponseDescriptor.notFound()
    expect(nf.kind).toBe(HttpErrorKind.NotFound)
    expect(nf.statusCode).toBe(404)
    expect(nf.typeName).toBe('LaravelNotFoundError')

    const srv = ScannedHttpErrorResponseDescriptor.serverError()
    expect(srv.kind).toBe(HttpErrorKind.ServerError)
    expect(srv.statusCode).toBe(500)
    expect(srv.typeName).toBe('LaravelServerError')
  })

  it('4. ContractCodeBuilder should emit canonical Zod error schemas and validators', () => {
    const builder = new ContractCodeBuilder()
    const built = builder.buildContractFile([], [])

    expect(built.code).toContain('export const laravelValidationErrorSchema = z.object({')
    expect(built.code).toContain('export type LaravelValidationError = z.infer<typeof laravelValidationErrorSchema>;')
    expect(built.code).toContain('export const validateLaravelValidationError =')
    expect(built.code).toContain('export const laravelUnauthorizedErrorSchema = z.object({')
    expect(built.code).toContain('export const validateLaravelUnauthorizedError =')
  })

  it('5. HookGenerator should emit typed error slot when error responses are present in route contract', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      name: 'orders.store',
      method: 'POST',
      path: '/api/orders',
      resourceName: 'Order',
      groupName: 'orders',
      actionName: 'store',
      actionKind: 'create',
      isMutating: true,
      crudRole: CrudRole.Create,
      hookKind: RouteHookKind.Mutation,
      response: ResourceResponseDescriptor.single('OrderResource'),
      errorResponses: [
        ScannedHttpErrorResponseDescriptor.validation(),
        ScannedHttpErrorResponseDescriptor.unauthorized()
      ]
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const code = await HookGenerator.generate(manifest)
    expect(code).toContain('error: typeOf<LaravelUnauthorizedError | LaravelValidationError>()')
    expect(code).toContain('LaravelValidationError')
    expect(code).toContain('LaravelUnauthorizedError')
  })

  it('6. TypeGenerator should export canonical error interfaces in types/index.ts', async () => {
    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: []
    }

    await fs.remove(tmpDir)
    await fs.ensureDir(tmpDir)
    await TypeGenerator.generate(manifest, tmpDir)

    const typesIndex = await fs.readFile(path.join(tmpDir, 'types', 'index.ts'), 'utf-8')
    expect(typesIndex).toContain('export interface LaravelValidationError {')
    expect(typesIndex).toContain('export interface LaravelUnauthorizedError {')

    await fs.remove(tmpDir)
  })
})
