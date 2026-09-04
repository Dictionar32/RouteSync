import { describe, test, expect, expectTypeOf } from 'vitest';
import { ResponseAnalysisPass } from '../ResponseAnalysisPass';

describe('ResponseAnalysisPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof ResponseAnalysisPass>().toBeConstructibleWith();
        const pass = new ResponseAnalysisPass();
        expect(pass.name).toBe('ResponseAnalysis');
        expect(pass.defaultConfidence).toBe(0.95);
        expect(pass.revision).toBe('1.0.0');
        expect(pass.descriptor.consumes).toContain('RouteManifest');
        expect(pass.descriptor.produces).toContain('ResponseAnalysis');
    });

    test('2. Constructor with empty options object ({}) initializes defaults safely', () => {
        expectTypeOf<typeof ResponseAnalysisPass>().toBeConstructibleWith({});
        const pass = new ResponseAnalysisPass({});
        expect(pass).toBeInstanceOf(ResponseAnalysisPass);
        expect(pass.defaultConfidence).toBe(0.95);
    });

    test('3. Constructor with custom flat parameters initializes properties immutably', () => {
        const pass = new ResponseAnalysisPass({
            defaultConfidence: 0.85,
            revision: '2.0.0'
        });
        expect(pass.defaultConfidence).toBe(0.85);
        expect(pass.revision).toBe('2.0.0');
    });
});