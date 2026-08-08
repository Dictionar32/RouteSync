/**
 * Tests for ResponseStructureBuilder
 * 
 * Tests structure building and analysis capabilities
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ResponseStructureBuilder } from '../ResponseStructureBuilder'
import { ResponseFieldParser } from '../ResponseFieldParser'
import type { ResponseFieldData } from '../../../../../types/route'

describe('ResponseStructureBuilder', () => {
    let builder: ResponseStructureBuilder
    let parser: ResponseFieldParser

    beforeEach(() => {
        parser = new ResponseFieldParser()
        builder = new ResponseStructureBuilder(parser)
    })

    // ===== FLAT STRUCTURES =====

    test('should build flat primitive structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            id: {
                kind: 'primitive',
                type: 'number'
            },
            name: {
                kind: 'primitive',
                type: 'string'
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(2)
        expect(structure.hasNested).toBe(false)
        expect(structure.hasArrays).toBe(false)
        expect(structure.maxDepth).toBe(1)
    })

    test('should handle nullable fields in flat structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            name: {
                kind: 'primitive',
                type: 'string',
                nullable: true
            },
            email: {
                kind: 'primitive',
                type: 'string',
                nullable: false
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(2)
        expect(structure.fields[0].nullable).toBe(true)
        expect(structure.fields[1].nullable).toBe(false)
        expect(structure.maxDepth).toBe(1)
    })

    test('should handle optional fields in flat structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            age: {
                kind: 'primitive',
                type: 'number',
                optional: true
            },
            id: {
                kind: 'primitive',
                type: 'number'
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(2)
        expect(structure.fields[0].optional).toBe(true)
        expect(structure.fields[1].optional).toBe(false)
    })

    // ===== NESTED OBJECT STRUCTURES =====

    test('should detect nested object structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            user: {
                kind: 'object',
                fields: {
                    name: {
                        kind: 'primitive',
                        type: 'string'
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.hasNested).toBe(true)
        expect(structure.hasArrays).toBe(false)
        expect(structure.maxDepth).toBe(2)
    })

    test('should build simple nested structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            shipping: {
                kind: 'object',
                fields: {
                    nama: {
                        kind: 'primitive',
                        type: 'string'
                    },
                    telepon: {
                        kind: 'primitive',
                        type: 'string'
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(1)
        expect(structure.fields[0].name).toBe('shipping')
        expect(structure.fields[0].kind).toBe('object')
        expect(structure.fields[0].fields).toHaveLength(2)
        expect(structure.maxDepth).toBe(2)
    })

    test('should build deeply nested structure (3 levels)', () => {
        const fields: Record<string, ResponseFieldData> = {
            order: {
                kind: 'object',
                fields: {
                    shipping: {
                        kind: 'object',
                        fields: {
                            address: {
                                kind: 'object',
                                fields: {
                                    street: {
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

        const structure = builder.buildStructure(fields)

        expect(structure.hasNested).toBe(true)
        expect(structure.maxDepth).toBe(4) // order > shipping > address > street
    })

    test('should handle multiple nested objects at same level', () => {
        const fields: Record<string, ResponseFieldData> = {
            shipping: {
                kind: 'object',
                fields: {
                    nama: { kind: 'primitive', type: 'string' }
                }
            },
            payment: {
                kind: 'object',
                fields: {
                    metode: { kind: 'primitive', type: 'string' }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(2)
        expect(structure.hasNested).toBe(true)
        expect(structure.maxDepth).toBe(2)
    })

    // ===== ARRAY STRUCTURES =====

    test('should detect array in structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            items: {
                kind: 'array',
                itemType: {
                    kind: 'primitive',
                    type: 'string'
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.hasArrays).toBe(true)
        expect(structure.hasNested).toBe(false)
        expect(structure.maxDepth).toBe(1)
    })

    test('should build array of primitives structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            tags: {
                kind: 'array',
                itemType: {
                    kind: 'primitive',
                    type: 'string'
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(1)
        expect(structure.fields[0].kind).toBe('array')
        expect(structure.fields[0].itemType?.kind).toBe('primitive')
    })

    test('should detect nested objects in array', () => {
        const fields: Record<string, ResponseFieldData> = {
            items: {
                kind: 'array',
                itemType: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' }
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.hasArrays).toBe(true)
        expect(structure.hasNested).toBe(true)
        expect(structure.maxDepth).toBe(2) // items[] > object
    })

    test('should build array of objects structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            produk_items: {
                kind: 'array',
                itemType: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        nama: { kind: 'primitive', type: 'string' }
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(1)
        expect(structure.fields[0].itemType?.fields).toHaveLength(2)
        expect(structure.maxDepth).toBe(2)
    })

    // ===== MIXED STRUCTURES =====

    test('should handle mixed flat and nested', () => {
        const fields: Record<string, ResponseFieldData> = {
            id: {
                kind: 'primitive',
                type: 'number'
            },
            user: {
                kind: 'object',
                fields: {
                    name: { kind: 'primitive', type: 'string' }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(2)
        expect(structure.hasNested).toBe(true)
        expect(structure.maxDepth).toBe(2)
    })

    test('should handle mixed nested and arrays', () => {
        const fields: Record<string, ResponseFieldData> = {
            shipping: {
                kind: 'object',
                fields: {
                    nama: { kind: 'primitive', type: 'string' }
                }
            },
            items: {
                kind: 'array',
                itemType: {
                    kind: 'primitive',
                    type: 'string'
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.hasNested).toBe(true)
        expect(structure.hasArrays).toBe(true)
        expect(structure.maxDepth).toBe(2)
    })

    // ===== COMPLEX REAL-WORLD STRUCTURES =====

    test('should build complex e-commerce order structure', () => {
        const fields: Record<string, ResponseFieldData> = {
            id: {
                kind: 'primitive',
                type: 'number'
            },
            shipping: {
                kind: 'object',
                fields: {
                    nama: { kind: 'primitive', type: 'string' },
                    telepon: { kind: 'primitive', type: 'string' }
                }
            },
            produk_items: {
                kind: 'array',
                itemType: {
                    kind: 'object',
                    fields: {
                        produk_id: { kind: 'primitive', type: 'number' },
                        qty: { kind: 'primitive', type: 'number' }
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(3)
        expect(structure.hasNested).toBe(true)
        expect(structure.hasArrays).toBe(true)
        expect(structure.maxDepth).toBe(2)
    })

    // ===== EDGE CASES =====

    test('should handle empty fields object', () => {
        const fields: Record<string, ResponseFieldData> = {}

        const structure = builder.buildStructure(fields)

        expect(structure.fields).toHaveLength(0)
        expect(structure.hasNested).toBe(false)
        expect(structure.hasArrays).toBe(false)
        expect(structure.maxDepth).toBe(1)
    })

    test('should handle nested array in nested object', () => {
        const fields: Record<string, ResponseFieldData> = {
            order: {
                kind: 'object',
                fields: {
                    items: {
                        kind: 'array',
                        itemType: {
                            kind: 'primitive',
                            type: 'string'
                        }
                    }
                }
            }
        }

        const structure = builder.buildStructure(fields)

        expect(structure.hasNested).toBe(true)
        expect(structure.hasArrays).toBe(true)
        expect(structure.maxDepth).toBe(2)
    })
})
