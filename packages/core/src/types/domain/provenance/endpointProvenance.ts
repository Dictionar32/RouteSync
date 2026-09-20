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
import type { Option } from '../../upstream/collections';

export interface EndpointProvenanceDescriptor {
  readonly route: ProvenanceSourceRef;
  readonly controller: Option<ProvenanceSourceRef>;
  readonly request: Option<ProvenanceSourceRef>;
  readonly response: Option<ProvenanceSourceRef>;
  readonly summary: string;
}

export class ScannedEndpointProvenanceDescriptor implements EndpointProvenanceDescriptor {
  public readonly route: ProvenanceSourceRef;
  public readonly controller: Option<ProvenanceSourceRef>;
  public readonly request: Option<ProvenanceSourceRef>;
  public readonly response: Option<ProvenanceSourceRef>;
  public readonly summary: string;

  constructor(params: EndpointProvenanceDescriptor) {
    this.route = Object.freeze({ ...params.route });
    this.controller = params.controller.kind === 'some' ? Object.freeze({ kind: 'some', value: Object.freeze({ ...params.controller.value }) }) : { kind: 'none' };
    this.request = params.request.kind === 'some' ? Object.freeze({ kind: 'some', value: Object.freeze({ ...params.request.value }) }) : { kind: 'none' };
    this.response = params.response.kind === 'some' ? Object.freeze({ kind: 'some', value: Object.freeze({ ...params.response.value }) }) : { kind: 'none' };
    this.summary = params.summary;
    Object.freeze(this);
  }

  public static create(params: {
    readonly route: ProvenanceSourceRef;
    readonly controller: Option<ProvenanceSourceRef>;
    readonly request: Option<ProvenanceSourceRef>;
    readonly response: Option<ProvenanceSourceRef>;
  }): ScannedEndpointProvenanceDescriptor {
    const parts: string[] = [`Route: ${params.route.file}:${params.route.line}`];
    if (params.controller.kind === 'some') {
      parts.push(`Controller: ${params.controller.value.file}:${params.controller.value.line} (${params.controller.value.symbol})`);
    }
    if (params.request.kind === 'some') {
      parts.push(`Request: ${params.request.value.file}:${params.request.value.line} (${params.request.value.symbol})`);
    }
    if (params.response.kind === 'some') {
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
      controller: { kind: 'none' },
      request: { kind: 'none' },
      response: { kind: 'none' },
      summary: `Inferred: ${method.toUpperCase()} ${routePath}`
    });
  }
}
