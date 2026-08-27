import { describe, test, expect } from 'vitest'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RequestTypesArtifact } from '../../core/src/compiler/artifacts/RequestTypesArtifact'
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    ReferenceType,
    CollectionKind
} from '../../core/src/compiler/types/SemanticType'
import { ImmutableSet, ImmutableMap } from '../../core/src/compiler/utils/ImmutableCollections'

describe('Resource Field Structure Resolution (items, promotion, gateway)', () => {
    test('should resolve and preserve field structures for items, promotion, and gateway', () => {
        // 1. OrderDetailResource
        const orderDetailResource = new ObjectType(
            new ImmutableMap(
                new Map([
                    ['id', new PrimitiveType('number')],
                    ['produkItemId', new PrimitiveType('string')],
                    ['qty', new PrimitiveType('number')],
                    ['harga', new PrimitiveType('number')],
                    ['subtotal', new PrimitiveType('number')]
                ])
            ),
            new ImmutableSet(new Set(['id', 'produkItemId', 'qty', 'harga', 'subtotal'])),
            undefined,
            [],
            new ImmutableMap(new Map([['name', 'OrderDetailResource'], ['kind', 'resource']]))
        )

        // 2. promotion: { code: string, discountMinor: number }
        const promotionObjectType = new ObjectType(
            new ImmutableMap(
                new Map([
                    ['code', new PrimitiveType('string')],
                    ['discountMinor', new PrimitiveType('number')]
                ])
            ),
            new ImmutableSet(new Set(['code', 'discountMinor']))
        )

        // 3. gateway: { name: string, orderId: string, token: string, redirectUrl: string }
        const gatewayObjectType = new ObjectType(
            new ImmutableMap(
                new Map([
                    ['name', new PrimitiveType('string')],
                    ['orderId', new PrimitiveType('string')],
                    ['token', new PrimitiveType('string')],
                    ['redirectUrl', new PrimitiveType('string')]
                ])
            ),
            new ImmutableSet(new Set(['name', 'orderId', 'token', 'redirectUrl']))
        )

        // 4. PaymentResource with items[], promotion, and gateway
        const orderDetailRef = new ReferenceType('App\\Http\\Resources', 'OrderDetailResource')
        const itemsCollection = new ReadonlyCollectionType(CollectionKind.ARRAY, orderDetailRef)

        const paymentResourceType = new ObjectType(
            new ImmutableMap(
                new Map([
                    ['id', new PrimitiveType('number')],
                    ['status', new PrimitiveType('string')],
                    ['items', itemsCollection],
                    ['promotion', promotionObjectType],
                    ['gateway', gatewayObjectType]
                ])
            ),
            new ImmutableSet(new Set(['id', 'status', 'items', 'promotion', 'gateway'])),
            undefined,
            [],
            new ImmutableMap(new Map([['name', 'PaymentResource'], ['kind', 'resource']]))
        )

        // Run TypeScriptGeneratorPass for api-read.ts
        const tsPass = new TypeScriptGeneratorPass()
        const [tsArtifact] = tsPass.run([
            {
                typeId: 'SemanticTypes',
                types: [paymentResourceType],
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                }
            }
        ])

        // Verify api-read.ts interface shapes
        expect(tsArtifact.code).toContain('export interface PaymentResourceTransformed {')
        expect(tsArtifact.code).toContain('id: number;')
        expect(tsArtifact.code).toContain('status: string;')
        expect(tsArtifact.code).toContain('promotion: {')
        expect(tsArtifact.code).toContain('gateway: {')

        // Run MapperGeneratorPass for api-mapper.ts
        const mapperInput: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requestTypes: [
                {
                    resourceName: 'payment',
                    formTypeName: 'PaymentForm',
                    actions: [],
                    responseData: {
                        resourceName: 'PaymentResource',
                        fields: {
                            id: new PrimitiveType('number'),
                            status: new PrimitiveType('string'),
                            items: itemsCollection,
                            promotion: promotionObjectType,
                            gateway: gatewayObjectType
                        }
                    }
                }
            ],
            metadata: {
                hash: 'test-hash',
                producer: 'test',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        }

        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([mapperInput])

        // Verify api-mapper.ts output mapping for flattened camelCase fields
        expect(mapperArtifact.code).toContain('export const toPaymentResourceRead = (api: PaymentResourceApiResponse): PaymentResourceTransformed => ({')
        expect(mapperArtifact.code).toContain('items: api.items?.map(toOrderDetailResourceRead),')
        expect(mapperArtifact.code).toContain('promotionCode: api.promotion.code,')
        expect(mapperArtifact.code).toContain('promotionDiscountMinor: api.promotion.discountMinor,')
        expect(mapperArtifact.code).toContain('gatewayName: api.gateway.name,')
        expect(mapperArtifact.code).toContain('gatewayOrderId: api.gateway.orderId,')
        expect(mapperArtifact.code).toContain('gatewayToken: api.gateway.token,')
        expect(mapperArtifact.code).toContain('gatewayRedirectUrl: api.gateway.redirectUrl,')
    })
})
