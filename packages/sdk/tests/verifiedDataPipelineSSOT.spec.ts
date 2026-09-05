import { describe, it, expect } from 'vitest'
import {
  DiagnosticCategory,
  DIAGNOSTIC_CATEGORY_REGISTRY,
  matchDiagnosticCategory,
  DiagnosticBag,
  CompilerValidationError,
  ScannedRouteDescriptor,
  ResourceResponseDescriptor,
  BroadcastChannelDescriptor,
  BroadcastChannelKind
} from '../../core/src'
import { EchoGenerator } from '../../cli/src/generators/EchoGenerator'
import { MswGenerator } from '../../cli/src/generators/MswGenerator'
import { ContractCodeBuilder } from '../../core/src/compiler/generators/contract-generation/ContractCodeBuilder'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('Invariant-Driven / Verified Data Pipeline SSOT', () => {
  describe('Stage 2: Validation Fail-Fast Gatekeeper', () => {
    it('1. DIAGNOSTIC_CATEGORY_REGISTRY should exhaustively map all diagnostic categories', () => {
      const categories = Object.values(DiagnosticCategory)
      expect(categories).toEqual([
        'syntax',
        'schema',
        'type_mismatch',
        'unresolved_reference',
        'invariant_violation'
      ])

      for (const cat of categories) {
        const spec = DIAGNOSTIC_CATEGORY_REGISTRY[cat]
        expect(spec).toBeDefined()
        expect(spec.category).toBe(cat)
        expect(typeof spec.isFatal).toBe('boolean')
        expect(typeof spec.description).toBe('string')
      }

      expect(DIAGNOSTIC_CATEGORY_REGISTRY[DiagnosticCategory.Syntax].isFatal).toBe(true)
      expect(DIAGNOSTIC_CATEGORY_REGISTRY[DiagnosticCategory.InvariantViolation].isFatal).toBe(true)
      expect(DIAGNOSTIC_CATEGORY_REGISTRY[DiagnosticCategory.TypeMismatch].isFatal).toBe(false)
    })

    it('2. matchDiagnosticCategory catamorphism should dispatch exhaustively', () => {
      const visitor = {
        syntax: () => 'fatal:syntax',
        schema: () => 'fatal:schema',
        type_mismatch: () => 'warn:type',
        unresolved_reference: () => 'warn:reference',
        invariant_violation: () => 'fatal:invariant'
      }

      expect(matchDiagnosticCategory(DiagnosticCategory.Syntax, visitor)).toBe('fatal:syntax')
      expect(matchDiagnosticCategory(DiagnosticCategory.Schema, visitor)).toBe('fatal:schema')
      expect(matchDiagnosticCategory(DiagnosticCategory.TypeMismatch, visitor)).toBe('warn:type')
      expect(matchDiagnosticCategory(DiagnosticCategory.UnresolvedReference, visitor)).toBe('warn:reference')
      expect(matchDiagnosticCategory(DiagnosticCategory.InvariantViolation, visitor)).toBe('fatal:invariant')
    })

    it('3. DiagnosticBag should enforce fail-fast validation gating with assertNoErrors', () => {
      let bag = DiagnosticBag.createEmpty()
      expect(bag.hasErrors()).toBe(false)
      expect(bag.getErrors()).toHaveLength(0)

      // Only warnings should not throw
      bag = bag.report({
        code: 'W001',
        severity: 'warning',
        category: DiagnosticCategory.UnresolvedReference,
        message: 'Optional relation not found'
      })
      expect(bag.hasErrors()).toBe(false)
      expect(bag.getWarnings()).toHaveLength(1)
      expect(() => bag.assertNoErrors('Validation')).not.toThrow()

      // Adding error must cause assertNoErrors to throw CompilerValidationError
      bag = bag.report({
        code: 'E001',
        severity: 'error',
        category: DiagnosticCategory.InvariantViolation,
        message: 'Non-nullable contract violated at origin boundary'
      })
      expect(bag.hasErrors()).toBe(true)
      expect(bag.getErrors()).toHaveLength(1)

      expect(() => bag.assertNoErrors('Validation')).toThrow(CompilerValidationError)
      expect(() => bag.assertNoErrors('Validation')).toThrow('[Verified Pipeline - Validation Gatekeeper] Rejected 1 diagnostic error(s)')
    })
  })

  describe('Stage 5: Boundary Emitters Provenance Annotations', () => {
    it('4. EchoGenerator should emit @provenance and @see JSDoc tags for broadcast channels', async () => {
      const channel: BroadcastChannelDescriptor = {
        name: 'orders.{orderId}',
        kind: BroadcastChannelKind.Private,
        runtimePattern: 'orders.${orderId}',
        parameters: [
          {
            name: 'orderId',
            propertyName: 'orderId',
            type: 'number',
            in: 'path',
            required: true
          }
        ]
      }

      const code = await EchoGenerator.generate([channel])
      expect(code).toContain('* @provenance BroadcastChannel: routes/channels.php (orders.{orderId})')
      expect(code).toContain('* @see routes/channels.php')
      expect(code).toContain('export function useListenOrdersChannel')
    })

    it('5. MswGenerator should emit @provenance and @see JSDoc tags matching route contract', async () => {
      const mockRoute = ScannedRouteDescriptor.create({
        method: 'GET',
        path: '/api/v1/products/{id}',
        resourceName: 'Product',
        actionName: 'show',
        actionKind: 'read',
        isMutating: false,
        response: ResourceResponseDescriptor.single('ProductResource'),
        sourceFile: 'routes/api.php',
        sourceLine: 120,
        controllerName: 'ProductController'
      })

      const manifest: any = {
        baseURL: 'http://localhost',
        routes: [mockRoute]
      }

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'routesync-msw-test-'))
      try {
        await MswGenerator.generate(manifest, tempDir)
        const content = await fs.readFile(path.join(tempDir, 'mocks.ts'), 'utf-8')
        expect(content).toContain('* @provenance Route: routes/api.php:120')
        expect(content).toContain('* @see routes/api.php#L120')
        expect(content).toContain("http.get('http://localhost/api/v1/products/:id'")
      } finally {
        await fs.remove(tempDir)
      }
    })
  })

  describe('Stage 4: Pure IR Lowering & Contract Code Builder', () => {
    it('6. ContractCodeBuilder should emit JSDoc @provenance tags for schemas and response types', () => {
      const builder = new ContractCodeBuilder()
      const built = builder.buildContractFile(
        [
          {
            resourceName: 'Order',
            actions: [
              {
                name: 'create',
                schemaCode: '  Create: z.object({ name: z.string() })',
                typeCode: '  Create: { name: string }'
              }
            ]
          }
        ],
        [
          {
            resourceName: 'Order',
            action: 'show',
            schemaName: 'orderShowSchema',
            zodSchema: 'z.object({ id: z.number() })'
          }
        ]
      )

      expect(built.code).toContain('* Runtime contract validation schemas for Order')
      expect(built.code).toContain('* @provenance ContractSchema: Order')
      expect(built.code).toContain('* @provenance JsonResponse: Order')
      expect(built.code).toContain('export const OrderContractSchema = {')
      expect(built.code).toContain('export const orderShowSchema = z.object({ id: z.number() });')
    })
  })
})
