/**
 * DataProvenanceKind
 *
 * Canonical ADT discriminator for tracking the source origin of API entities.
 */
export const DataProvenanceKind = Object.freeze({
  RouteDefinition: 'route_definition',
  ControllerAction: 'controller_action',
  FormRequest: 'form_request',
  EloquentModel: 'eloquent_model',
  JsonResource: 'json_resource',
  Inferred: 'inferred'
} as const);

export type DataProvenanceKind = typeof DataProvenanceKind[keyof typeof DataProvenanceKind];

export interface DataProvenanceKindSpecification<K extends DataProvenanceKind = DataProvenanceKind> {
  readonly kind: K;
  readonly category: string;
  readonly isSourceLinked: boolean;
  readonly description: string;
}

export type DataProvenanceKindRegistry = {
  readonly [K in DataProvenanceKind]: DataProvenanceKindSpecification<K>;
};

export const DATA_PROVENANCE_REGISTRY: DataProvenanceKindRegistry = Object.freeze({
  [DataProvenanceKind.RouteDefinition]: {
    kind: DataProvenanceKind.RouteDefinition,
    category: 'route',
    isSourceLinked: true,
    description: 'Originates from Laravel route declaration in routes/api.php or routes/web.php'
  },
  [DataProvenanceKind.ControllerAction]: {
    kind: DataProvenanceKind.ControllerAction,
    category: 'controller',
    isSourceLinked: true,
    description: 'Originates from Laravel controller action method'
  },
  [DataProvenanceKind.FormRequest]: {
    kind: DataProvenanceKind.FormRequest,
    category: 'request',
    isSourceLinked: true,
    description: 'Originates from Laravel FormRequest rules method'
  },
  [DataProvenanceKind.EloquentModel]: {
    kind: DataProvenanceKind.EloquentModel,
    category: 'model',
    isSourceLinked: true,
    description: 'Originates from Laravel Eloquent Model schema, casts, or relations'
  },
  [DataProvenanceKind.JsonResource]: {
    kind: DataProvenanceKind.JsonResource,
    category: 'response',
    isSourceLinked: true,
    description: 'Originates from Laravel JsonResource toArray method'
  },
  [DataProvenanceKind.Inferred]: {
    kind: DataProvenanceKind.Inferred,
    category: 'compiler',
    isSourceLinked: false,
    description: 'Inferred or synthesized by RouteSync Semantic Kernel'
  }
});

export interface ProvenanceSourceRef {
  readonly kind: DataProvenanceKind;
  readonly file: string;
  readonly line: number;
  readonly symbol: string;
}

export interface DataProvenanceVisitor<R> {
  readonly route_definition: (ref: ProvenanceSourceRef) => R;
  readonly controller_action: (ref: ProvenanceSourceRef) => R;
  readonly form_request: (ref: ProvenanceSourceRef) => R;
  readonly eloquent_model: (ref: ProvenanceSourceRef) => R;
  readonly json_resource: (ref: ProvenanceSourceRef) => R;
  readonly inferred: (ref: ProvenanceSourceRef) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ProvenanceSourceRef dengan exhaustive type safety
 */
export function matchDataProvenance<R>(
  source: ProvenanceSourceRef | DataProvenanceKind,
  visitor: DataProvenanceVisitor<R>
): R {
  const isKindString = typeof source === 'string';
  const kind = isKindString ? source : source.kind;
  const descriptor: ProvenanceSourceRef = isKindString
    ? {
        kind,
        file: '',
        line: 1,
        symbol: DATA_PROVENANCE_REGISTRY[kind].description
      }
    : source;
  return visitor[kind](descriptor);
}

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

