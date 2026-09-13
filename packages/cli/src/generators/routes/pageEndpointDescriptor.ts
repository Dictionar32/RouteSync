/**
 * pageEndpointDescriptor.ts
 *
 * Reusable Constructor: Scanned Page Endpoint Descriptor for frontend routes.
 *
 * @module cli/generators/routes
 */

import {
  PageEndpointKind,
  type PageEndpointDescriptor
} from '@routesync/core';

export interface ScannedPageEndpointParams {
  readonly path: string;
  readonly query: readonly string[];
  readonly params: readonly string[];
  readonly kind?: PageEndpointKind;
}

/**
 * Reusable Constructor: Scanned Page Endpoint Descriptor.
 */
export class ScannedPageEndpointDescriptor implements PageEndpointDescriptor {
  public readonly kind: PageEndpointKind;
  public readonly path: string;
  public readonly query: readonly string[];
  public readonly params: readonly string[];

  constructor(params: ScannedPageEndpointParams);
  constructor(params: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind });
  constructor({ path, query = [], params = [], kind }: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind }) {
    this.path = path;
    this.query = Object.freeze([...query]);
    this.params = Object.freeze([...params]);
    this.kind = kind ?? (this.query.length > 0 ? PageEndpointKind.QueryFiltered : (this.params.length > 0 ? PageEndpointKind.Parameterized : PageEndpointKind.Static));
    Object.freeze(this);
  }

  public static static(path: string): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query: [],
      params: [],
      kind: PageEndpointKind.Static
    });
  }

  public static parameterized(path: string, params: readonly string[]): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query: [],
      params,
      kind: PageEndpointKind.Parameterized
    });
  }

  public static queryFiltered(path: string, query: readonly string[], params: readonly string[] = []): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query,
      params,
      kind: PageEndpointKind.QueryFiltered
    });
  }

  public static create(params: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind }): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path: params.path,
      query: params.query ?? [],
      params: params.params ?? [],
      kind: params.kind
    });
  }

  public static simple(path: string): ScannedPageEndpointDescriptor {
    return ScannedPageEndpointDescriptor.static(path);
  }
}
