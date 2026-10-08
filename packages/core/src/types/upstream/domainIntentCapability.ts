/**
 * Closed upstream domain-intent capability.
 *
 * The capability is the semantic boundary for domain-intent behavior. Runtime
 * consumers receive only the already-normalized capability reference; they do
 * not classify intent kinds, discover operation aliases, or parse operation IDs.
 */
import { semanticReasoningContract } from './semanticReasoning';
import type { SemanticCapabilityEvidence, SemanticCapabilityContractInterface } from './semanticCapability';

export type DomainIntentCapabilityKind = 'domain_intent_capability';
export type DomainIntentKind = 'aggregate_collection' | 'generic';

export interface DomainIntentCapabilityEvidence extends SemanticCapabilityEvidence {
  readonly kind: 'domain_intent_capability_evidence';
  readonly source: 'frontend_domain_configuration';
}

export interface DomainIntentOperationReference {
  readonly operationId: string;
  readonly resource: string;
  readonly action: string;
}

export interface AggregateCollectionIntentCapability {
  readonly kind: 'aggregate_collection';
  readonly operations: {
    readonly createItem: DomainIntentOperationReference;
    readonly updateItem: DomainIntentOperationReference;
    readonly removeItem: DomainIntentOperationReference;
    readonly applyPromo: DomainIntentOperationReference;
    readonly removePromo: DomainIntentOperationReference;
  };
  readonly fields: {
    readonly collectionField: string;
    readonly identityField: string;
    readonly quantityField: string;
    readonly promotionCodeField: string;
  };
}

export interface GenericDomainIntentCapability {
  readonly kind: 'generic';
}

export interface DomainIntentCapabilityAlgebraInterface
  extends SemanticCapabilityContractInterface<
    DomainIntentCapabilityKind,
    DomainIntentCapabilityEvidence,
    string
  > {
  readonly domainName: string;
  readonly intentKind: DomainIntentKind;
  readonly aggregateCollection: AggregateCollectionIntentCapability | undefined;
}

export interface DomainIntentCapabilityContract extends DomainIntentCapabilityAlgebraInterface {}
export interface DomainIntentCapabilityInterface extends DomainIntentCapabilityContract {}
export interface DomainIntentCapabilityConsumerInterface extends DomainIntentCapabilityInterface {}

/** Runtime-safe downstream projection. Proof/evidence remains upstream-only. */
export interface DomainIntentCapabilityReference {
  readonly kind: DomainIntentCapabilityKind;
  readonly authority: 'upstream';
  readonly identity: string;
  readonly domainName: string;
  readonly intentKind: DomainIntentKind;
  readonly aggregateCollection: AggregateCollectionIntentCapability | undefined;
  readonly closed: true;
}

export function domainIntentCapabilityReferenceFromCapability(
  capability: DomainIntentCapabilityContract,
): DomainIntentCapabilityReference {
  return Object.freeze({
    kind: capability.kind,
    authority: capability.authority,
    identity: capability.identity,
    domainName: capability.domainName,
    intentKind: capability.intentKind,
    aggregateCollection: capability.aggregateCollection,
    closed: true as const,
  });
}

interface RecordLike {
  readonly [key: string]: unknown;
}

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: RecordLike, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const readOperationReference = (value: unknown): DomainIntentOperationReference | undefined => {
  const operationId = typeof value === 'string'
    ? stringValue(value)
    : isRecord(value)
      ? stringValue(value.operationId)
      : undefined;
  if (!operationId) return undefined;

  if (isRecord(value) && typeof value.resource === 'string' && typeof value.action === 'string') {
    return { operationId, resource: value.resource, action: value.action };
  }

  const separator = operationId.indexOf('.');
  if (separator <= 0 || separator === operationId.length - 1) return undefined;
  return {
    operationId,
    resource: operationId.slice(0, separator),
    action: operationId.slice(separator + 1),
  };
};

const operation = (source: RecordLike, ...keys: readonly string[]): DomainIntentOperationReference | undefined => {
  for (const key of keys) {
    const value = readOperationReference(source[key]);
    if (value) return value;
  }
  return undefined;
};

const field = (source: RecordLike, ...keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const value = stringValue(source[key]);
    if (value) return value;
  }
  return undefined;
};

/**
 * Semantic authority for runtime/frontend domain intent configuration.
 * Missing required AggregateCollection evidence fails closed instead of
 * reconstructing a partial intent downstream.
 */
export function domainIntentCapabilityFromRuntimeConfig(
  domainName: string,
  input: unknown,
): DomainIntentCapabilityContract | undefined {
  if (!isRecord(input)) return undefined;

  const type = stringValue(input.type);
  const isAggregateCollection = type === 'AggregateCollection' || type === 'cart';
  if (!isAggregateCollection) {
    return Object.freeze({
      kind: 'domain_intent_capability' as const,
      authority: 'upstream' as const,
      identity: domainName,
      domainName,
      intentKind: 'generic' as const,
      aggregateCollection: undefined,
      evidence: Object.freeze({
        kind: 'domain_intent_capability_evidence' as const,
        source: 'frontend_domain_configuration' as const,
        closed: true as const,
      }),
      derivation: Object.freeze({
        kind: 'semantic_capability_derivation' as const,
        strategy: 'evidence_resolution' as const,
        closed: true as const,
      }),
      provenance: Object.freeze({
        kind: 'semantic_capability_provenance' as const,
        lane: 'upstream' as const,
        closed: true as const,
      }),
      closed: true as const,
      strategy: 'evidence_resolution' as const,
      reasoning: semanticReasoningContract('evidence_resolution'),
    });
  }

  const operationsSource = isRecord(input.capabilities)
    ? input.capabilities
    : isRecord(input.operations)
      ? input.operations
      : undefined;
  const configSource = isRecord(input.config) ? input.config : undefined;
  if (!operationsSource || !configSource) return undefined;

  const items = isRecord(operationsSource.items) ? operationsSource.items : undefined;
  const promotion = isRecord(operationsSource.promotion) ? operationsSource.promotion : undefined;
  if (!items || !promotion) return undefined;

  const createItem = operation(items, 'create') ?? operation(operationsSource, 'createItem');
  const updateItem = operation(items, 'update') ?? operation(operationsSource, 'updateItem');
  const removeItem = operation(items, 'remove') ?? operation(operationsSource, 'removeItem');
  const applyPromo = operation(promotion, 'apply') ?? operation(operationsSource, 'applyPromo');
  const removePromo = operation(promotion, 'remove') ?? operation(operationsSource, 'removePromo');

  const collectionField = field(configSource, 'collectionField', 'itemsField');
  const identityField = field(configSource, 'identityField', 'itemKey');
  const quantityField = field(configSource, 'quantityField', 'qtyField');
  const promotionCodeField = field(configSource, 'promotionCodeField', 'promoKey');

  if (!createItem || !updateItem || !removeItem || !applyPromo || !removePromo ||
      !collectionField || !identityField || !quantityField || !promotionCodeField) {
    return undefined;
  }

  return Object.freeze({
    kind: 'domain_intent_capability' as const,
    authority: 'upstream' as const,
    identity: domainName,
    domainName,
    intentKind: 'aggregate_collection' as const,
    aggregateCollection: Object.freeze({
      kind: 'aggregate_collection' as const,
      operations: Object.freeze({ createItem, updateItem, removeItem, applyPromo, removePromo }),
      fields: Object.freeze({ collectionField, identityField, quantityField, promotionCodeField }),
    }),
    evidence: Object.freeze({
      kind: 'domain_intent_capability_evidence' as const,
      source: 'frontend_domain_configuration' as const,
      closed: true as const,
    }),
    derivation: Object.freeze({
      kind: 'semantic_capability_derivation' as const,
      strategy: 'evidence_resolution' as const,
      closed: true as const,
    }),
    provenance: Object.freeze({
      kind: 'semantic_capability_provenance' as const,
      lane: 'upstream' as const,
      closed: true as const,
    }),
    closed: true as const,
    strategy: 'evidence_resolution' as const,
    reasoning: semanticReasoningContract('evidence_resolution'),
  });
}


/**
 * Resolve all configured domain intents once at the upstream boundary.
 * The returned map is a projection-friendly closed capability surface.
 */
export function domainIntentCapabilitiesFromFrontend(
  frontend: unknown,
): Readonly<Record<string, DomainIntentCapabilityReference>> {
  const capabilities: Record<string, DomainIntentCapabilityReference> = {};
  if (!isRecord(frontend) || !hasOwn(frontend, 'domains')) return Object.freeze(capabilities);

  const domains = frontend.domains;
  if (isRecord(domains)) {
    for (const [domainName, intent] of Object.entries(domains)) {
      const capability = domainIntentCapabilityFromRuntimeConfig(domainName, intent);
      if (capability) capabilities[domainName] = domainIntentCapabilityReferenceFromCapability(capability);
    }
    return Object.freeze(capabilities);
  }

  if (Array.isArray(domains)) {
    for (const domain of domains) {
      if (!isRecord(domain) || !isRecord(domain.name) || !isRecord(domain.name.value)) continue;
      const domainName = stringValue(domain.name.value.value);
      if (!domainName) continue;
      const capability = domainIntentCapabilityFromRuntimeConfig(domainName, domain.intent);
      if (capability) capabilities[domainName] = domainIntentCapabilityReferenceFromCapability(capability);
    }
  }

  return Object.freeze(capabilities);
}
