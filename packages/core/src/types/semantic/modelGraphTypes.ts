/**
 * modelGraphTypes.ts
 *
 * Service-graph model node descriptors, Eloquent cast collections, and dependencies.
 *
 * @module core/types/semantic
 */

import type { ModelSemanticDefinition } from '../upstream/model';
import type { Lookup } from '../upstream/collections';
import type { ColumnName } from '../upstream/names';
import type { CastType } from '../upstream/expression';
import type { ModelColumnFact } from '../upstream/modelSourceFacts';
import type { ModelReference, ResourceReference, ServiceReference } from '../upstream/semanticReferences';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationFirstOption, relationOptionFold } from '../../semantic/kernel/relationalSequence';

export type ExecutionLayer =
  | "controller"
  | "service"
  | "model"
  | "repository";

export type ServiceGraphNodeReference = ModelReference | ResourceReference | ServiceReference;

export interface ServiceDependency {
  readonly from: ServiceGraphNodeReference;
  readonly to: ServiceGraphNodeReference;
  readonly type: "calls" | "composes" | "depends_on_model" | "uses_repository";
  readonly weight: number;
}



export interface ModelCastEntry {
  readonly column: ColumnName;
  readonly castType: CastType;
}

export class ModelCastCollection implements Iterable<ModelCastEntry> {
  public readonly casts: readonly ModelCastEntry[];


  constructor(casts: readonly ModelCastEntry[]) {
    this.casts = Object.freeze([...casts]);
    Object.freeze(this);
  }

  public static empty(): ModelCastCollection {
    return new ModelCastCollection([]);
  }

  public lookup(column: ColumnName): Lookup<ModelCastEntry> {
    return relationOptionFold(
      relationFirstOption(this.casts, cast => relationEqual(cast.column.value.value, column.value.value)),
      () => ({ kind: 'missing' }),
      value => ({ kind: 'found', value }),
    );
  }

  public has(column: ColumnName): boolean { return relationOptionFold(relationFirstOption(this.casts, cast => relationEqual(cast.column.value.value, column.value.value)), () => false, () => true); }
  public get size(): number { return this.casts.length; }
  public [Symbol.iterator](): Iterator<ModelCastEntry> { return this.casts[Symbol.iterator](); }
}

export interface ServiceModelNode {
  readonly kind: "model_node";
  readonly model: ModelSemanticDefinition;
  readonly layer: "model";
}

