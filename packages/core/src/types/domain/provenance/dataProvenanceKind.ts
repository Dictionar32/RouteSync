/**
 * dataProvenanceKind.ts
 *
 * DataProvenanceKind ADT and matching primitives.
 *
 * @module types/domain/provenance
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
