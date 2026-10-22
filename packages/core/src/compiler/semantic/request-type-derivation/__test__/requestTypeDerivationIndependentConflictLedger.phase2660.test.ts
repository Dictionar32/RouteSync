import { describe, expect, it } from 'vitest';
import type { RequestTypeDerivationInput } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSemanticInputPreparation } from '../requestTypeDerivationSemanticInputPreparation';
import { requestTypeDerivationSemanticReasoning } from '../requestTypeDerivationSemanticReasoning';

const value = (value: string) => Object.freeze({ kind: 'string_value' as const, value });

const sourceSpan = (file: string, start: number, end: number) => Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: value(file) }),
  start: Object.freeze({ kind: 'number_value' as const, value: start }),
  end: Object.freeze({ kind: 'number_value' as const, value: end }),
});

const requestAst = (start: number) => Object.freeze({
  kind: 'request_ast' as const,
  definition: Object.freeze({
    kind: 'request' as const,
    identity: Object.freeze({
      kind: 'form_request_identity' as const,
      request: Object.freeze({ kind: 'request_name' as const, value: value('StorePostRequest') }),
      formType: Object.freeze({ kind: 'form_type_name' as const, value: value('StorePostRequest') }),
    }),
  }),
  source: sourceSpan('app/Http/Requests/StorePostRequest.php', start, start + 9),
});

const routeWithIndependentConflicts = () => Object.freeze({
  identity: Object.freeze({
    coordinates: Object.freeze({
      method: 'POST',
      path: Object.freeze({ kind: 'route_path' as const, value: value('/posts') }),
      name: Object.freeze({ kind: 'route_name' as const, value: value('posts.store') }),
    }),
    domain: Object.freeze({
      resource: Object.freeze({ kind: 'resource_name' as const, value: value('Post') }),
      domain: Object.freeze({ kind: 'domain_name' as const, value: value('Post') }),
      group: Object.freeze({ kind: 'domain_name' as const, value: value('Post') }),
    }),
  }),
  provenance: Object.freeze({ declarationSpan: sourceSpan('routes/api.php', 1, 20) }),
  binding: Object.freeze({
    request: Object.freeze({
      kind: 'form_request' as const,
      identity: Object.freeze({
        source: Object.freeze({
          requestClass: Object.freeze({ kind: 'class_name' as const, value: value('StorePostRequest') }),
          formType: Object.freeze({ kind: 'form_type_name' as const, value: value('StorePostRequest') }),
        }),
        resource: Object.freeze({ kind: 'resource_name' as const, value: value('User') }),
      }),
    }),
  }),
});

describe('Phase 2660 independent request/resource conflict witnesses', () => {
  it('preserves request ambiguity and route-vs-binding resource mismatch on the same route', () => {
    const input = Object.freeze({
      routes: Object.freeze([routeWithIndependentConflicts()]),
      requests: Object.freeze([requestAst(1), requestAst(20)]),
      resources: Object.freeze([]),
    }) as unknown as RequestTypeDerivationInput;

    const prepared = requestTypeDerivationSemanticInputPreparation.prepare(input);
    const inference = requestTypeDerivationSemanticReasoning.infer(prepared);

    expect(inference.judgment.kind).toBe('conflict');
    if (inference.judgment.kind !== 'conflict') throw new Error('independent source conflicts must remain a conflict judgment');

    const conflictKinds = inference.judgment.conflicts.map(conflict => conflict.kind);
    expect(conflictKinds).toContain('ambiguous_request_identity');
    expect(conflictKinds).toContain('resource_identity_mismatch');

    const requestConflict = inference.judgment.conflicts.find(conflict => conflict.kind === 'ambiguous_request_identity');
    expect(requestConflict?.kind === 'ambiguous_request_identity' ? requestConflict.candidates : []).toHaveLength(2);

    const resourceConflict = inference.judgment.conflicts.find(conflict => conflict.kind === 'resource_identity_mismatch');
    expect(resourceConflict?.kind === 'resource_identity_mismatch' ? resourceConflict.routeResourceName.value.value : undefined).toBe('Post');
    expect(resourceConflict?.kind === 'resource_identity_mismatch' ? resourceConflict.bindingResourceName.value.value : undefined).toBe('User');

    expect(inference.judgment.proof.routeReceipts).toHaveLength(1);
    expect(inference.judgment.proof.routeReceipts[0]?.disposition).toMatchObject({
      kind: 'conflicted',
      reason: 'resource_identity_mismatch',
    });
  });
});
