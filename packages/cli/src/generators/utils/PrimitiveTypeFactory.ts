/**
 * PrimitiveTypeFactory.ts
 * Factory for creating PrimitiveType instances from type strings
 * 
 * Consolidates type mapping logic extracted from CompilerBridge
 * Supports both generic type strings and SQL-specific types
 */

import { PrimitiveType, PrimitiveKind } from '../../../../core/src/compiler/types/SemanticType'

/**
 * Factory for creating PrimitiveType instances
 * Provides centralized type mapping logic
 */
export class PrimitiveTypeFactory {
    /**
     * Create PrimitiveType from generic type string
     * Handles: 'number', 'string', 'boolean', 'datetime', etc.
     * 
     * @param typeStr - Type string (e.g., 'number', 'string', 'boolean')
     * @returns Corresponding PrimitiveType instance
     * 
     * @example
     * ```typescript
     * PrimitiveTypeFactory.fromString('number')  // PrimitiveType(NUMBER)
     * PrimitiveTypeFactory.fromString('bool')    // PrimitiveType(BOOLEAN)
     * PrimitiveTypeFactory.fromString('date')    // PrimitiveType(DATETIME)
     * ```
     */
    static fromString(typeStr: string): PrimitiveType {
        const normalized = typeStr.toLowerCase()

        if (this.isNumberType(normalized)) {
            return new PrimitiveType(PrimitiveKind.NUMBER)
        }
        if (this.isBooleanType(normalized)) {
            return new PrimitiveType(PrimitiveKind.BOOLEAN)
        }
        if (this.isDateTimeType(normalized)) {
            return new PrimitiveType(PrimitiveKind.DATETIME)
        }

        // Default to string
        return new PrimitiveType(PrimitiveKind.STRING)
    }

    /**
     * Create PrimitiveType from SQL type string
     * Handles: 'varchar', 'int', 'timestamp', 'tinyint(1)', etc.
     * 
     * @param sqlType - SQL type string (e.g., 'varchar(255)', 'int', 'timestamp')
     * @returns Corresponding PrimitiveType instance
     * 
     * @example
     * ```typescript
     * PrimitiveTypeFactory.fromSqlType('varchar(255)')  // PrimitiveType(STRING)
     * PrimitiveTypeFactory.fromSqlType('int')           // PrimitiveType(NUMBER)
     * PrimitiveTypeFactory.fromSqlType('tinyint(1)')    // PrimitiveType(BOOLEAN)
     * ```
     */
    static fromSqlType(sqlType: string): PrimitiveType {
        const normalized = sqlType.toLowerCase()

        if (this.isSqlNumber(normalized)) {
            return new PrimitiveType(PrimitiveKind.NUMBER)
        }
        if (this.isSqlBoolean(normalized)) {
            return new PrimitiveType(PrimitiveKind.BOOLEAN)
        }
        if (this.isSqlDateTime(normalized)) {
            return new PrimitiveType(PrimitiveKind.DATETIME)
        }

        // Default to string for varchar, text, char, etc.
        return new PrimitiveType(PrimitiveKind.STRING)
    }

    /**
     * Check if type string represents a number type
     * Matches: 'number', 'int', 'float', 'double'
     */
    private static isNumberType(type: string): boolean {
        return ['number', 'int', 'float', 'double'].some(t => type.includes(t))
    }

    /**
     * Check if type string represents a boolean type
     * Matches: 'boolean', 'bool'
     */
    private static isBooleanType(type: string): boolean {
        return ['boolean', 'bool'].some(t => type.includes(t))
    }

    /**
     * Check if type string represents a datetime type
     * Matches: 'datetime', 'date', 'timestamp'
     */
    private static isDateTimeType(type: string): boolean {
        return ['datetime', 'date', 'timestamp'].some(t => type.includes(t))
    }

    /**
     * Check if SQL type represents a number
     * Matches: 'int', 'decimal', 'float', 'double'
     */
    private static isSqlNumber(type: string): boolean {
        return type.includes('int') ||
            type.includes('decimal') ||
            type.includes('float') ||
            type.includes('double')
    }

    /**
     * Check if SQL type represents a boolean
     * Matches: 'bool', 'tinyint(1)'
     */
    private static isSqlBoolean(type: string): boolean {
        return type.includes('bool') || type.includes('tinyint(1)')
    }

    /**
     * Check if SQL type represents a datetime
     * Matches: 'timestamp', 'datetime', 'date'
     */
    private static isSqlDateTime(type: string): boolean {
        return type.includes('timestamp') ||
            type.includes('datetime') ||
            type.includes('date')
    }
}
