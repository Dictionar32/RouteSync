/**
 * TypeScriptGeneratorPass - Naming & Alias Tests (Phase 1 - Day 8)
 * 
 * Tests for Phase 1 improvements:
 * - Semantic interface names (not Type123...)
 * - camelCase property conversion
 * - Conditional Show/Index alias generation
 */

import { describe, it, expect } from 'vitest'
import { TypeScriptGeneratorPass } from '../TypeScriptGeneratorPass'
import { CompilationContext } from '../CompilationContext'
import type { SemanticTypesArtifact } from '../TypeScriptGeneratorPass'
import { PrimitiveType, PrimitiveKind, ObjectType } from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create mock ObjectType dengan annotations
 */
function createMockObjectType(
    properties: Map<string, PrimitiveType>,
    annotations?: Map<string, string>
): ObjectType {
    return new ObjectType(
        new ImmutableMap(properties),
        new ImmutableSet(new Set(Array.from(properties.keys()))),
        undefined, // no base object
        [], // no interfaces
        annotations ? new ImmutableMap(annotations) : new ImmutableMap(new Map())
    )
}

/**
 * Create mock SemanticTypesArtifact
 */
function createMockSemanticTypesArtifact(
    types: readonly ObjectType[]
): SemanticTypesArtifact {
    return {
        typeId: 'SemanticTypes',
        types,
        metadata: {
            hash: 'mock-hash-naming-test',
            producer: 'NamingTestProducer',
            dependencies: [],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    }
}

// ============================================================================
// Phase 1 Tests: Semantic Naming
// ============================================================================

describe('TypeScriptGeneratorPass - Semantic Naming (Phase 1)', () => {
    describe('Interface Naming', () => {
        it('should generate semantic names from annotations', async () => {
            // Arrange: Create ObjectType dengan name annotation
            const properties = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType( PrimitiveKind.NUMBER)],
                ['name', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'User'],
                ['kind', 'model']
            ])

            const userType = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([userType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result).toBeDefined()
            expect(result.code).toContain('export interface UserTransformed')
            expect(result.code).not.toContain('Type123') // No synthetic names
            expect(result.code).not.toContain('Date.now()') // No timestamp-based names
        })

        it('should handle resource types with semantic names', async () => {
            // Arrange: Create resource type
            const properties = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['totalHarga', new PrimitiveType(PrimitiveKind.NUMBER)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'OrderResource'],
                ['kind', 'resource']
            ])

            const orderResource = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([orderResource])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('export interface OrderResourceTransformed')
        })

        it('should fallback to synthetic names if no annotation', async () => {
            // Arrange: Create type WITHOUT name annotation
            const properties = new Map<string, PrimitiveType>([
                ['value', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const anonymousType = createMockObjectType(properties) // No annotations!
            const artifact = createMockSemanticTypesArtifact([anonymousType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            // Should generate SOME name (not crash)
            expect(result.code).toContain('export interface')
            expect(result.code).toContain('Transformed')
        })
    })

    describe('Property Naming - camelCase', () => {
        it('should preserve camelCase properties from CompilerBridge', async () => {
            // Arrange: Properties already in camelCase (dari CompilerBridge)
            const properties = new Map<string, PrimitiveType>([
                ['totalHarga', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['invoiceNumber', new PrimitiveType(PrimitiveKind.STRING)],
                ['paymentStatus', new PrimitiveType(PrimitiveKind.STRING)],
                ['createdAt', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'Order'],
                ['kind', 'model']
            ])

            const orderType = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([orderType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('totalHarga')
            expect(result.code).toContain('invoiceNumber')
            expect(result.code).toContain('paymentStatus')
            expect(result.code).toContain('createdAt')

            // Should NOT contain snake_case (already converted by CompilerBridge)
            expect(result.code).not.toContain('total_harga')
            expect(result.code).not.toContain('invoice_number')
            expect(result.code).not.toContain('payment_status')
            expect(result.code).not.toContain('created_at')
        })

        it('should handle mixed camelCase properties', async () => {
            // Arrange: Mix of simple and compound names
            const properties = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['firstName', new PrimitiveType(PrimitiveKind.STRING)],
                ['lastName', new PrimitiveType(PrimitiveKind.STRING)],
                ['emailAddress', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'User'],
                ['kind', 'model']
            ])

            const userType = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([userType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('id')
            expect(result.code).toContain('firstName')
            expect(result.code).toContain('lastName')
            expect(result.code).toContain('emailAddress')
        })
    })

    describe('Conditional Show/Index Alias Generation', () => {
        it('should generate Show/Index aliases for resources (kind=resource)', async () => {
            // Arrange: Resource type (kind: 'resource')
            const properties = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['nama', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'ProductResource'],
                ['kind', 'resource'] // ← Resource!
            ])

            const productResource = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([productResource])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('export interface ProductResourceTransformed')
            expect(result.code).toContain('export type ProductResourceShow = ProductResourceTransformed')
            expect(result.code).toContain('export type ProductResourceIndex = ProductResourceTransformed[]')
        })

        it('should NOT generate Show/Index aliases for models (kind=model)', async () => {
            // Arrange: Model type (kind: 'model')
            const properties = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['name', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'User'],
                ['kind', 'model'] // ← Model, NOT resource!
            ])

            const userModel = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([userModel])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('export interface UserTransformed')
            expect(result.code).not.toContain('UserShow')
            expect(result.code).not.toContain('UserIndex')
        })

        it('should NOT generate Show/Index aliases for non-annotated types', async () => {
            // Arrange: Type without kind annotation AND without Resource/Response
            // suffix (RegisterFields bukan resource-by-naming-convention)
            const properties = new Map<string, PrimitiveType>([
                ['success', new PrimitiveType(PrimitiveKind.BOOLEAN)],
                ['message', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'RegisterFields']
                // No 'kind' annotation!
            ])

            const responseType = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([responseType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('export interface RegisterFieldsTransformed')
            expect(result.code).not.toContain('RegisterFieldsShow')
            expect(result.code).not.toContain('RegisterFieldsIndex')
        })

        it('should generate Show/Index aliases for types ending in Response (naming convention)', async () => {
            // Arrange: tanpa kind annotation, tapi nama berakhiran "Response" —
            // sejak refactor, resource dideteksi via naming convention
            // (endsWith Resource OR Response), bukan hanya kind annotation.
            const properties = new Map<string, PrimitiveType>([
                ['success', new PrimitiveType(PrimitiveKind.BOOLEAN)],
                ['message', new PrimitiveType(PrimitiveKind.STRING)],
            ])

            const annotations = new Map<string, string>([
                ['name', 'RegisterResponse']
                // No 'kind' annotation!
            ])

            const responseType = createMockObjectType(properties, annotations)
            const artifact = createMockSemanticTypesArtifact([responseType])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            expect(result.code).toContain('export interface RegisterResponseTransformed')
            expect(result.code).toContain('export type RegisterResponseShow = RegisterResponseTransformed')
            expect(result.code).toContain('export type RegisterResponseIndex = RegisterResponseTransformed[]')
        })

        it('should handle multiple resources with correct aliases', async () => {
            // Arrange: Multiple resource types dan 1 model
            const orderProps = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ])
            const orderAnnotations = new Map<string, string>([
                ['name', 'OrderResource'],
                ['kind', 'resource']
            ])

            const paymentProps = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ])
            const paymentAnnotations = new Map<string, string>([
                ['name', 'PaymentResource'],
                ['kind', 'resource']
            ])

            const userProps = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ])
            const userAnnotations = new Map<string, string>([
                ['name', 'User'],
                ['kind', 'model']
            ])

            const orderResource = createMockObjectType(orderProps, orderAnnotations)
            const paymentResource = createMockObjectType(paymentProps, paymentAnnotations)
            const userModel = createMockObjectType(userProps, userAnnotations)

            const artifact = createMockSemanticTypesArtifact([
                orderResource,
                paymentResource,
                userModel
            ])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert
            // Resources should have aliases
            expect(result.code).toContain('OrderResourceShow')
            expect(result.code).toContain('OrderResourceIndex')
            expect(result.code).toContain('PaymentResourceShow')
            expect(result.code).toContain('PaymentResourceIndex')

            // Model should NOT have aliases
            expect(result.code).not.toContain('UserShow')
            expect(result.code).not.toContain('UserIndex')
        })
    })

    describe('Integration: Complete Flow (Toko-Online Scenario)', () => {
        it('should handle real-world toko-online scenario', async () => {
            // Arrange: Types similar to toko-online
            const orderProps = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['totalHarga', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['invoiceNumber', new PrimitiveType(PrimitiveKind.STRING)],
                ['paymentStatus', new PrimitiveType(PrimitiveKind.STRING)],
                ['createdAt', new PrimitiveType(PrimitiveKind.STRING)],
            ])
            const orderAnnotations = new Map<string, string>([
                ['name', 'OrderResource'],
                ['kind', 'resource']
            ])

            const userProps = new Map<string, PrimitiveType>([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                ['createdAt', new PrimitiveType(PrimitiveKind.STRING)],
            ])
            const userAnnotations = new Map<string, string>([
                ['name', 'User'],
                ['kind', 'model']
            ])

            const orderResource = createMockObjectType(orderProps, orderAnnotations)
            const userModel = createMockObjectType(userProps, userAnnotations)

            const artifact = createMockSemanticTypesArtifact([orderResource, userModel])

            // Act
            const pass = new TypeScriptGeneratorPass()
            const [result] = pass.run([artifact], CompilationContext.default())

            // Assert: Resource
            expect(result.code).toContain('export interface OrderResourceTransformed')
            expect(result.code).toContain('totalHarga')
            expect(result.code).toContain('invoiceNumber')
            expect(result.code).toContain('paymentStatus')
            expect(result.code).toContain('createdAt')
            expect(result.code).toContain('export type OrderResourceShow')
            expect(result.code).toContain('export type OrderResourceIndex')

            // Assert: Model
            expect(result.code).toContain('export interface UserTransformed')
            expect(result.code).toContain('createdAt')
            expect(result.code).not.toContain('UserShow')
            expect(result.code).not.toContain('UserIndex')

            // Assert: No snake_case (already converted by CompilerBridge)
            expect(result.code).not.toContain('total_harga')
            expect(result.code).not.toContain('invoice_number')
            expect(result.code).not.toContain('payment_status')
            expect(result.code).not.toContain('created_at')
        })
    })
})