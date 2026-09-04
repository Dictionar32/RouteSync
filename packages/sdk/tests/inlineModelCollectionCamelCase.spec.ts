import { describe, test, expect } from 'vitest'
import { manifestToSemanticTypes, manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'
import { ScannedRouteManifestDescriptor } from '../../core/src/compiler/scanner/StaticLaravelScanner'

describe('Regression Test: Structure Preserved snake_case -> camelCase Transformation (inlineModelCollectionCamelCase)', () => {
    test('should preserve object nesting & array topology while converting snake_case fields to camelCase', () => {
        const manifest: RouteManifest = ScannedRouteManifestDescriptor.create({
            routes: [
                {
                    domain: 'ProdukReviews',
                    path: '/produk/{id}/reviews',
                    method: 'GET',
                    action: 'ProductReviewController@index',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            summary: {
                                kind: 'object',
                                fields: {
                                    avg_rating: { kind: 'primitive', type: 'float' },
                                    total_review: { kind: 'primitive', type: 'int' }
                                }
                            },
                            reviews: {
                                kind: 'object',
                                paginated: true,
                                fields: {
                                    data: {
                                        kind: 'array',
                                        element: {
                                            kind: 'model',
                                            model: 'ProductReview'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ],
            resources: [],
            models: [
                {
                    name: 'ProductReview',
                    table: 'product_reviews',
                    columns: [
                        { name: 'id', type: 'int', nullable: false },
                        { name: 'produk_item_id', type: 'int', nullable: false },
                        { name: 'user_id', type: 'int', nullable: false },
                        { name: 'rating', type: 'int', nullable: false },
                        { name: 'title', type: 'string', nullable: true },
                        { name: 'comment', type: 'string', nullable: true },
                        { name: 'created_at', type: 'string', nullable: false }
                    ]
                }
            ]
        })

        // 1. Run TypeScriptGeneratorPass for api-read.ts
        const semanticTypes = manifestToSemanticTypes(manifest)
        const [tsArtifact] = TypeScriptGeneratorPass.run(semanticTypes)

        // Verify Object Flattening & Array Preservation in api-read.ts
        expect(tsArtifact.code).toContain('export interface ProdukReviewsTransformed {')
        expect(tsArtifact.code).toContain('summaryAvgRating: number;')
        expect(tsArtifact.code).toContain('summaryTotalReview: number;')
        expect(tsArtifact.code).toContain('reviewsData: {')
        expect(tsArtifact.code).toContain('id: number;')
        expect(tsArtifact.code).toContain('produkItemId: number;')
        expect(tsArtifact.code).toContain('userId: number;')
        expect(tsArtifact.code).toContain('rating: number;')
        expect(tsArtifact.code).toContain('title: string | null;')
        expect(tsArtifact.code).toContain('comment: string | null;')
        expect(tsArtifact.code).toContain('createdAt: string;')
        expect(tsArtifact.code).toContain('}[];')

        // 2. Run MapperGeneratorPass for api-mapper.ts
        const contractInput = manifestToContractInput(manifest)
        const [mapperArtifact] = MapperGeneratorPass.run(contractInput)

        // Verify Mapper transformation in api-mapper.ts
        expect(mapperArtifact.code).toContain('export const toProdukReviewsRead = (api: ProdukReviewsApiResponse): ProdukReviewsTransformed => ({')
        expect(mapperArtifact.code).toContain('summaryAvgRating: api.summary.avg_rating,')
        expect(mapperArtifact.code).toContain('summaryTotalReview: api.summary.total_review,')
        expect(mapperArtifact.code).toContain('reviewsData: api.reviews.data?.map(item => ({')
        expect(mapperArtifact.code).toContain('id: item.id,')
        expect(mapperArtifact.code).toContain('produkItemId: item.produk_item_id,')
        expect(mapperArtifact.code).toContain('userId: item.user_id,')
        expect(mapperArtifact.code).toContain('rating: item.rating,')
        expect(mapperArtifact.code).toContain('title: item.title,')
        expect(mapperArtifact.code).toContain('comment: item.comment,')
        expect(mapperArtifact.code).toContain('createdAt: item.created_at,')
    })
})
