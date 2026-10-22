/**
 * Closed query-policy contract materialized before Runtime execution.
 *
 * Producer-domain selection belongs to the upstream policy materializer. Runtime
 * receives the already-selected source/sink facts and must not reclassify facts
 * by producer, infer source/sink roles, or rebuild semantic closure.
 */
import type {
  SemanticDataflowFact,
  SemanticDataflowLineageProducer,
  SemanticDataflowIdentity,
  SemanticDataflowJudgment,
} from './semanticDataflow';
import { semanticDataflowIdentityEqual, semanticDataflowIdentityKey } from './semanticDataflow';

export interface SemanticDataflowQueryPolicyIntent {
  readonly kind: 'semantic_dataflow_query_policy_intent';
  readonly sourceProducers: readonly SemanticDataflowLineageProducer[];
  readonly sinkProducers: readonly SemanticDataflowLineageProducer[];
  /** Explicit policy capabilities; omitted intent fields materialize to closed empty sets. */
  readonly additionalFlowSteps?: readonly Readonly<{ source: SemanticDataflowIdentity; target: SemanticDataflowIdentity }>[];
  readonly barrierNodes?: readonly SemanticDataflowIdentity[];
  readonly closed: true;
}

export interface SemanticDataflowQueryPolicyContract {
  readonly kind: 'semantic_dataflow_query_policy_contract';
  /** Contract-local version, independent from the package/manifest version. */
  readonly contractVersion: 1;
  readonly judgmentNode: SemanticDataflowIdentity;
  readonly sourceFacts: readonly SemanticDataflowFact[];
  readonly sinkFacts: readonly SemanticDataflowFact[];
  readonly selectedFacts: readonly SemanticDataflowFact[];
  readonly additionalFlowSteps: readonly Readonly<{ source: SemanticDataflowIdentity; target: SemanticDataflowIdentity }>[];
  readonly barrierNodes: readonly SemanticDataflowIdentity[];
  readonly closed: true;
}

const includesProducer = (
  fact: SemanticDataflowFact,
  producers: readonly SemanticDataflowLineageProducer[],
): boolean => fact.kind !== 'reaches'
  && fact.lineage !== undefined
  && producers.some(producer => producer === fact.lineage?.producer);

const identityKey = (identity: SemanticDataflowIdentity): string => {
  const key = semanticDataflowIdentityKey(identity);
  return JSON.stringify([key.file.value, key.start, key.end, key.role, key.slot.value]);
};

/** Stable semantic fact key survives JSON serialization/deserialization. */
export const semanticDataflowFactContractKey = (fact: SemanticDataflowFact): string => {
  if (fact.kind === 'reaches') return JSON.stringify(['reaches', identityKey(fact.source), identityKey(fact.target)]);
  return JSON.stringify([
    fact.kind,
    identityKey(fact.source),
    identityKey(fact.target),
    fact.role,
    fact.guard ? [identityKey(fact.guard.predicate), fact.guard.polarity] : null,
    fact.lineage ? [fact.lineage.producer, identityKey(fact.lineage.identity), fact.lineage.closed] : null,
  ]);
};

const uniqueFacts = (facts: readonly SemanticDataflowFact[]): readonly SemanticDataflowFact[] => {
  const seen = new Set<string>();
  return Object.freeze(facts.filter(fact => {
    const key = semanticDataflowFactContractKey(fact);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
};

/** Upstream materialization: producer policy is resolved once into a closed contract. */
export const materializeSemanticDataflowQueryPolicy = (
  judgment: SemanticDataflowJudgment,
  intent: SemanticDataflowQueryPolicyIntent,
): SemanticDataflowQueryPolicyContract => {
  const sourceFacts = Object.freeze(judgment.facts.filter(fact => includesProducer(fact, intent.sourceProducers)));
  const sinkFacts = Object.freeze(judgment.facts.filter(fact => includesProducer(fact, intent.sinkProducers)));
  return Object.freeze({
    kind: 'semantic_dataflow_query_policy_contract',
    contractVersion: 1,
    judgmentNode: judgment.node,
    sourceFacts,
    sinkFacts,
    selectedFacts: uniqueFacts([...sourceFacts, ...sinkFacts]),
    additionalFlowSteps: Object.freeze([...(intent.additionalFlowSteps ?? [])].map(step => Object.freeze({ source: step.source, target: step.target }))),
    barrierNodes: Object.freeze([...(intent.barrierNodes ?? [])]),
    closed: true,
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringValueShape = (value: unknown): boolean => isRecord(value)
  && value.kind === 'string_value'
  && typeof value.value === 'string';

const entityRoles = new Set<string>([
  'variable', 'value', 'operator', 'comparison', 'binary-operation', 'unary-operation',
  'predicate', 'merge', 'match', 'outcome', 'assignment', 'binding', 'reference',
  'callable', 'invocation', 'access', 'cast', 'array', 'static-invocation',
  'construction', 'type-check', 'class-reference', 'class-constant', 'resource-access',
  'interpolated-string', 'magic-constant', 'closure', 'arrow-function', 'anonymous-class',
  'unsupported-expression', 'emission', 'include', 'unset', 'region', 'exception-handler',
  'exception', 'scope',
]);

const factRoles = new Set<string>([
  'operator', 'operand_left', 'operand_right', 'operand', 'receiver', 'index', 'part',
  'argument', 'callable', 'array_key', 'array_value', 'class_expression', 'value',
  'predicate', 'alternative', 'subject', 'candidate', 'body', 'initializer', 'update',
  'iterable', 'target', 'binding', 'emitted_value', 'exception_type', 'handler',
  'finally_block', 'member', 'availability',
]);

const isSourceSpanShape = (value: unknown): boolean => {
  if (!isRecord(value) || value.kind !== 'source_span') return false;
  const file = value.file;
  const start = value.start;
  const end = value.end;
  return isRecord(file) && file.kind === 'source_file' && isStringValueShape(file.value)
    && isRecord(start) && start.kind === 'number_value' && typeof start.value === 'number' && Number.isFinite(start.value)
    && isRecord(end) && end.kind === 'number_value' && typeof end.value === 'number' && Number.isFinite(end.value)
    && start.value <= end.value;
};

const isIdentityShape = (value: unknown): value is SemanticDataflowIdentity => {
  if (!isRecord(value) || value.kind !== 'semantic_dataflow_identity' || typeof value.role !== 'string' || !entityRoles.has(value.role) || !isStringValueShape(value.slot)) return false;
  return isSourceSpanShape(value.source);
};

const isFactShape = (value: unknown): value is SemanticDataflowFact => {
  if (!isRecord(value) || !['dependency', 'value_flow', 'reaches'].includes(String(value.kind))) return false;
  if (!isIdentityShape(value.source) || !isIdentityShape(value.target)) return false;
  if (value.kind === 'reaches') return true;
  if (typeof value.role !== 'string' || !factRoles.has(value.role)) return false;
  if (value.guard !== undefined) {
    if (!isRecord(value.guard) || !isIdentityShape(value.guard.predicate)
      || (value.guard.polarity !== 'satisfied' && value.guard.polarity !== 'unsatisfied')) return false;
  }
  if (value.lineage !== undefined) {
    const lineage = value.lineage;
    if (!isRecord(lineage) || lineage.kind !== 'semantic_dataflow_fact_lineage'
      || !['request', 'route', 'controller', 'resource'].includes(String(lineage.producer))
      || !isIdentityShape(lineage.identity) || lineage.closed !== true
      || !isSourceSpanShape(lineage.source)) return false;
  }
  return true;
};

const isIdentityArray = (value: unknown): value is readonly SemanticDataflowIdentity[] =>
  Array.isArray(value) && value.every(isIdentityShape);

/**
 * Runtime-safe structural gate. TypeScript annotations are erased, so a caller
 * can still pass malformed JSON at runtime despite a static contract type.
 */
const isContractShape = (value: unknown): value is SemanticDataflowQueryPolicyContract =>
  isRecord(value)
  && value.kind === 'semantic_dataflow_query_policy_contract'
  && value.contractVersion === 1
  && value.closed === true
  && isIdentityShape(value.judgmentNode)
  && Array.isArray(value.sourceFacts) && value.sourceFacts.every(isFactShape)
  && Array.isArray(value.sinkFacts) && value.sinkFacts.every(isFactShape)
  && Array.isArray(value.selectedFacts) && value.selectedFacts.every(isFactShape)
  && Array.isArray(value.additionalFlowSteps) && value.additionalFlowSteps.every(step =>
    isRecord(step) && isIdentityShape(step.source) && isIdentityShape(step.target))
  && isIdentityArray(value.barrierNodes);

/** Validate actual runtime shape and closed semantic invariants before execution. */
export const validateSemanticDataflowQueryPolicyContract = (
  candidate: unknown,
  judgment: SemanticDataflowJudgment,
): candidate is SemanticDataflowQueryPolicyContract => {
  if (!isContractShape(candidate)) return false;
  const contract = candidate;
  if (!semanticDataflowIdentityEqual(contract.judgmentNode, judgment.node)) return false;
  const judgmentFacts = new Set(judgment.facts.map(semanticDataflowFactContractKey));
  const selectedKeys = contract.selectedFacts.map(semanticDataflowFactContractKey);
  const selected = new Set(selectedKeys);
  if (selected.size !== selectedKeys.length) return false;
  if (contract.selectedFacts.some(fact => !judgmentFacts.has(semanticDataflowFactContractKey(fact)))) return false;
  if ([...contract.sourceFacts, ...contract.sinkFacts].some(fact => !judgmentFacts.has(semanticDataflowFactContractKey(fact)))) return false;

  const sourceKeys = contract.sourceFacts.map(semanticDataflowFactContractKey);
  const sinkKeys = contract.sinkFacts.map(semanticDataflowFactContractKey);
  if (new Set(sourceKeys).size !== sourceKeys.length || new Set(sinkKeys).size !== sinkKeys.length) return false;
  const expectedSelected = new Set([...sourceKeys, ...sinkKeys]);
  if (expectedSelected.size !== selected.size || [...expectedSelected].some(key => !selected.has(key))) return false;

  const knownIdentities = new Set<string>([identityKey(judgment.node)]);
  for (const fact of [...judgment.facts, ...judgment.closure]) {
    if (fact.kind === 'reaches') {
      knownIdentities.add(identityKey(fact.source));
      knownIdentities.add(identityKey(fact.target));
      continue;
    }
    knownIdentities.add(identityKey(fact.source));
    knownIdentities.add(identityKey(fact.target));
    if (fact.guard) knownIdentities.add(identityKey(fact.guard.predicate));
    if (fact.lineage) knownIdentities.add(identityKey(fact.lineage.identity));
  }
  if (contract.barrierNodes.some(node => !knownIdentities.has(identityKey(node)))) return false;
  const flowStepKeys = contract.additionalFlowSteps.map(step => JSON.stringify([identityKey(step.source), identityKey(step.target)]));
  if (new Set(flowStepKeys).size !== flowStepKeys.length) return false;
  if (contract.additionalFlowSteps.some(step => !knownIdentities.has(identityKey(step.source)) || !knownIdentities.has(identityKey(step.target)))) return false;
  const barrierKeys = contract.barrierNodes.map(identityKey);
  if (new Set(barrierKeys).size !== barrierKeys.length) return false;
  return true;
};

/**
 * Reject executable/non-JSON object shapes before any contract property is read.
 * This prevents accessors and custom prototypes from running code during decoding.
 */
const isJsonDataValue = (value: unknown, ancestors: Set<object> = new Set()): boolean => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (ancestors.has(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) return false;
  } else if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) return false;
  if (Array.isArray(value)) {
    // JSON.stringify converts sparse slots to null and ignores extra array properties.
    // Reject both cases before snapshotting so validation cannot change payload meaning.
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== value.length + 1 || !ownKeys.includes('length')) return false;
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !('value' in descriptor)) return false;
    }
  }
  ancestors.add(value);
  const valid = Reflect.ownKeys(value).every(key => {
    if (typeof key !== 'string') return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !('value' in descriptor) || descriptor.get !== undefined || descriptor.set !== undefined) return false;
    if (Array.isArray(value) && key !== 'length' && !/^(0|[1-9]\d*)$/.test(key)) return false;
    if (key === 'length' && Array.isArray(value)) return true;
    return isJsonDataValue(descriptor.value, ancestors);
  });
  ancestors.delete(value);
  return valid;
};

const deepFreezeRuntimeValue = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach(deepFreezeRuntimeValue);
    Object.freeze(value);
    return;
  }
  if (!isRecord(value)) return;
  Object.values(value).forEach(deepFreezeRuntimeValue);
  Object.freeze(value);
};

/**
 * Decode untrusted serialized/runtime data into an immutable, validated snapshot.
 * The executor receives this snapshot rather than retaining a caller-owned object.
 */
export const decodeSemanticDataflowQueryPolicyContract = (
  candidate: unknown,
  judgment: SemanticDataflowJudgment,
): SemanticDataflowQueryPolicyContract | undefined => {
  if (!isJsonDataValue(candidate) || !validateSemanticDataflowQueryPolicyContract(candidate, judgment)) return undefined;
  try {
    const snapshot: unknown = JSON.parse(JSON.stringify(candidate));
    if (!validateSemanticDataflowQueryPolicyContract(snapshot, judgment)) return undefined;
    deepFreezeRuntimeValue(snapshot);
    return snapshot;
  } catch {
    return undefined;
  }
};

/** Canonical association check; no source/sink classification is performed. */
export const semanticDataflowQueryPolicyMatches = (
  candidate: unknown,
  judgment: SemanticDataflowJudgment,
): boolean => isJsonDataValue(candidate)
  && validateSemanticDataflowQueryPolicyContract(candidate, judgment);
