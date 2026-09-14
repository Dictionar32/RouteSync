import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
    getSqlTypeMapping,
    getCastMapping,
    mapSqlTypeToMapping,
} from '../../../packages/cli/src/generators/canonical/type-mapping';

describe('Resolvers & Type Mapping Zero Branching SSOT', () => {
    describe('getSqlTypeMapping', () => {
        it('maps numeric SQL types correctly', () => {
            const bigintMapping = getSqlTypeMapping('bigint');
            expect(bigintMapping).toEqual({
                zodType: 'z.number()',
                tsType: 'number',
                baseType: 'number',
                isNullable: false,
            });

            const intMapping = getSqlTypeMapping('int(11)');
            expect(intMapping).toEqual({
                zodType: 'z.number()',
                tsType: 'number',
                baseType: 'number',
                isNullable: false,
            });
        });

        it('maps boolean and tinyint(1) SQL types correctly', () => {
            const boolMapping = getSqlTypeMapping('boolean');
            expect(boolMapping).toEqual({
                zodType: 'z.boolean()',
                tsType: 'boolean',
                baseType: 'boolean',
                isNullable: false,
            });

            const tinyint1Mapping = getSqlTypeMapping('tinyint(1)');
            expect(tinyint1Mapping).toEqual({
                zodType: 'z.boolean()',
                tsType: 'boolean',
                baseType: 'boolean',
                isNullable: false,
            });
        });

        it('maps string and text SQL types correctly', () => {
            const varcharMapping = getSqlTypeMapping('varchar(255)');
            expect(varcharMapping).toEqual({
                zodType: 'z.string()',
                tsType: 'string',
                baseType: 'string',
                isNullable: false,
            });

            const textMapping = getSqlTypeMapping('text');
            expect(textMapping).toEqual({
                zodType: 'z.string()',
                tsType: 'string',
                baseType: 'string',
                isNullable: false,
            });
        });

        it('maps enum SQL types with literal values', () => {
            const enumMapping = getSqlTypeMapping("enum('draft', 'published', 'archived')");
            expect(enumMapping).toEqual({
                zodType: "z.enum(['draft', 'published', 'archived'])",
                tsType: "'draft' | 'published' | 'archived'",
                baseType: 'string',
                isNullable: false,
            });
        });

        it('maps json and jsonb SQL types correctly', () => {
            const jsonMapping = getSqlTypeMapping('json');
            expect(jsonMapping).toEqual({
                zodType: 'z.record(z.string(), z.unknown())',
                tsType: 'Record<string, unknown>',
                baseType: 'object',
                isNullable: false,
            });
        });

        it('returns null for unknown SQL types', () => {
            expect(getSqlTypeMapping('custom_spatial_point')).toBeNull();
        });
    });

    describe('getCastMapping', () => {
        it('maps Eloquent cast types correctly', () => {
            const intCast = getCastMapping('integer');
            expect(intCast).toEqual({
                zodType: 'z.number()',
                tsType: 'number',
                baseType: 'number',
                isNullable: false,
            });

            const stringCast = getCastMapping('string');
            expect(stringCast).toEqual({
                zodType: 'z.string()',
                tsType: 'string',
                baseType: 'string',
                isNullable: false,
            });

            const arrayCast = getCastMapping('array');
            expect(arrayCast).toEqual({
                zodType: 'z.array(z.unknown())',
                tsType: 'unknown[]',
                baseType: 'array',
                isNullable: false,
            });

            const jsonCast = getCastMapping('json');
            expect(jsonCast).toEqual({
                zodType: 'z.record(z.string(), z.unknown())',
                tsType: 'Record<string, unknown>',
                baseType: 'object',
                isNullable: false,
            });
        });

        it('returns null for unknown cast types', () => {
            expect(getCastMapping('App\\Casts\\NonExistentCast')).toBeNull();
        });
    });

    describe('mapSqlTypeToMapping composite', () => {
        it('prioritizes cast over sql type when cast is present and recognized', () => {
            const mapping = mapSqlTypeToMapping('text', 'json');
            expect(mapping).toEqual({
                zodType: 'z.record(z.string(), z.unknown())',
                tsType: 'Record<string, unknown>',
                baseType: 'object',
                isNullable: false,
            });
        });

        it('falls back to sql type when cast is not provided or unknown', () => {
            const mapping = mapSqlTypeToMapping('varchar(100)');
            expect(mapping).toEqual({
                zodType: 'z.string()',
                tsType: 'string',
                baseType: 'string',
                isNullable: false,
            });
        });

        it('returns unknown mapping when neither sql nor cast is recognized', () => {
            const mapping = mapSqlTypeToMapping('foo_bar_baz');
            expect(mapping).toEqual({
                zodType: 'z.unknown()',
                tsType: 'unknown',
                baseType: 'unknown',
                isNullable: false,
            });
        });
    });

    describe('Zero Branching Code Verification', () => {
        it('ensures resolvers.ts has 0 IF statements and 0 switch statements', () => {
            const resolversPath = path.resolve(__dirname, '../../cli/src/generators/canonical/type-mapping/resolvers.ts');
            const content = fs.readFileSync(resolversPath, 'utf8');
            const ifs = (content.match(/\bif\s*\(/g) || []).length;
            const switches = (content.match(/\bswitch\s*\(/g) || []).length;
            expect(ifs).toBe(0);
            expect(switches).toBe(0);
        });

        it('ensures nodeMapper.ts has 0 IF statements and 0 switch statements', () => {
            const nodeMapperPath = path.resolve(__dirname, '../../cli/src/parsers/php/nodeMapper.ts');
            const content = fs.readFileSync(nodeMapperPath, 'utf8');
            const ifs = (content.match(/\bif\s*\(/g) || []).length;
            const switches = (content.match(/\bswitch\s*\(/g) || []).length;
            expect(ifs).toBe(0);
            expect(switches).toBe(0);
        });
    });
});
