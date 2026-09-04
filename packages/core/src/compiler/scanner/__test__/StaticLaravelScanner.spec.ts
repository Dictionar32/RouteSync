import { describe, test, expect } from 'vitest';
import { StaticLaravelScanner } from '../StaticLaravelScanner';
import path from 'path';

describe('StaticLaravelScanner Specification (TDD Suite)', () => {
    test('1. Scans mock Laravel directory and produces complete RouteManifest', async () => {
        const fixturePath = path.resolve(__dirname, '../../../../../../packages/sdk/tests/fixtures');
        const manifest = await StaticLaravelScanner.scan(fixturePath);

        expect(manifest.version).toBe('6.0.0');
        expect(manifest.routes).toBeDefined();
        expect(manifest.resources).toBeDefined();
        expect(manifest.models).toBeDefined();
        expect(manifest.requestTypes).toBeDefined();
        expect(manifest.semanticTypes).toBeDefined();
    });
});