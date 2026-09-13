/**
 * endpointProvenance.ts
 *
 * Endpoint provenance descriptors and factories.
 *
 * @module types/domain/provenance
 */

import {
  DataProvenanceKind,
  type ProvenanceSourceRef
} from './dataProvenanceKind';

export interface EndpointProvenanceDescriptor {
  readonly route: ProvenanceSourceRef;
  readonly controller: ProvenanceSourceRef | null;
  readonly request: ProvenanceSourceRef | null;
  readonly response: ProvenanceSourceRef | null;
  readonly summary: string;
}

export class ScannedEndpointProvenanceDescriptor implements EndpointProvenanceDescriptor {
  public readonly route: ProvenanceSourceRef;
  public readonly controller: ProvenanceSourceRef | null;
  public readonly request: ProvenanceSourceRef | null;
  public readonly response: ProvenanceSourceRef | null;
  public readonly summary: string;

  constructor(params: EndpointProvenanceDescriptor) {
    this.route = Object.freeze({ ...params.route });
    this.controller = params.controller ? Object.freeze({ ...params.controller }) : null;
    this.request = params.request ? Object.freeze({ ...params.request }) : null;
    this.response = params.response ? Object.freeze({ ...params.response }) : null;
    this.summary = params.summary;
    Object.freeze(this);
  }

  public static create(params: {
    readonly route: ProvenanceSourceRef;
    readonly controller?: ProvenanceSourceRef | null;
    readonly request?: ProvenanceSourceRef | null;
    readonly response?: ProvenanceSourceRef | null;
  }): ScannedEndpointProvenanceDescriptor {
    const parts: string[] = [`Route: ${params.route.file}:${params.route.line}`];
    if (params.controller) {
      parts.push(`Controller: ${params.controller.file}:${params.controller.line} (${params.controller.symbol})`);
    }
    if (params.request) {
      parts.push(`Request: ${params.request.file}:${params.request.line} (${params.request.symbol})`);
    }
    if (params.response) {
      parts.push(`Response: ${params.response.file}:${params.response.line} (${params.response.symbol})`);
    }
    return new ScannedEndpointProvenanceDescriptor({
      route: params.route,
      controller: params.controller ?? null,
      request: params.request ?? null,
      response: params.response ?? null,
      summary: parts.join(' | ')
    });
  }

  public static inferred(routePath: string, method: string): ScannedEndpointProvenanceDescriptor {
    const routeRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.Inferred,
      file: 'routes/api.php',
      line: 1,
      symbol: `${method.toUpperCase()} ${routePath}`
    };
    return new ScannedEndpointProvenanceDescriptor({
      route: routeRef,
      controller: null,
      request: null,
      response: null,
      summary: `Inferred: ${method.toUpperCase()} ${routePath}`
    });
  }
}
