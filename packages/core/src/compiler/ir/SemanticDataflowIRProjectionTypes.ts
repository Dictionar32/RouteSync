import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowOrigin,
  SemanticDataflowLineageProducer,
} from '../../types/upstream/semanticDataflow';

export type SemanticDataflowIRRelationKind = 'dependency' | 'value_flow' | 'reaches';

export interface SemanticDataflowIRNode {
  readonly id: string;
  readonly role: SemanticDataflowIdentity['role'];
  readonly slot: string;
  readonly source: SemanticDataflowIdentity['source'];
}

export interface SemanticDataflowIRLineage {
  readonly producer: SemanticDataflowLineageProducer;
  readonly identity: string;
  readonly source: SemanticDataflowIdentity['source'];
}

export interface SemanticDataflowIRRelation {
  readonly kind: SemanticDataflowIRRelationKind;
  readonly source: string;
  readonly target: string;
  readonly role?: Extract<SemanticDataflowFact, { kind: 'dependency' | 'value_flow' }>['role'];
  readonly guards?: readonly string[];
  /** Producer provenance is conserved as an IR-local projection, not re-derived in IR. */
  readonly lineage?: SemanticDataflowIRLineage;
}

export interface SemanticDataflowIRProjection {
  readonly kind: 'semantic_dataflow_ir_projection';
  readonly authority: 'semantic_dataflow_judgment';
  readonly fixedPoint: 'least_fixed_point';
  readonly origin: SemanticDataflowOrigin;
  readonly nodes: readonly SemanticDataflowIRNode[];
  readonly relations: readonly SemanticDataflowIRRelation[];
  readonly closed: true;
}
