/**
 * typeMapper.ts
 *
 * Pure SQL and Cast type mappers for SemanticResolutionKernel.
 *
 * @module core/semantic/kernel
 */

export function mapSqlTypeToTs(sqlType: string): string {
    const s = sqlType.toLowerCase();
    if (s === 'number' || s === 'boolean' || s === 'string' || s === 'any' || s === 'unknown' || s === 'void') return s;
    if (s === 'mixed') return 'unknown';
    if (s.includes('bool') || s.includes('tinyint(1)')) return 'boolean';
    if (s.includes('int') || s.includes('decimal') || s.includes('float') || s.includes('double') || s.includes('numeric')) return 'number';
    return 'string';
}

export function mapCastToTs(castType: string, baseType: string): string {
    const s = castType.toLowerCase();
    if (s.includes('int') || s.includes('float') || s.includes('double') || s.includes('decimal')) return 'number';
    if (s.includes('bool')) return 'boolean';
    if (s.includes('array') || s.includes('json') || s.includes('object') || s.includes('collection')) return 'json-object';
    if (s.includes('date') || s.includes('datetime')) return 'string';
    return baseType;
}
