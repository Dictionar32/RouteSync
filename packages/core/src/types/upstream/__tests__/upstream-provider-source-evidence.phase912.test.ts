import { describe, expect, it } from 'vitest';
import type { ProviderSourceEvidence } from '../providerEvidence';

describe('phase912 upstream provider source evidence', () => {
  it('keeps provider source input independent from compiler scanner AST types', () => {
    const evidence: ProviderSourceEvidence = {
      kind: 'provider_source_evidence',
      attributes: [],
      className: { kind: 'class_name', value: 'App\\Providers\\AppServiceProvider' },
      methods: [],
      source: {
        kind: 'source_span',
        file: { kind: 'source_file', value: 'app/Providers/AppServiceProvider.php' },
        start: { kind: 'number_value', value: 1 },
        end: { kind: 'number_value', value: 1 },
      },
    };
    expect(evidence.kind).toBe('provider_source_evidence');
    expect(evidence.className.value).toContain('App\\Providers');
  });
});
