import { describe, expect, it } from 'vitest';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { RequestTypeCanonicalResourceIdentity } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from '../requestTypeDerivationSourceEvidenceInventory';

const identity = (name: string): RequestTypeCanonicalResourceIdentity => Object.freeze({
  kind: 'canonical_resource_identity',
  canonicalName: SemanticValueFactory.resourceName(name),
  semanticKey: `resource:${name}`,
});

describe('upstream canonical resource identity relation judgment · phase2711', () => {
  it('compares canonical domain identity instead of serialized evidence keys', () => {
    const first = identity('paymentresource');
    const sameIdentityWithDifferentEvidenceEncoding = Object.freeze({
      ...identity('paymentresource'),
      semanticKey: 'resource:legacy-or-alternate-encoding',
    });

    expect(requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(first, sameIdentityWithDifferentEvidenceEncoding)).toMatchObject({ kind: 'canonical_resource_identity_equivalent', left: first, right: sameIdentityWithDifferentEvidenceEncoding });
  });

  it('rejects different canonical resource identities even when the evidence key is equal', () => {
    const first = identity('paymentresource');
    const second = Object.freeze({
      ...identity('orderresource'),
      semanticKey: first.semanticKey,
    });

    expect(requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(first, second)).toMatchObject({ kind: 'canonical_resource_identity_distinct', left: first, right: second });
  });
});
