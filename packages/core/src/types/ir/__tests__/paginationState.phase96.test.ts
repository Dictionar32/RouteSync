import type { PaginationState } from '../paginationState';

describe('Phase 96 pagination state ADT', () => {
  it('represents absence without null', () => {
    const state: PaginationState = { kind: 'none' };
    expect(state.kind).toBe('none');
  });

  it('represents pagination as a verified semantic value', () => {
    const state: PaginationState = {
      kind: 'present',
      value: {
        kind: 'cursor',
        metaFields: [{ kind: 'response_meta_key', value: 'next_cursor' }]
      }
    };
    expect(state.value.kind).toBe('cursor');
  });
});
