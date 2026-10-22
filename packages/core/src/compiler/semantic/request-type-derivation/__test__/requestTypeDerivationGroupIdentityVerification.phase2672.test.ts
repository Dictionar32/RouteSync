import { describe, expect, it } from 'vitest';
import type {
  RequestTypeDerivationSemanticInputPreparation,
  RequestTypeGroupReceipt,
} from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationGroupIdentityVerification } from '../requestTypeDerivationProofVerifier';

const group = (canonicalKey: string, routeKey: string, requestKey: string): RequestTypeGroupReceipt => ({
  canonicalKey,
  contributions: [{ route: { occurrenceKey: routeKey }, request: { occurrenceKey: requestKey } }],
}) as unknown as RequestTypeGroupReceipt;

const prepared = (routes: readonly { routeKey: string; requestKey: string; groupKey: string }[]): RequestTypeDerivationSemanticInputPreparation => ({
  resourceResolutionLedger: routes.map(({ routeKey, groupKey }) => ({
    route: { occurrenceKey: routeKey },
    resolution: { kind: 'resolved', resource: { canonicalIdentity: { semanticKey: groupKey } } },
  })),
  requestResolutionLedger: routes.map(({ routeKey, requestKey }) => ({
    route: { occurrenceKey: routeKey },
    resolution: { kind: 'resolved_exact', request: { occurrenceKey: requestKey } },
  })),
}) as unknown as RequestTypeDerivationSemanticInputPreparation;

describe('Phase 2672 resource group identity verifier', () => {
  it('accepts a group whose key matches the route resource-resolution witness', () => {
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [group('resource:post', 'route-occurrence:r1', 'request-occurrence:q1')],
      prepared([{ routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:q1', groupKey: 'resource:post' }]),
    )).toBe(true);
  });

  it('rejects a forged canonical group key', () => {
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [group('resource:comment', 'route-occurrence:r1', 'request-occurrence:q1')],
      prepared([{ routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:q1', groupKey: 'resource:post' }]),
    )).toBe(false);
  });

  it('rejects a route occurrence repeated across two groups', () => {
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [
        group('resource:post', 'route-occurrence:r1', 'request-occurrence:q1'),
        group('resource:comment', 'route-occurrence:r1', 'request-occurrence:q2'),
      ],
      prepared([
        { routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:q1', groupKey: 'resource:post' },
        { routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:q2', groupKey: 'resource:comment' },
      ]),
    )).toBe(false);
  });

  it('rejects missing or duplicated resource-resolution evidence', () => {
    const valid = prepared([{ routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:q1', groupKey: 'resource:post' }]);
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [group('resource:post', 'route-occurrence:r1', 'request-occurrence:q1')],
      { ...valid, resourceResolutionLedger: [] } as unknown as RequestTypeDerivationSemanticInputPreparation,
    )).toBe(false);
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [group('resource:post', 'route-occurrence:r1', 'request-occurrence:q1')],
      { ...valid, resourceResolutionLedger: [...valid.resourceResolutionLedger, ...valid.resourceResolutionLedger] } as unknown as RequestTypeDerivationSemanticInputPreparation,
    )).toBe(false);
  });

  it('allows a FormRequest occurrence to be reused by distinct routes when each resolution witness agrees', () => {
    expect(requestTypeDerivationGroupIdentityVerification.matchesInput(
      [
        group('resource:post', 'route-occurrence:r1', 'request-occurrence:shared'),
        group('resource:comment', 'route-occurrence:r2', 'request-occurrence:shared'),
      ],
      prepared([
        { routeKey: 'route-occurrence:r1', requestKey: 'request-occurrence:shared', groupKey: 'resource:post' },
        { routeKey: 'route-occurrence:r2', requestKey: 'request-occurrence:shared', groupKey: 'resource:comment' },
      ]),
    )).toBe(true);
  });
});
