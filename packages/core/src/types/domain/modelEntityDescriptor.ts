/**
 * Immutable descriptors for canonical model/resource semantic contracts.
 */
import type { FieldNode } from '../field';
import type { ModelName, PropertyName, SourceFilePath, SourceLineNumber, TypeExpression } from '../ir/nominalVocabulary';
import type {
  ResourceDefContract,
  ResourceDef,
  ModelDefContract,
  ModelDef,
  ModelSemanticDefinitionContract
} from './modelEntityDefinition';

export class ResourceDefDescriptor implements ResourceDefContract {
  public readonly name: ModelName;
  public readonly model: ModelName;
  public readonly fields: readonly (readonly [PropertyName, FieldNode])[];
  public readonly assignments: readonly (readonly [PropertyName, TypeExpression])[];
  public readonly sourceFile: SourceFilePath;
  public readonly sourceLine: SourceLineNumber;

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
    return new ResourceDefDescriptor({
      name: def.name,
      model: def.model,
      fields: Object.freeze([...def.fields]),
      assignments: Object.freeze([...def.assignments]),
      sourceFile: def.sourceFile,
      sourceLine: def.sourceLine
    });
  }
}

export class ModelSemanticDefinitionDescriptor implements ModelSemanticDefinitionContract {
  public readonly identity: ModelSemanticDefinitionContract['identity'];
  public readonly key: ModelSemanticDefinitionContract['key'];
  public readonly behavior: ModelSemanticDefinitionContract['behavior'];
  public readonly exposure: ModelSemanticDefinitionContract['exposure'];
  public readonly surface: ModelSemanticDefinitionContract['surface'];
  public readonly columnFacts: ModelSemanticDefinitionContract['columnFacts'];

  constructor(params: ModelSemanticDefinitionContract) {
    this.identity = Object.freeze(params.identity);
    this.key = Object.freeze(params.key);
    this.behavior = Object.freeze(params.behavior);
    this.exposure = Object.freeze({
      fillable: Object.freeze([...params.exposure.fillable]),
      guarded: Object.freeze([...params.exposure.guarded]),
      hidden: Object.freeze([...params.exposure.hidden]),
      appends: Object.freeze([...params.exposure.appends])
    });
    this.columnFacts = Object.freeze([...params.columnFacts]);
    this.surface = Object.freeze({
      properties: Object.freeze([...params.surface.properties]),
      byName: params.surface.byName,
      relationsByName: params.surface.relationsByName
    });
    Object.freeze(this);
  }
}

/** Compatibility name, now backed by the canonical semantic model. */
export class ModelDefDescriptor extends ModelSemanticDefinitionDescriptor implements ModelDefContract {
  static fromModelDef(def: ModelDef): ModelDefDescriptor {
    return new ModelDefDescriptor(def);
  }
}
