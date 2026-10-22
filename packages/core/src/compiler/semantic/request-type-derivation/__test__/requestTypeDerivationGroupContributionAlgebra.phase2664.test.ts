import { describe, expect, it } from 'vitest';
import type { RequestType } from '../../../../types/domain/request';
import type { RequestTypeGroupFoldInput, RequestTypeGroupReceipt, RequestTypeRequestEvidenceReference, RequestTypeRouteEvidenceReference } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationGroupContributionAlgebra } from '../requestTypeDerivationGroupContributionAlgebra';
import { requestTypeDerivationGroupReceiptsReplayVerification } from '../requestTypeDerivationProofVerifier';

const action = (name: 'create' | 'update', fields: readonly unknown[]) => Object.freeze({ name, fields: Object.freeze([...fields]) });
const requestType = (actions: RequestType['actions'], response: RequestType['response'] = Object.freeze({ kind: 'none' as const })) => Object.freeze({
  identity: Object.freeze({}), source: Object.freeze({}), actions, response,
}) as unknown as RequestType;
const route = Object.freeze({ occurrenceKey: 'route-occurrence:r1' }) as unknown as RequestTypeRouteEvidenceReference;
const request = Object.freeze({ occurrenceKey: 'request-occurrence:q1' }) as unknown as RequestTypeRequestEvidenceReference;
const absent = Object.freeze({ kind: 'group_absent' as const });
const fold = (before: RequestTypeGroupFoldInput['before'], incoming: RequestType): ReturnType<typeof requestTypeDerivationGroupContributionAlgebra.fold> => requestTypeDerivationGroupContributionAlgebra.fold({
  canonicalKey: 'resource:post', route, request, before, incoming,
});

describe('Phase 2664 canonical group contribution algebra', () => {
  it('records initial group state and appends the first action', () => {
    const incoming = requestType([action('create', ['title']) as unknown as RequestType['actions'][number]]);
    const receipt = fold(absent, incoming);
    expect(receipt.transition).toBe('initial_group');
    expect(receipt.before).toEqual({ kind: 'group_absent' });
    expect(receipt.action.kind).toBe('appended');
    expect(receipt.after.actions).toEqual(incoming.actions);
  });

  it('replaces an empty existing action with fieldful incoming action', () => {
    const before = requestType([action('create', []) as unknown as RequestType['actions'][number]]);
    const incoming = requestType([action('create', ['title']) as unknown as RequestType['actions'][number]]);
    const receipt = fold(before, incoming);
    expect(receipt.transition).toBe('merge_existing_group');
    expect(receipt.action.kind).toBe('replaced_existing');
    expect(receipt.after.actions[0]?.fields).toEqual(['title']);
  });

  it('retains a nonempty existing action and response under canonical policy', () => {
    const response = Object.freeze({ kind: 'data' as const, value: Object.freeze({ contract: Object.freeze({}), fields: Object.freeze([]) }) }) as unknown as RequestType['response'];
    const before = requestType([action('create', ['existing']) as unknown as RequestType['actions'][number]], response);
    const incoming = requestType([action('create', ['incoming']) as unknown as RequestType['actions'][number]], response);
    const receipt = fold(before, incoming);
    expect(receipt.action.kind).toBe('retained_existing');
    expect(receipt.response.kind).toBe('retained_existing');
    expect(receipt.after.actions[0]?.fields).toEqual(['existing']);
    expect(receipt.after.response).toBe(response);
  });
});


describe('Phase 2669 independent group-receipt replay', () => {
  it('accepts a contiguous receipt chain whose final output matches the judgment', () => {
    const firstIncoming = requestType([action('create', []) as unknown as RequestType['actions'][number]]);
    const secondIncoming = requestType([action('create', ['title']) as unknown as RequestType['actions'][number]]);
    const first = fold(absent, firstIncoming);
    const second = fold(first.after, secondIncoming);
    const group: RequestTypeGroupReceipt = Object.freeze({
      canonicalKey: 'resource:post',
      contributingRoutes: Object.freeze([route, route]),
      contributingRequests: Object.freeze([request, request]),
      contributions: Object.freeze([first, second]),
      result: second.after,
      resultIdentity: second.after.identity,
    });
    expect(requestTypeDerivationGroupReceiptsReplayVerification.replay([group], [second.after])).toBe(true);
  });

  it('rejects a forged after-state even when the group output repeats the forged state', () => {
    const incoming = requestType([action('create', ['title']) as unknown as RequestType['actions'][number]]);
    const valid = fold(absent, incoming);
    const forgedAfter = requestType([action('create', ['forged']) as unknown as RequestType['actions'][number]]);
    const forged = Object.freeze({ ...valid, after: forgedAfter });
    const group: RequestTypeGroupReceipt = Object.freeze({
      canonicalKey: 'resource:post',
      contributingRoutes: Object.freeze([route]),
      contributingRequests: Object.freeze([request]),
      contributions: Object.freeze([forged]),
      result: forgedAfter,
      resultIdentity: forgedAfter.identity,
    });
    expect(requestTypeDerivationGroupReceiptsReplayVerification.replay([group], [forgedAfter])).toBe(false);
  });
});
