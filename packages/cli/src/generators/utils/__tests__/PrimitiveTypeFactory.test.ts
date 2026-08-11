/**
 * Tests for PrimitiveTypeFactory
 * Comprehensive coverage of type mapping logic
 */

import { describe, it, expect } from 'vitest'
import { PrimitiveTypeFactory } from '../PrimitiveTypeFactory'
import { PrimitiveKind } from '../../../../../core/src/compiler/types/SemanticType'

describe('PrimitiveTypeFactory', () => {
    describe('fromString()', () => {
        describe('Number types', () => {
            it('should map "number" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromString('number')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "int" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromString('int')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "float" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromString('float')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "double" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromString('double')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should be case-insensitive for number types', () => {
                expect(PrimitiveTypeFactory.fromString('NUMBER').type).toBe(PrimitiveKind.NUMBER)
                expect(PrimitiveTypeFactory.fromString('Int').type).toBe(PrimitiveKind.NUMBER)
                expect(PrimitiveTypeFactory.fromString('FLOAT').type).toBe(PrimitiveKind.NUMBER)
            })
        })

        describe('Boolean types', () => {
            it('should map "boolean" to BOOLEAN', () => {
                const result = PrimitiveTypeFactory.fromString('boolean')
                expect(result.type).toBe(PrimitiveKind.BOOLEAN)
            })

            it('should map "bool" to BOOLEAN', () => {
                const result = PrimitiveTypeFactory.fromString('bool')
                expect(result.type).toBe(PrimitiveKind.BOOLEAN)
            })

            it('should be case-insensitive for boolean types', () => {
                expect(PrimitiveTypeFactory.fromString('BOOLEAN').type).toBe(PrimitiveKind.BOOLEAN)
                expect(PrimitiveTypeFactory.fromString('Bool').type).toBe(PrimitiveKind.BOOLEAN)
            })
        })

        describe('DateTime types', () => {
            it('should map "datetime" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromString('datetime')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })

            it('should map "date" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromString('date')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })

            it('should map "timestamp" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromString('timestamp')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })

            it('should be case-insensitive for datetime types', () => {
                expect(PrimitiveTypeFactory.fromString('DATETIME').type).toBe(PrimitiveKind.DATETIME)
                expect(PrimitiveTypeFactory.fromString('Date').type).toBe(PrimitiveKind.DATETIME)
            })
        })

        describe('String types (default)', () => {
            it('should default to STRING for unknown types', () => {
                const result = PrimitiveTypeFactory.fromString('unknown')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })

            it('should map "string" to STRING', () => {
                const result = PrimitiveTypeFactory.fromString('string')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })

            it('should handle empty string as STRING', () => {
                const result = PrimitiveTypeFactory.fromString('')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })
        })
    })

    describe('fromSqlType()', () => {
        describe('SQL Number types', () => {
            it('should map "int" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('int')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "bigint" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('bigint')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "tinyint" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('tinyint')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "decimal(10,2)" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('decimal(10,2)')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "float" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('float')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })

            it('should map "double" to NUMBER', () => {
                const result = PrimitiveTypeFactory.fromSqlType('double')
                expect(result.type).toBe(PrimitiveKind.NUMBER)
            })
        })

        describe('SQL Boolean types', () => {
            it('should map "tinyint(1)" to BOOLEAN', () => {
                const result = PrimitiveTypeFactory.fromSqlType('tinyint(1)')
                expect(result.type).toBe(PrimitiveKind.BOOLEAN)
            })

            it('should map "bool" to BOOLEAN', () => {
                const result = PrimitiveTypeFactory.fromSqlType('bool')
                expect(result.type).toBe(PrimitiveKind.BOOLEAN)
            })

            it('should map "boolean" to BOOLEAN', () => {
                const result = PrimitiveTypeFactory.fromSqlType('boolean')
                expect(result.type).toBe(PrimitiveKind.BOOLEAN)
            })
        })

        describe('SQL DateTime types', () => {
            it('should map "timestamp" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromSqlType('timestamp')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })

            it('should map "datetime" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromSqlType('datetime')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })

            it('should map "date" to DATETIME', () => {
                const result = PrimitiveTypeFactory.fromSqlType('date')
                expect(result.type).toBe(PrimitiveKind.DATETIME)
            })
        })

        describe('SQL String types (default)', () => {
            it('should map "varchar(255)" to STRING', () => {
                const result = PrimitiveTypeFactory.fromSqlType('varchar(255)')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })

            it('should map "text" to STRING', () => {
                const result = PrimitiveTypeFactory.fromSqlType('text')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })

            it('should map "char(10)" to STRING', () => {
                const result = PrimitiveTypeFactory.fromSqlType('char(10)')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })

            it('should map "longtext" to STRING', () => {
                const result = PrimitiveTypeFactory.fromSqlType('longtext')
                expect(result.type).toBe(PrimitiveKind.STRING)
            })
        })

        describe('Case sensitivity', () => {
            it('should be case-insensitive for SQL types', () => {
                expect(PrimitiveTypeFactory.fromSqlType('INT').type).toBe(PrimitiveKind.NUMBER)
                expect(PrimitiveTypeFactory.fromSqlType('VARCHAR(255)').type).toBe(PrimitiveKind.STRING)
                expect(PrimitiveTypeFactory.fromSqlType('TIMESTAMP').type).toBe(PrimitiveKind.DATETIME)
            })
        })
    })

    describe('Edge cases', () => {
        it('should handle whitespace in type strings', () => {
            const result = PrimitiveTypeFactory.fromString('  number  ')
            expect(result.type).toBe(PrimitiveKind.NUMBER)
        })

        it('should handle partial matches correctly', () => {
            // "integer" contains "int"
            expect(PrimitiveTypeFactory.fromString('integer').type).toBe(PrimitiveKind.NUMBER)

            // "tinyint" contains "int"
            expect(PrimitiveTypeFactory.fromSqlType('tinyint').type).toBe(PrimitiveKind.NUMBER)
        })

        it('should distinguish tinyint from tinyint(1)', () => {
            // tinyint without (1) should be NUMBER
            expect(PrimitiveTypeFactory.fromSqlType('tinyint').type).toBe(PrimitiveKind.NUMBER)

            // tinyint(1) should be BOOLEAN
            expect(PrimitiveTypeFactory.fromSqlType('tinyint(1)').type).toBe(PrimitiveKind.BOOLEAN)
        })
    })

    describe('Return type validation', () => {
        it('should return PrimitiveType instances', () => {
            const result = PrimitiveTypeFactory.fromString('number')
            expect(result.constructor.name).toBe('PrimitiveType')
        })

        it('should have correct kind property', () => {
            const numberType = PrimitiveTypeFactory.fromString('number')
            const stringType = PrimitiveTypeFactory.fromString('text')
            const boolType = PrimitiveTypeFactory.fromString('boolean')

            expect(numberType.kind).toBeDefined()
            expect(stringType.kind).toBeDefined()
            expect(boolType.kind).toBeDefined()
        })
    })
})
