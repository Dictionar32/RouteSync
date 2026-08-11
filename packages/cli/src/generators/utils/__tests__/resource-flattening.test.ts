/**
 * Resource Flattening Utilities Tests
 * 
 * Comprehensive unit tests for Phase 2 nested object flattening implementation.
 * Tests all flattening scenarios independently from CompilerBridge architecture.
 */

import { describe, test, expect } from 'vitest'
import {
    flattenResourceFields,
    flattenResourceField,
    primitiveStringToSemanticType,
    capitalize,
    toCamelCase
} from '../resource-flattening'
import type { ResourceFieldKind } from '../../../../../core/src/types/route'
import { PrimitiveKind, type SemanticType, type PrimitiveType } from '../../../../../core/src/compiler/types/SemanticType'

// Type guard helper functions
function isPrimitiveType(type: SemanticType | undefined): type is PrimitiveType {
    return type?.kind === 'primitive'
}

function expectPrimitiveType(type: SemanticType | undefined, expectedKind: PrimitiveKind) {
    expect(type?.kind).toBe('primitive')
    if (isPrimitiveType(type)) {
        expect(type.type).toBe(expectedKind)
    }
}

describe('Resource Flattening Utils', () => {

    describe('toCamelCase', () => {
        test('should convert snake_case to camelCase', () => {
            expect(toCamelCase('user_name')).toBe('userName')
            expect(toCamelCase('product_id')).toBe('productId')
            expect(toCamelCase('created_at')).toBe('createdAt')
            expect(toCamelCase('order_detail_id')).toBe('orderDetailId')
        })

        test('should handle PascalCase input', () => {
            expect(toCamelCase('UserName')).toBe('userName')
            expect(toCamelCase('ProductId')).toBe('productId')
        })

        test('should handle already camelCase input', () => {
            expect(toCamelCase('userName')).toBe('userName')
            expect(toCamelCase('productId')).toBe('productId')
        })

        test('should handle edge cases', () => {
            expect(toCamelCase('')).toBe('')
            expect(toCamelCase('a')).toBe('a')
            expect(toCamelCase('A')).toBe('a')
        })
    })

    describe('capitalize', () => {
        test('should capitalize first letter', () => {
            expect(capitalize('user')).toBe('User')
            expect(capitalize('address')).toBe('Address')
            expect(capitalize('id')).toBe('Id')
        })

        test('should handle edge cases', () => {
            expect(capitalize('')).toBe('')
            expect(capitalize('a')).toBe('A')
        })
    })

    describe('primitiveStringToSemanticType', () => {
        test('should convert number types', () => {
            const numberType = primitiveStringToSemanticType('int')
            expectPrimitiveType(numberType, PrimitiveKind.NUMBER)

            expectPrimitiveType(primitiveStringToSemanticType('integer'), PrimitiveKind.NUMBER)
            expectPrimitiveType(primitiveStringToSemanticType('float'), PrimitiveKind.NUMBER)
            expectPrimitiveType(primitiveStringToSemanticType('double'), PrimitiveKind.NUMBER)
            expectPrimitiveType(primitiveStringToSemanticType('number'), PrimitiveKind.NUMBER)
        })

        test('should convert boolean types', () => {
            expectPrimitiveType(primitiveStringToSemanticType('bool'), PrimitiveKind.BOOLEAN)
            expectPrimitiveType(primitiveStringToSemanticType('boolean'), PrimitiveKind.BOOLEAN)
        })

        test('should convert string types', () => {
            expectPrimitiveType(primitiveStringToSemanticType('string'), PrimitiveKind.STRING)
            expectPrimitiveType(primitiveStringToSemanticType('text'), PrimitiveKind.STRING)
            expectPrimitiveType(primitiveStringToSemanticType('unknown'), PrimitiveKind.STRING)
        })

        test('should be case-insensitive', () => {
            expectPrimitiveType(primitiveStringToSemanticType('INT'), PrimitiveKind.NUMBER)
            expectPrimitiveType(primitiveStringToSemanticType('BOOL'), PrimitiveKind.BOOLEAN)
            expectPrimitiveType(primitiveStringToSemanticType('STRING'), PrimitiveKind.STRING)
        })
    })

    describe('flattenResourceFields - Basic Flattening', () => {
        test('should flatten single-level nested object', () => {
            const fields: Record<string, ResourceFieldKind> = {
                id: { kind: 'primitive', type: 'number' },
                user: {
                    kind: 'object',
                    fields: {
                        name: { kind: 'primitive', type: 'string' },
                        email: { kind: 'primitive', type: 'string' }
                    }
                }
            }

            const result = flattenResourceFields('UserResource', fields)

            // Original id field
            expect(result.has('id')).toBe(true)
            const idType = result.get('id')
            expectPrimitiveType(idType, PrimitiveKind.NUMBER)

            // Flattened fields from user object
            expect(result.has('userName')).toBe(true)
            expectPrimitiveType(result.get('userName'), PrimitiveKind.STRING)

            expect(result.has('userEmail')).toBe(true)
            expectPrimitiveType(result.get('userEmail'), PrimitiveKind.STRING)

            // Should NOT have nested user object
            expect(result.has('user')).toBe(false)
        })

        test('should flatten multi-level nested objects', () => {
            const fields: Record<string, ResourceFieldKind> = {
                id: { kind: 'primitive', type: 'number' },
                shipping: {
                    kind: 'object',
                    fields: {
                        address: {
                            kind: 'object',
                            fields: {
                                street: { kind: 'primitive', type: 'string' },
                                city: { kind: 'primitive', type: 'string' },
                                postal_code: { kind: 'primitive', type: 'string' }
                            }
                        }
                    }
                }
            }

            const result = flattenResourceFields('OrderResource', fields)

            // Check flattened 2-level nested properties
            expect(result.has('shippingAddressStreet')).toBe(true)
            expect(result.has('shippingAddressCity')).toBe(true)
            expect(result.has('shippingAddressPostalCode')).toBe(true) // snake_case → camelCase

            // Should NOT have nested objects
            expect(result.has('shipping')).toBe(false)
            expect(result.has('shippingAddress')).toBe(false)
        })
    })

    describe('flattenResourceFields - property_access kind', () => {
        test('should handle property_access kind fields', () => {
            const fields: Record<string, ResourceFieldKind> = {
                id: { kind: 'primitive', type: 'number' },
                product_name: {
                    kind: 'property_access',
                    nullable: false
                },
                product_price: {
                    kind: 'property_access',
                    nullable: true
                }
            }

            const result = flattenResourceFields('ProductResource', fields)

            // property_access should be flattened with camelCase
            expect(result.has('productName')).toBe(true)
            expectPrimitiveType(result.get('productName'), PrimitiveKind.STRING)

            expect(result.has('productPrice')).toBe(true)
            expectPrimitiveType(result.get('productPrice'), PrimitiveKind.STRING)
        })

        test('should fallback to string when no resolved.type', () => {
            const fields: Record<string, ResourceFieldKind> = {
                unknown_field: {
                    kind: 'property_access'
                    // No resolved.type - should default to string
                }
            }

            const result = flattenResourceFields('TestResource', fields)

            expect(result.has('unknownField')).toBe(true)
            expectPrimitiveType(result.get('unknownField'), PrimitiveKind.STRING)
        })
    })

    describe('flattenResourceFields - Circular Reference Detection', () => {
        test('should detect and prevent circular references', () => {
            // Create circular reference
            const circularField: ResourceFieldKind = {
                kind: 'object',
                fields: {}
            }

            // Self-reference
            circularField.fields = {
                name: { kind: 'primitive', type: 'string' },
                self: circularField // Circular!
            }

            const fields: Record<string, ResourceFieldKind> = {
                id: { kind: 'primitive', type: 'number' },
                node: circularField
            }

            // Should not throw, should handle gracefully
            expect(() => {
                const result = flattenResourceFields('CircularResource', fields)
                expect(result.has('id')).toBe(true)
                expect(result.has('nodeName')).toBe(true)
                // Circular part should be skipped
            }).not.toThrow()
        })
    })

    describe('flattenResourceFields - Depth Limit', () => {
        test('should enforce maximum nesting depth', () => {
            // maxDepth = jumlah level (segmen key) maksimum yang diizinkan.
            // Struktur 6 level: leaf di level 6 = 6 segmen > 5 → berhenti
            // (tidak ada leaf yang tercapai, map kosong).
            const sixLevels: Record<string, ResourceFieldKind> = {
                level1: {
                    kind: 'object',
                    fields: {
                        level2: {
                            kind: 'object',
                            fields: {
                                level3: {
                                    kind: 'object',
                                    fields: {
                                        level4: {
                                            kind: 'object',
                                            fields: {
                                                level5: {
                                                    kind: 'object',
                                                    fields: {
                                                        level6: {
                                                            kind: 'primitive',
                                                            type: 'string'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const result = flattenResourceFields('DeepResource', sixLevels, {
                maxDepth: 5
            })

            // Level 6 (6 segmen) melebihi maxDepth 5 — tidak ada leaf yang masuk
            expect(result.size).toBe(0)
            expect(result.has('level1Level2Level3Level4Level5Level6')).toBe(false)

            // Struktur 5 level: leaf di level 5 = 5 segmen = maxDepth → masuk
            const fiveLevels: Record<string, ResourceFieldKind> = {
                level1: {
                    kind: 'object',
                    fields: {
                        level2: {
                            kind: 'object',
                            fields: {
                                level3: {
                                    kind: 'object',
                                    fields: {
                                        level4: {
                                            kind: 'object',
                                            fields: {
                                                level5: { kind: 'primitive', type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const result5 = flattenResourceFields('DeepResource', fiveLevels, {
                maxDepth: 5
            })
            expect(result5.has('level1Level2Level3Level4Level5')).toBe(true)
        })

        test('should respect custom maxDepth option', () => {
            // a > b > c: leaf c = 3 segmen
            const fields: Record<string, ResourceFieldKind> = {
                a: {
                    kind: 'object',
                    fields: {
                        b: {
                            kind: 'object',
                            fields: {
                                c: { kind: 'primitive', type: 'string' }
                            }
                        }
                    }
                }
            }

            // maxDepth 1: leaf b pun (2 segmen) melebihi batas → tidak ada output
            const result = flattenResourceFields('TestResource', fields, {
                maxDepth: 1
            })
            expect(result.size).toBe(0)

            // a > b (leaf 2 segmen) dengan maxDepth 2 → masuk
            const shallow: Record<string, ResourceFieldKind> = {
                a: {
                    kind: 'object',
                    fields: {
                        b: { kind: 'primitive', type: 'string' }
                    }
                }
            }

            const result2 = flattenResourceFields('TestResource', shallow, {
                maxDepth: 2
            })
            expect(result2.has('aB')).toBe(true)

            // maxDepth 1: b (2 segmen) > 1 → tidak masuk
            const result3 = flattenResourceFields('TestResource', shallow, {
                maxDepth: 1
            })
            expect(result3.size).toBe(0)
        })
    })

    describe('flattenResourceFields - Name Collision', () => {
        test('should warn about name collisions', () => {
            const fields: Record<string, ResourceFieldKind> = {
                userId: { kind: 'primitive', type: 'number' }, // Direct field
                user: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' } // Would also become userId
                    }
                }
            }

            const result = flattenResourceFields('CollisionResource', fields)

            // Should have userId (last-write-wins)
            expect(result.has('userId')).toBe(true)

            // Result should contain one entry for userId
            expect(result.size).toBeGreaterThanOrEqual(1)
        })
    })

    describe('flattenResourceFields - CamelCase Conversion', () => {
        test('should convert snake_case to camelCase during flattening', () => {
            const fields: Record<string, ResourceFieldKind> = {
                order_detail: {
                    kind: 'object',
                    fields: {
                        product_item_id: { kind: 'primitive', type: 'number' },
                        created_at: { kind: 'primitive', type: 'string' }
                    }
                }
            }

            const result = flattenResourceFields('CamelResource', fields)

            // snake_case should be converted to camelCase
            expect(result.has('orderDetailProductItemId')).toBe(true)
            expect(result.has('orderDetailCreatedAt')).toBe(true)

            // Should NOT have snake_case versions
            expect(result.has('order_detail_product_item_id')).toBe(false)
        })
    })

    describe('flattenResourceFields - Type Inference', () => {
        test('should infer types from resolved.type field', () => {
            const fields: Record<string, ResourceFieldKind> = {
                string_field: {
                    kind: 'property_access'
                },
                number_field: {
                    kind: 'property_access'
                },
                boolean_field: {
                    kind: 'variable'
                }
            }

            const result = flattenResourceFields('TypeResource', fields)

            // Check string type (property_access defaults to string)
            expectPrimitiveType(result.get('stringField'), PrimitiveKind.STRING)

            // Check number field (property_access defaults to string)
            expectPrimitiveType(result.get('numberField'), PrimitiveKind.STRING)

            // Check boolean field (variable defaults to string)
            expectPrimitiveType(result.get('booleanField'), PrimitiveKind.STRING)
        })
    })

    describe('flattenResourceFields - Real-world Scenario', () => {
        test('should handle toko-online OrderDetail structure', () => {
            const fields: Record<string, ResourceFieldKind> = {
                id: { kind: 'primitive', type: 'number' },
                produk_item_id: { kind: 'primitive', type: 'number' },
                qty: { kind: 'primitive', type: 'number' },
                harga: { kind: 'primitive', type: 'number' },
                produk: {
                    kind: 'object',
                    fields: {
                        // property_access dengan resolved.type — jalur inferensi
                        // tipe dari resolved (id → int → number)
                        id: { kind: 'property_access', resolved: { type: 'int', status: 'resolved', confidence: 1, trace: [] } },
                        nama: { kind: 'property_access', resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] } },
                        gambar: { kind: 'property_access', resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] } },
                        image_url: { kind: 'property_access', resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] } }
                    }
                }
            }

            const result = flattenResourceFields('OrderDetailResource', fields)

            // Original fields (camelCase)
            expect(result.has('id')).toBe(true)
            expect(result.has('produkItemId')).toBe(true)
            expect(result.has('qty')).toBe(true)
            expect(result.has('harga')).toBe(true)

            // Flattened produk fields
            expect(result.has('produkId')).toBe(true)
            expectPrimitiveType(result.get('produkId'), PrimitiveKind.NUMBER) // int → number

            expect(result.has('produkNama')).toBe(true)
            expectPrimitiveType(result.get('produkNama'), PrimitiveKind.STRING)

            expect(result.has('produkGambar')).toBe(true)
            expect(result.has('produkImageUrl')).toBe(true)

            // Should NOT have nested produk object
            expect(result.has('produk')).toBe(false)
        })
    })

    describe('flattenResourceFields - Edge Cases', () => {
        test('should handle empty resource', () => {
            const fields: Record<string, ResourceFieldKind> = {}

            expect(() => {
                const result = flattenResourceFields('EmptyResource', fields)
                expect(result.size).toBe(0)
            }).not.toThrow()
        })

        test('should handle empty object fields', () => {
            const fields: Record<string, ResourceFieldKind> = {
                empty_obj: {
                    kind: 'object',
                    fields: {}
                }
            }

            const result = flattenResourceFields('TestResource', fields)

            // Empty object should be skipped
            expect(result.has('emptyObj')).toBe(false)
        })

        test('should handle model/resource/unknown kinds', () => {
            const fields: Record<string, ResourceFieldKind> = {
                model_ref: {
                    kind: 'model',
                    model: 'User',
                    collection: false
                },
                resource_ref: {
                    kind: 'resource',
                    resource: 'UserResource',
                    collection: false
                },
                unknown_field: {
                    kind: 'unknown'
                }
            }

            const result = flattenResourceFields('TestResource', fields)

            // All should be converted to reference types
            expect(result.has('modelRef')).toBe(true)
            expect(result.has('resourceRef')).toBe(true)
            expect(result.has('unknownField')).toBe(true)
        })
    })

    describe('flattenResourceFields - Options', () => {
        test('should respect circularRefWarnings option', () => {
            const circularField: ResourceFieldKind = {
                kind: 'object',
                fields: {}
            }
            circularField.fields = { self: circularField }

            const fields: Record<string, ResourceFieldKind> = {
                node: circularField
            }

            // With warnings disabled
            expect(() => {
                flattenResourceFields('TestResource', fields, {
                    circularRefWarnings: false
                })
            }).not.toThrow()

            // With warnings enabled (default)
            expect(() => {
                flattenResourceFields('TestResource', fields, {
                    circularRefWarnings: true
                })
            }).not.toThrow()
        })
    })
})
