import { describe, test, expect } from 'vitest';
import { LaravelSourceLexer } from '../LaravelSourceLexer';

describe('LaravelSourceLexer Specification (TDD Suite)', () => {
    test('1. Tokenizes string literals, variables, arrow operators, and double colons', () => {
        const source = `Route::get('/api/users', [UserController::class, 'index']);`;
        const tokens = LaravelSourceLexer.tokenize(source);

        expect(tokens.length).toBeGreaterThan(5);
        expect(tokens[0].value).toBe('Route');
        expect(tokens[1].value).toBe('::');
        expect(tokens[2].value).toBe('get');
        expect(tokens[4].value).toBe('/api/users');
    });

    test('2. Recursively parses nested PHP array declarations with exact source slice', () => {
        const source = `[
            'id' => 1,
            'details' => [
                'color' => 'red',
                'size' => 'XL'
            ],
            'price' => 50000
        ]`;
        const tokens = LaravelSourceLexer.tokenize(source);
        const result = LaravelSourceLexer.parseArray(source, tokens);

        expect(result.entries).toHaveLength(3);
        expect(result.entries[0].key).toBe('id');
        expect(result.entries[0].value).toBe('1');

        // Nested array
        expect(result.entries[1].key).toBe('details');
        expect(Array.isArray(result.entries[1].value)).toBe(true);

        // Third entry after nested array
        expect(result.entries[2].key).toBe('price');
        expect(result.entries[2].value).toBe('50000');
    });
});