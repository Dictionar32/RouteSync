/**
 * modelEntityDescriptor.ts
 *
 * First-Class Level 7 ADT Descriptors & Semantic Factories for ModelDef & ResourceDef.
 * Enforces 0 undefined, 0 null, 0 ?: and Object.freeze immutability.
 *
 * @module core/types/domain/modelEntityDescriptor
 */

import {
  type ResourceDefContract,
  type ResourceDef,
  type ModelDefContract,
  type ModelDef,
  type ColumnDefinitionContract,
  type ModelRelationDefinitionContract
} from './modelEntityDefinition';

export class ResourceDefDescriptor implements ResourceDefContract {
  public readonly name: string;
  public readonly model: string;
  public readonly fields: readonly (readonly [string, any])[];
  public readonly assignments: readonly (readonly [string, string])[];
  public readonly sourceFile: string;
  public readonly sourceLine: number;

  constructor(params: ResourceDefContract) {
    this.name = params.name;
    this.model = params.model;
    this.fields = params.fields;
    this.assignments = params.assignments;
    this.sourceFile = params.sourceFile;
    this.sourceLine = params.sourceLine;
    Object.freeze(this);
  }

  static fromResourceDef(def: ResourceDef): ResourceDefDescriptor {
    const fields = def.fields
      ? Object.freeze(Object.entries(def.fields).map(([k, v]) => Object.freeze([k, v] as const)))
      : Object.freeze([]);
    const assignments = def.assignments
      ? Object.freeze(Object.entries(def.assignments).map(([k, v]) => Object.freeze([k, v] as const)))
      : Object.freeze([]);

    return new ResourceDefDescriptor({
      name: def.name,
      model: def.model ?? '',
      fields,
      assignments,
      sourceFile: def.sourceFile ?? '',
      sourceLine: def.sourceLine ?? 1
    });
  }
}

export class ModelDefDescriptor implements ModelDefContract {
  public readonly name: string;
  public readonly table: string;
  public readonly columns: readonly ColumnDefinitionContract[];
  public readonly hidden: readonly string[];
  public readonly appends: readonly string[];
  public readonly casts: readonly (readonly [string, string])[];
  public readonly relations: readonly (readonly [string, ModelRelationDefinitionContract])[];
  public readonly accessors: readonly (readonly [string, any])[];

  constructor(params: ModelDefContract) {
    this.name = params.name;
    this.table = params.table;
    this.columns = params.columns;
    this.hidden = params.hidden;
    this.appends = params.appends;
    this.casts = params.casts;
    this.relations = params.relations;
    this.accessors = params.accessors;
    Object.freeze(this);
  }

  static fromModelDef(def: ModelDef): ModelDefDescriptor {
    const columns = def.columns
      ? Object.freeze(def.columns.map(c => Object.freeze({ name: c.name, type: c.type, nullable: Boolean(c.nullable) })))
      : Object.freeze([]);
    const toEntries = <T>(rec?: Record<string, T>) => rec ? Object.freeze(Object.entries(rec).map(([k, v]) => Object.freeze([k, v] as const))) : Object.freeze([]);

    return new ModelDefDescriptor({
      name: def.name,
      table: def.table ?? '',
      columns,
      hidden: Object.freeze([...(def.hidden ?? [])]),
      appends: Object.freeze([...(def.appends ?? [])]),
      casts: toEntries(def.casts),
      relations: toEntries(def.relations),
      accessors: toEntries(def.accessors)
    });
  }
}
