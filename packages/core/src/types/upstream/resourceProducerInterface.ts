import type { ResourceAst } from './ast';
import type { ResourceDefinition, ResourceField, ResourceWrapping, ResourceCollectionFeatures } from './resource';
import type { SourceSpan } from './provenance';
import type { ResourceName, ClassName, VariableName } from './names';
import type { ModelReference } from './semanticReferences';
import type { TruthValue } from './valueObjects';

/** Producer inputs are evidence-shaped; compiler-owned syntax types are supplied at the wiring boundary. */
export interface ResourceProducerInput<
  Entry extends object,
  Statement extends object,
  Method extends object,
  Property extends object,
  Model extends object,
> {
  readonly resourceName: ResourceName;
  readonly entries: readonly Entry[];
  readonly source: SourceSpan;
  readonly model: Model;
  readonly assignments: readonly Statement[];
  readonly method: Method;
  readonly baseClass: ClassName;
  readonly wrapping: ResourceWrapping;
  readonly requestParameter: VariableName;
  readonly documentationMixins: readonly ModelReference[];
  readonly methods: readonly Method[];
  readonly properties: readonly Property[];
  readonly preserveKeys: TruthValue;
  readonly forceWrapping: TruthValue;
  readonly usesRequestQueryString: TruthValue;
  readonly includesPreviouslyLoadedRelationships: TruthValue;
  readonly jsonAttributes: readonly Entry[];
  readonly jsonRelationships: readonly Entry[];
  readonly collectsResource: ResourceCollectionFeatures['collects'];
}

export interface ResourceFieldProducerInput<Value extends object, Model extends object> {
  readonly entryKey: string;
  readonly value: Value;
  readonly file: string;
  readonly resource: string;
  readonly model: Model;
}

export interface ResourceProducerResult {
  readonly definition: ResourceDefinition;
  readonly ast: ResourceAst;
}

export interface ResourceFieldProductionOperationInterface<Value extends object, Model extends object> {
  readonly produce: (input: ResourceFieldProducerInput<Value, Model>) => ResourceField;
}

/** Existing Resource producer operations have one upstream owner and explicit operation contracts. */
export interface ResourceProducerInterface<
  Entry extends object,
  Statement extends object,
  Method extends object,
  Property extends object,
  Value extends object,
  Model extends object,
> {
  readonly produceField: ResourceFieldProductionOperationInterface<Value, Model>;
  readonly kind: 'laravel_resource_producer';
  readonly contractVersion: 1;
  readonly produceResult: (input: ResourceProducerInput<Entry, Statement, Method, Property, Model>) => ResourceProducerResult;
}
