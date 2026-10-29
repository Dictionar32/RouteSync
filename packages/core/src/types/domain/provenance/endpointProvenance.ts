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

export type EndpointProvenanceSource =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: ProvenanceSourceRef };

export interface EndpointProvenanceDescriptor {
  readonly route: ProvenanceSourceRef;
  readonly controller: EndpointProvenanceSource;
  readonly request: EndpointProvenanceSource;
  readonly response: EndpointProvenanceSource;
  readonly summary: string;
}

export class ScannedEndpointProvenanceDescriptor implements EndpointProvenanceDescriptor {
  public readonly route: ProvenanceSourceRef;
  public readonly controller: EndpointProvenanceSource;
  public readonly request: EndpointProvenanceSource;
  public readonly response: EndpointProvenanceSource;
  public readonly summary: string;

  constructor(params: EndpointProvenanceDescriptor) {
    this.route = Object.freeze({ ...params.route });
    this.controller = params.controller.kind === 'present' ? Object.freeze({ kind: 'present', value: Object.freeze({ ...params.controller.value }) }) : { kind: 'absent' };
    this.request = params.request.kind === 'present' ? Object.freeze({ kind: 'present', value: Object.freeze({ ...params.request.value }) }) : { kind: 'absent' };
    this.response = params.response.kind === 'present' ? Object.freeze({ kind: 'present', value: Object.freeze({ ...params.response.value }) }) : { kind: 'absent' };
    this.summary = params.summary;
    Object.freeze(this);
  }

  public static create(params: {
    readonly route: ProvenanceSourceRef;
    readonly controller: EndpointProvenanceSource;
    readonly request: EndpointProvenanceSource;
    readonly response: EndpointProvenanceSource;
  }): ScannedEndpointProvenanceDescriptor {
    const parts: string[] = [`Route: ${params.route.file}:${params.route.line}`];
    if (params.controller.kind === 'present') {
      parts.push(`Controller: ${params.controller.value.file}:${params.controller.value.line} (${params.controller.value.symbol})`);
    }
    if (params.request.kind === 'present') {
      parts.push(`Request: ${params.request.value.file}:${params.request.value.line} (${params.request.value.symbol})`);
    }
    if (params.response.kind === 'present') {
      parts.push(`Response: ${params.response.value.file}:${params.response.value.line} (${params.response.value.symbol})`);
    }
    return new ScannedEndpointProvenanceDescriptor({
      route: params.route,
      controller: params.controller,
      request: params.request,
      response: params.response,
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
      controller: { kind: 'absent' },
      request: { kind: 'absent' },
      response: { kind: 'absent' },
      summary: `Inferred: ${method.toUpperCase()} ${routePath}`
    });
  }
}
