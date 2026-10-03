import { describe, expectTypeOf, it } from 'vitest';
import type { CompleteManifest } from '../completeness';
import type { RouteSyncManifest } from '../manifest';

describe('upstream interface elevation phase 23', () => {
  it('keeps validated manifest as an interface boundary', () => {
    expectTypeOf<CompleteManifest>().toMatchObjectType<{
      readonly kind: 'complete_manifest';
      readonly manifest: RouteSyncManifest;
    }>();
  });
});
