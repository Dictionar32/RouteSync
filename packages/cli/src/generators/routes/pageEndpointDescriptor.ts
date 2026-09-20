/**
 * pageEndpointDescriptor.ts
 *
 * Reusable Constructor: Scanned Page Endpoint Descriptor for frontend routes.
 *
 * @module cli/generators/routes
 */

import {
  PageEndpointKind,
  SemanticValueFactory,
  type PageEndpointDescriptor,
  type PropertyName,
  type RouteParameterName,
  type RoutePath
} from '@routesync/core';

export interface ScannedPageEndpointParams {
  readonly path: RoutePath;
  readonly query: readonly PropertyName[];
  readonly params: readonly RouteParameterName[];
  readonly kind: PageEndpointKind;
}

export class ScannedPageEndpointDescriptor implements PageEndpointDescriptor {
  public readonly kind: PageEndpointKind;
  public readonly path: RoutePath;
  public readonly query: readonly PropertyName[];
  public readonly params: readonly RouteParameterName[];

  constructor({ path, query, params, kind }: ScannedPageEndpointParams) {
    this.path = path;
    this.query = Object.freeze([...query]);
    this.params = Object.freeze([...params]);
    this.kind = kind;
    Object.freeze(this);
  }

  public static static(path: string): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path: SemanticValueFactory.routePath(path),
      query: [],
      params: [],
      kind: PageEndpointKind.Static
    });
  }

  public static parameterized(path: string, params: readonly string[]): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path: SemanticValueFactory.routePath(path),
      query: [],
      params: params.map((value) => SemanticValueFactory.routeParameterName(value)),
      kind: PageEndpointKind.Parameterized
    });
  }

  public static queryFiltered(path: string, query: readonly string[], params: readonly string[] = []): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path: SemanticValueFactory.routePath(path),
      query: query.map((value) => SemanticValueFactory.propertyName(value)),
      params: params.map((value) => SemanticValueFactory.routeParameterName(value)),
      kind: PageEndpointKind.QueryFiltered
    });
  }

  public static create(params: ScannedPageEndpointParams): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor(params);
  }

  public static simple(path: string): ScannedPageEndpointDescriptor {
    return ScannedPageEndpointDescriptor.static(path);
  }
}
