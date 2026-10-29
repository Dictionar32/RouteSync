/**
 * Source-occurrence law guard for the canonical upstream proof verifier.
 *
 * This operation does not implement the other derivation laws and never claims
 * a complete proof is valid on its own. It decorates an existing
 * RequestTypeDerivationProofVerificationInterface: source-occurrence violations
 * are returned as canonical verification counterexamples; otherwise the same
 * inference packet is passed to the complete verifier.
 */
import type {
  RequestTypeDerivationInput,
  RequestTypeDerivationSemanticInputPreparation,
  RequestTypeDerivationLawId,
  RequestTypeDerivationProofVerificationInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
  RequestTypeDerivationVerification,
  RequestTypeDerivationVerificationFailure,
  RequestTypeEvidenceKey,
  RequestTypeNonEmptyLedger,
  RequestTypeEvidenceReference,
  RequestTypeResourceEvidenceReference,
  RequestTypeCanonicalResourceIdentity,
  RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence,
  RequestTypeDuplicateOccurrenceLocationFailureEvidence,
  RequestTypeDuplicateIdentityWitness,
  RequestTypeSourceOccurrenceKeyMismatch,
  RequestTypeRouteEvidenceKey,
  RequestTypeResourceEvidenceKey,
  RequestTypeRequestEvidenceKey,
  RequestTypeSourceOccurrenceLocation,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';
import { sourceSpanOperations } from '../../../types/upstream/provenance';

const SOURCE_OCCURRENCE_LAWS: readonly RequestTypeDerivationLawId[] = Object.freeze([
  'evidence_key_matches_source_domain',
  'resource_identity_is_canonical',
  'source_evidence_inventory_matches_input',
  'duplicate_occurrences_match_collision_key',
  'duplicate_occurrences_are_distinct_source_locations',
  'all_duplicate_occurrence_locations_are_pairwise_distinct',
  'source_occurrence_key_matches_source_coordinates',
  'source_occurrence_location_matches_evidence',
  'source_occurrence_belongs_to_input',
]);

const SOURCE_DOMAINS: readonly ('routes' | 'resources' | 'requests')[] = Object.freeze([
  'routes', 'resources', 'requests',
]);

type SourceOccurrenceViolation =
  | Readonly<{
      readonly kind: 'key_mismatch';
      readonly mismatch: RequestTypeSourceOccurrenceKeyMismatch;
    }>
  | Readonly<{
      readonly kind: 'semantic_key_mismatch';
      readonly source: Exclude<RequestTypeEvidenceReference, RequestTypeResourceEvidenceReference>;
    }>
  | Readonly<{
      readonly kind: 'resource_identity_mismatch';
      readonly source: RequestTypeResourceEvidenceReference;
      readonly expected: RequestTypeCanonicalResourceIdentity;
    }>
  | Readonly<{
      readonly kind: 'location_mismatch';
      readonly source: RequestTypeEvidenceReference;
      readonly expected: RequestTypeSourceOccurrenceLocation;
    }>
  | Readonly<{
      readonly kind: 'source_not_in_input';
      readonly source: RequestTypeEvidenceReference;
      readonly candidateLocations: readonly RequestTypeSourceOccurrenceLocation[];
    }>
  | Readonly<{
      readonly kind: 'inventory_mismatch';
      readonly domain: 'routes' | 'resources' | 'requests';
      readonly expectedKeys: readonly RequestTypeEvidenceKey[];
      readonly actualKeys: readonly RequestTypeEvidenceKey[];
    }>
  | Readonly<{
      readonly kind: 'duplicate_occurrence';
      readonly evidence: RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence;
    }>
  | Readonly<{
      readonly kind: 'duplicate_collision_key_mismatch';
      readonly evidence: Readonly<{
        readonly domain: RequestTypeDuplicateIdentityWitness['domain'];
        readonly semanticKey: RequestTypeEvidenceKey;
        readonly occurrences: readonly RequestTypeEvidenceReference[];
        readonly mismatchedOccurrences: readonly RequestTypeEvidenceReference[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'duplicate_location_reused';
      readonly evidence: RequestTypeDuplicateOccurrenceLocationFailureEvidence;
    }>; 

type SourceOccurrenceInputMembership =
  | Readonly<{
      readonly kind: 'source_occurrence_in_input';
      readonly location: RequestTypeSourceOccurrenceLocation;
    }>
  | Readonly<{
      readonly kind: 'source_occurrence_not_in_input';
      readonly candidateLocations: readonly RequestTypeSourceOccurrenceLocation[];
    }>;

const sourceOccurrenceInputMembership = (
  source: RequestTypeEvidenceReference,
  input: RequestTypeDerivationInput,
): SourceOccurrenceInputMembership => {
  switch (source.source.kind) {
    case 'route': {
      const sourceSpan = source.source.provenance.declarationSpan;
      const sourceFile = source.source.provenance.sourceFile.value.value;
      const sourceLine = source.source.provenance.sourceLine.value;
      const expectedIdentity = source.canonicalIdentity;
      const route = input.routes.find(candidate => {
        const identity = requestTypeDerivationSourceEvidenceInventory.canonicalRouteIdentity(candidate.identity);
        const span = candidate.provenance.declarationSpan;
        return expectedIdentity.kind === 'canonical_route_identity'
          && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRouteIdentity(identity, expectedIdentity).kind === 'canonical_route_identity_equivalent'
          && candidate.provenance.sourceFile.value.value === sourceFile
          && candidate.provenance.sourceLine.value === sourceLine
          && sourceSpanOperations.same(span, sourceSpan).kind === 'same_source_span';
      });
      return route === undefined
        ? Object.freeze({ kind: 'source_occurrence_not_in_input', candidateLocations: inputCandidateLocations(input, source) })
        : Object.freeze({
            kind: 'source_occurrence_in_input',
            location: Object.freeze({
              kind: 'route_declaration_location',
              file: route.provenance.sourceFile,
              line: route.provenance.sourceLine,
              span: route.provenance.declarationSpan,
            }),
          });
    }
    case 'resource': {
      const sourceSpan = source.source.source;
      const expectedIdentity = source.canonicalIdentity;
      const resource = input.resources.find(candidate => {
        const identity = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(candidate.definition.name);
        return expectedIdentity.kind === 'canonical_resource_identity'
          && requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(identity, expectedIdentity).kind === 'canonical_resource_identity_equivalent'
          && sourceSpanOperations.same(candidate.source, sourceSpan).kind === 'same_source_span';
      });
      return resource === undefined
        ? Object.freeze({ kind: 'source_occurrence_not_in_input', candidateLocations: inputCandidateLocations(input, source) })
        : Object.freeze({ kind: 'source_occurrence_in_input', location: Object.freeze({ kind: 'source_span_location', span: resource.source }) });
    }
    case 'request': {
      const sourceSpan = source.source.source;
      const expectedIdentity = source.canonicalIdentity;
      const request = input.requests.find(candidate => {
        const identity = requestTypeDerivationSourceEvidenceInventory.canonicalRequestIdentity(candidate.definition.identity);
        return expectedIdentity.kind === 'canonical_request_identity'
          && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRequestIdentity(identity, expectedIdentity).kind === 'canonical_request_identity_equivalent'
          && sourceSpanOperations.same(candidate.source, sourceSpan).kind === 'same_source_span';
      });
      return request === undefined
        ? Object.freeze({ kind: 'source_occurrence_not_in_input', candidateLocations: inputCandidateLocations(input, source) })
        : Object.freeze({ kind: 'source_occurrence_in_input', location: Object.freeze({ kind: 'source_span_location', span: request.source }) });
    }
    default: {
      const exhaustive: never = source.source;
      return exhaustive;
    }
  }
};

const semanticKeyMatchesSourceIdentity = (source: RequestTypeEvidenceReference): boolean => {
  switch (source.source.kind) {
    case 'route': {
      const canonical = requestTypeDerivationSourceEvidenceInventory.canonicalRouteIdentity(source.source.identity);
      return source.canonicalIdentity.kind === canonical.kind
        && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRouteIdentity(source.canonicalIdentity, canonical).kind === 'canonical_route_identity_equivalent'
        && source.semanticKey === canonical.semanticKey;
    }
    case 'resource': {
      const canonical = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(source.source.identity);
      return source.canonicalIdentity.kind === canonical.kind
        && source.canonicalIdentity.canonicalName.value.value === canonical.canonicalName.value.value
        && source.canonicalIdentity.semanticKey === canonical.semanticKey
        && source.semanticKey === canonical.semanticKey;
    }
    case 'request': {
      const canonical = requestTypeDerivationSourceEvidenceInventory.canonicalRequestIdentity(source.source.identity);
      return source.canonicalIdentity.kind === canonical.kind
        && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRequestIdentity(source.canonicalIdentity, canonical).kind === 'canonical_request_identity_equivalent'
        && source.semanticKey === canonical.semanticKey;
    }
    default: {
      const exhaustive: never = source.source;
      return exhaustive;
    }
  }
};

const sameKeyMultiset = (
  expected: readonly RequestTypeEvidenceKey[],
  actual: readonly RequestTypeEvidenceKey[],
): boolean => {
  const expectedSorted = [...expected].sort();
  const actualSorted = [...actual].sort();
  return expectedSorted.length === actualSorted.length
    && expectedSorted.every((key, index) => key === actualSorted[index]);
};

const sameLocation = (
  first: RequestTypeSourceOccurrenceLocation,
  second: RequestTypeSourceOccurrenceLocation,
): boolean => {
  if (first.kind !== second.kind) return false;
  if (first.kind === 'route_declaration_location' && second.kind === 'route_declaration_location') {
    return first.file.value.value === second.file.value.value
      && first.line.value === second.line.value
      && sourceSpanOperations.same(first.span, second.span).kind === 'same_source_span';
  }
  if (first.kind === 'source_span_location' && second.kind === 'source_span_location') {
    return sourceSpanOperations.same(first.span, second.span).kind === 'same_source_span';
  }
  return false;
};

const duplicateRoutePairs = (
  evidence: readonly RequestTypeEvidenceReference[],
): RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence | undefined => {
  const routes = evidence.filter((item): item is Extract<RequestTypeEvidenceReference, { readonly source: { readonly kind: 'route' } }> => item.source.kind === 'route');
  const repeatedPairs = routes.flatMap((first, index) => routes.slice(index + 1).flatMap(second =>
    first.semanticKey === second.semanticKey && sameLocation(first.location, second.location)
      ? [Object.freeze({ first, second, repeatedOccurrenceKey: first.occurrenceKey })]
      : [],
  ));
  const [first, ...remaining] = repeatedPairs;
  if (first === undefined) return undefined;
  const ledger: RequestTypeNonEmptyLedger<typeof first> = [first, ...remaining];
  return Object.freeze({
    domain: 'routes',
    semanticKey: first.first.semanticKey,
    repeatedPairs: Object.freeze(ledger),
  });
};

const duplicateResourcePairs = (
  evidence: readonly RequestTypeEvidenceReference[],
): RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence | undefined => {
  const resources = evidence.filter((item): item is Extract<RequestTypeEvidenceReference, { readonly source: { readonly kind: 'resource' } }> => item.source.kind === 'resource');
  const repeatedPairs = resources.flatMap((first, index) => resources.slice(index + 1).flatMap(second =>
    first.semanticKey === second.semanticKey && sameLocation(first.location, second.location)
      ? [Object.freeze({ first, second, repeatedOccurrenceKey: first.occurrenceKey })]
      : [],
  ));
  const [first, ...remaining] = repeatedPairs;
  if (first === undefined) return undefined;
  const ledger: RequestTypeNonEmptyLedger<typeof first> = [first, ...remaining];
  return Object.freeze({
    domain: 'resources',
    semanticKey: first.first.semanticKey,
    repeatedPairs: Object.freeze(ledger),
  });
};

const duplicateRequestPairs = (
  evidence: readonly RequestTypeEvidenceReference[],
): RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence | undefined => {
  const requests = evidence.filter((item): item is Extract<RequestTypeEvidenceReference, { readonly source: { readonly kind: 'request' } }> => item.source.kind === 'request');
  const repeatedPairs = requests.flatMap((first, index) => requests.slice(index + 1).flatMap(second =>
    first.semanticKey === second.semanticKey && sameLocation(first.location, second.location)
      ? [Object.freeze({ first, second, repeatedOccurrenceKey: first.occurrenceKey })]
      : [],
  ));
  const [first, ...remaining] = repeatedPairs;
  if (first === undefined) return undefined;
  const ledger: RequestTypeNonEmptyLedger<typeof first> = [first, ...remaining];
  return Object.freeze({
    domain: 'requests',
    semanticKey: first.first.semanticKey,
    repeatedPairs: Object.freeze(ledger),
  });
};

const duplicateOccurrenceViolation = (
  evidence: readonly RequestTypeEvidenceReference[],
): SourceOccurrenceViolation | undefined => {
  const duplicate = duplicateRoutePairs(evidence)
    ?? duplicateResourcePairs(evidence)
    ?? duplicateRequestPairs(evidence);
  return duplicate === undefined ? undefined : Object.freeze({ kind: 'duplicate_occurrence', evidence: duplicate });
};

const isRouteEvidenceReference = (evidence: RequestTypeEvidenceReference): evidence is Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeRouteEvidenceKey }> => evidence.source.kind === 'route';
const isResourceEvidenceReference = (evidence: RequestTypeEvidenceReference): evidence is Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeResourceEvidenceKey }> => evidence.source.kind === 'resource';
const isRequestEvidenceReference = (evidence: RequestTypeEvidenceReference): evidence is Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeRequestEvidenceKey }> => evidence.source.kind === 'request';

const keyMismatch = (source: RequestTypeEvidenceReference): RequestTypeSourceOccurrenceKeyMismatch | undefined => {
  if (isRouteEvidenceReference(source)) {
    const expectedOccurrenceKey = requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(source.source.provenance);
    return source.occurrenceKey === expectedOccurrenceKey ? undefined : Object.freeze({
      domain: 'routes', source: source.source, expectedOccurrenceKey, actualOccurrenceKey: source.occurrenceKey,
    });
  }
  if (isResourceEvidenceReference(source)) {
    const expectedOccurrenceKey = requestTypeDerivationSourceEvidenceInventory.canonicalResourceOccurrenceKey(source.source.source);
    return source.occurrenceKey === expectedOccurrenceKey ? undefined : Object.freeze({
      domain: 'resources', source: source.source, expectedOccurrenceKey, actualOccurrenceKey: source.occurrenceKey,
    });
  }
  if (isRequestEvidenceReference(source)) {
    const expectedOccurrenceKey = requestTypeDerivationSourceEvidenceInventory.canonicalRequestOccurrenceKey(source.source.source);
    return source.occurrenceKey === expectedOccurrenceKey ? undefined : Object.freeze({
      domain: 'requests', source: source.source, expectedOccurrenceKey, actualOccurrenceKey: source.occurrenceKey,
    });
  }
  const exhaustive: never = source;
  return exhaustive;
};

const domainPrefix = (domain: 'routes' | 'resources' | 'requests'): string => {
  switch (domain) {
    case 'routes': return 'route:';
    case 'resources': return 'resource:';
    case 'requests': return 'request:';
    default: {
      const exhaustive: never = domain;
      return exhaustive;
    }
  }
};

const domainKeys = (
  keys: readonly RequestTypeEvidenceKey[],
  domain: 'routes' | 'resources' | 'requests',
): readonly RequestTypeEvidenceKey[] => Object.freeze(keys.filter(key => key.startsWith(domainPrefix(domain))));

const inputCandidateLocations = (
  input: RequestTypeDerivationInput,
  source: RequestTypeEvidenceReference,
): readonly RequestTypeSourceOccurrenceLocation[] => {
  switch (source.source.kind) {
    case 'route': {
      const expectedIdentity = source.canonicalIdentity;
      return Object.freeze(input.routes
        .filter(route => expectedIdentity.kind === 'canonical_route_identity' && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRouteIdentity(
          requestTypeDerivationSourceEvidenceInventory.canonicalRouteIdentity(route.identity), expectedIdentity).kind === 'canonical_route_identity_equivalent')
        .map(route => Object.freeze({
          kind: 'route_declaration_location' as const,
          file: route.provenance.sourceFile,
          line: route.provenance.sourceLine,
          span: route.provenance.declarationSpan,
        })));
    }
    case 'resource': {
      const expectedIdentity = source.canonicalIdentity;
      return Object.freeze(input.resources
        .filter(resource => expectedIdentity.kind === 'canonical_resource_identity' && requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(
          requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(resource.definition.name), expectedIdentity).kind === 'canonical_resource_identity_equivalent')
        .map(resource => Object.freeze({ kind: 'source_span_location' as const, span: resource.source })));
    }
    case 'request': {
      const expectedIdentity = source.canonicalIdentity;
      return Object.freeze(input.requests
        .filter(request => expectedIdentity.kind === 'canonical_request_identity' && requestTypeDerivationSourceEvidenceInventory.relateCanonicalRequestIdentity(
          requestTypeDerivationSourceEvidenceInventory.canonicalRequestIdentity(request.definition.identity), expectedIdentity).kind === 'canonical_request_identity_equivalent')
        .map(request => Object.freeze({ kind: 'source_span_location' as const, span: request.source })));
    }
    default: {
      const exhaustive: never = source.source;
      return exhaustive;
    }
  }
};

const witnessOccurrences = (witness: RequestTypeDuplicateIdentityWitness): readonly RequestTypeEvidenceReference[] => Object.freeze([
  witness.occurrences.first,
  witness.occurrences.second,
  ...witness.occurrences.additional,
]);

const evidenceBelongsToDomain = (
  evidence: RequestTypeEvidenceReference,
  domain: RequestTypeDuplicateIdentityWitness['domain'],
): boolean => {
  switch (domain) {
    case 'routes': return evidence.source.kind === 'route';
    case 'resources': return evidence.source.kind === 'resource';
    case 'requests': return evidence.source.kind === 'request';
    default: {
      const exhaustive: never = domain;
      return exhaustive;
    }
  }
};

const duplicateCollisionKeyViolation = (
  preparation: RequestTypeDerivationSemanticInputPreparation,
  evidence: readonly RequestTypeEvidenceReference[],
): SourceOccurrenceViolation | undefined => {
  const witnesses = requestTypeDerivationSourceEvidenceInventory.duplicateIdentityWitnesses(preparation.input);
  for (const witness of witnesses) {
    const expected = witnessOccurrences(witness);
    const expectedOccurrenceKeys = expected.map(item => item.occurrenceKey);
    const actual = evidence.filter(item => evidenceBelongsToDomain(item, witness.domain)
      && expectedOccurrenceKeys.includes(item.occurrenceKey));
    const mismatchedOccurrences = actual.filter(item => item.semanticKey !== witness.semanticKey);
    const occurrenceCoverageMatches = expectedOccurrenceKeys.every(key => actual.some(item => item.occurrenceKey === key));
    if (mismatchedOccurrences.length > 0 || !occurrenceCoverageMatches) {
      return Object.freeze({
        kind: 'duplicate_collision_key_mismatch',
        evidence: Object.freeze({
          domain: witness.domain,
          semanticKey: witness.semanticKey,
          occurrences: Object.freeze(actual),
          mismatchedOccurrences: Object.freeze(mismatchedOccurrences),
        }),
      });
    }
  }
  return undefined;
};

const duplicateLocationsAreDistinct = (
  witness: RequestTypeDuplicateIdentityWitness,
): RequestTypeDuplicateOccurrenceLocationFailureEvidence | undefined => {
  const occurrences = witnessOccurrences(witness);
  const repeatedPair = occurrences.flatMap((first, index) => occurrences.slice(index + 1).flatMap(second =>
    sameLocation(first.location, second.location)
      ? [Object.freeze({ first, second })]
      : [],
  ))[0];
  if (repeatedPair === undefined) return undefined;
  switch (witness.domain) {
    case 'routes':
      if (repeatedPair.first.source.kind !== 'route' || repeatedPair.second.source.kind !== 'route') return undefined;
      return Object.freeze({
        domain: 'routes', semanticKey: witness.semanticKey,
        occurrences: witness.occurrences,
        repeatedOccurrenceKey: repeatedPair.first.occurrenceKey,
      });
    case 'resources':
      if (repeatedPair.first.source.kind !== 'resource' || repeatedPair.second.source.kind !== 'resource') return undefined;
      return Object.freeze({
        domain: 'resources', semanticKey: witness.semanticKey,
        occurrences: witness.occurrences,
        repeatedOccurrenceKey: repeatedPair.first.occurrenceKey,
      });
    case 'requests':
      if (repeatedPair.first.source.kind !== 'request' || repeatedPair.second.source.kind !== 'request') return undefined;
      return Object.freeze({
        domain: 'requests', semanticKey: witness.semanticKey,
        occurrences: witness.occurrences,
        repeatedOccurrenceKey: repeatedPair.first.occurrenceKey,
      });
    default: {
      const exhaustive: never = witness;
      return exhaustive;
    }
  }
};

const duplicateSourceLocationViolation = (
  preparation: RequestTypeDerivationSemanticInputPreparation,
): SourceOccurrenceViolation | undefined => {
  for (const witness of requestTypeDerivationSourceEvidenceInventory.duplicateIdentityWitnesses(preparation.input)) {
    const evidence = duplicateLocationsAreDistinct(witness);
    if (evidence !== undefined) return Object.freeze({ kind: 'duplicate_location_reused', evidence });
  }
  return undefined;
};

const sourceOccurrenceViolations = (
  preparation: RequestTypeDerivationSemanticInputPreparation,
  evidence: readonly RequestTypeEvidenceReference[],
): readonly SourceOccurrenceViolation[] => {
  const input = preparation.input;
  const expectedKeys = requestTypeDerivationSourceEvidenceInventory.evidenceKeys(input);
  const preparedInventoryKeys = Object.freeze([
    ...preparation.inventory.routes.map(item => item.semanticKey),
    ...preparation.inventory.resources.map(item => item.semanticKey),
    ...preparation.inventory.requests.map(item => item.semanticKey),
  ]);
  const preparedSourceEvidenceKeys = Object.freeze(preparation.sourceEvidence.map(item => item.semanticKey));
  const actualKeys = Object.freeze(evidence.map(item => item.semanticKey));
  const inventoryViolations = SOURCE_DOMAINS.flatMap(domain => {
    const expected = domainKeys(expectedKeys, domain);
    const prepared = domainKeys(preparedInventoryKeys, domain);
    const proof = domainKeys(actualKeys, domain);
    const sourceEvidence = domainKeys(preparedSourceEvidenceKeys, domain);
    const inventoryMatchesInput = sameKeyMultiset(expected, prepared);
    const sourceEvidenceMatchesInventory = sameKeyMultiset(prepared, sourceEvidence);
    const proofMatchesInput = sameKeyMultiset(expected, proof);
    return [
      ...(inventoryMatchesInput ? [] : [Object.freeze({ kind: 'inventory_mismatch' as const, domain, expectedKeys: expected, actualKeys: prepared })]),
      ...(sourceEvidenceMatchesInventory ? [] : [Object.freeze({ kind: 'inventory_mismatch' as const, domain, expectedKeys: prepared, actualKeys: sourceEvidence })]),
      ...(proofMatchesInput ? [] : [Object.freeze({ kind: 'inventory_mismatch' as const, domain, expectedKeys: expected, actualKeys: proof })]),
    ];
  });
  const resourceIdentityViolations: readonly SourceOccurrenceViolation[] = evidence
    .filter(isResourceEvidenceReference)
    .flatMap(source => {
      if (semanticKeyMatchesSourceIdentity(source)) return [];
      const expected = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(source.source.identity);
      const violation: SourceOccurrenceViolation = Object.freeze({ kind: 'resource_identity_mismatch', source, expected });
      return [violation];
    });
  const nonResourceIdentityViolations: readonly SourceOccurrenceViolation[] = evidence
    .filter((source): source is Extract<RequestTypeEvidenceReference, { readonly source: { readonly kind: 'route' | 'request' } }> =>
      source.source.kind === 'route' || source.source.kind === 'request',
    )
    .flatMap(source => {
      if (semanticKeyMatchesSourceIdentity(source)) return [];
      const violation: SourceOccurrenceViolation = Object.freeze({ kind: 'semantic_key_mismatch', source });
      return [violation];
    });
  const semanticKeyViolations: readonly SourceOccurrenceViolation[] = Object.freeze([
    ...resourceIdentityViolations,
    ...nonResourceIdentityViolations,
  ]);
  const keyViolations = evidence.flatMap(source => {
    const mismatch = keyMismatch(source);
    if (mismatch === undefined) return [];
    const violation: SourceOccurrenceViolation = Object.freeze({ kind: 'key_mismatch', mismatch });
    return [violation];
  });
  const memberships = evidence.map(source => Object.freeze({ source, membership: sourceOccurrenceInputMembership(source, input) }));
  const sourceMembershipViolations = memberships.flatMap(({ source, membership }) => {
    if (membership.kind === 'source_occurrence_in_input') return [];
    const violation: SourceOccurrenceViolation = Object.freeze({
      kind: 'source_not_in_input',
      source,
      candidateLocations: membership.candidateLocations,
    });
    return [violation];
  });
  const locationViolations = memberships.flatMap(({ source, membership }) => {
    if (membership.kind === 'source_occurrence_not_in_input') return [];
    if (sameLocation(source.location, membership.location)) return [];
    const violation: SourceOccurrenceViolation = Object.freeze({ kind: 'location_mismatch', source, expected: membership.location });
    return [violation];
  });
  const duplicateCollisionKey = duplicateCollisionKeyViolation(preparation, evidence);
  const duplicateSourceLocation = duplicateSourceLocationViolation(preparation);
  const duplicate = duplicateOccurrenceViolation(evidence);
  return Object.freeze([
    ...inventoryViolations,
    ...semanticKeyViolations,
    ...keyViolations,
    ...sourceMembershipViolations,
    ...locationViolations,
    ...(duplicateCollisionKey === undefined ? [] : [duplicateCollisionKey]),
    ...(duplicateSourceLocation === undefined ? [] : [duplicateSourceLocation]),
    ...(duplicate === undefined ? [] : [duplicate]),
  ]);
};

const toCanonicalFailure = (violation: SourceOccurrenceViolation): RequestTypeDerivationVerificationFailure => {
  switch (violation.kind) {
    case 'semantic_key_mismatch':
      return Object.freeze({
        kind: 'invalid',
        law: 'evidence_key_matches_source_domain',
        reason: 'source_key_domain_mismatch',
        evidence: Object.freeze({ sourceKind: violation.source.source.kind, semanticKey: violation.source.semanticKey }),
      });
    case 'resource_identity_mismatch':
      return Object.freeze({
        kind: 'invalid',
        law: 'resource_identity_is_canonical',
        reason: 'resource_canonical_identity_mismatch',
        evidence: Object.freeze({
          resource: violation.source,
          expectedCanonicalIdentity: violation.expected,
          actualCanonicalIdentity: violation.source.canonicalIdentity,
          expectedCanonicalKey: violation.expected.semanticKey,
          actualCanonicalKey: violation.source.semanticKey,
        }),
      });
    case 'key_mismatch': {
      const mismatches: RequestTypeNonEmptyLedger<RequestTypeSourceOccurrenceKeyMismatch> = [violation.mismatch];
      return Object.freeze({
        kind: 'invalid',
        law: 'source_occurrence_key_matches_source_coordinates',
        reason: 'source_occurrence_key_mismatch',
        evidence: Object.freeze({ mismatches: Object.freeze(mismatches) }),
      });
    }
    case 'source_not_in_input':
      return Object.freeze({
        kind: 'invalid',
        law: 'source_occurrence_belongs_to_input',
        reason: 'source_occurrence_not_found_in_input',
        evidence: Object.freeze({ source: violation.source, candidateLocations: violation.candidateLocations }),
      });
    case 'location_mismatch': {
      const mismatch = Object.freeze({
        source: violation.source,
        expectedLocation: violation.expected,
        actualLocation: violation.source.location,
      });
      const mismatches: RequestTypeNonEmptyLedger<typeof mismatch> = [mismatch];
      return Object.freeze({
        kind: 'invalid',
        law: 'source_occurrence_location_matches_evidence',
        reason: 'source_occurrence_location_mismatch',
        evidence: Object.freeze({ mismatches: Object.freeze(mismatches) }),
      });
    }
    case 'inventory_mismatch':
      return Object.freeze({
        kind: 'invalid',
        law: 'source_evidence_inventory_matches_input',
        reason: 'source_inventory_mismatch',
        evidence: Object.freeze({ domain: violation.domain, expectedKeys: violation.expectedKeys, actualKeys: violation.actualKeys }),
      });
    case 'duplicate_collision_key_mismatch':
      return Object.freeze({
        kind: 'invalid',
        law: 'duplicate_occurrences_match_collision_key',
        reason: 'duplicate_occurrence_key_mismatch',
        evidence: violation.evidence,
      });
    case 'duplicate_location_reused':
      return Object.freeze({
        kind: 'invalid',
        law: 'duplicate_occurrences_are_distinct_source_locations',
        reason: 'duplicate_occurrence_location_reused',
        evidence: violation.evidence,
      });
    case 'duplicate_occurrence':
      return Object.freeze({
        kind: 'invalid',
        law: 'all_duplicate_occurrence_locations_are_pairwise_distinct',
        reason: 'duplicate_occurrence_pairwise_location_reused',
        evidence: violation.evidence,
      });
    default: {
      const exhaustive: never = violation;
      return exhaustive;
    }
  }
};

const occurrenceFailure = (
  input: RequestTypeDerivationSemanticInputPreparation,
  evidence: readonly RequestTypeEvidenceReference[],
): RequestTypeDerivationVerificationFailure | undefined => {
  const [first] = sourceOccurrenceViolations(input, evidence);
  if (first === undefined) return undefined;
  return toCanonicalFailure(first);
};

/**
 * Decorates the existing canonical verifier with source-occurrence law checks.
 * On success, verification is delegated to the supplied complete verifier, so
 * this guard cannot accidentally upgrade a partial check to a valid proof.
 */
export const createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier = <
  TContract extends import('../../../types/upstream/requestTypeDerivationInterface').RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  delegate: RequestTypeDerivationProofVerificationInterface<TContract, TInference>,
): RequestTypeDerivationProofVerificationInterface<TContract, TInference> => Object.freeze({
  contract: delegate.contract,
  verify: (inference: TInference): RequestTypeDerivationSemanticVerificationFor<TContract, TInference> => {
    const judgment = inference.judgment;
    const evidence = judgment.kind === 'invalid_input'
      ? undefined
      : Object.freeze([
          ...judgment.proof.sourceEvidence.routes,
          ...judgment.proof.sourceEvidence.resources,
          ...judgment.proof.sourceEvidence.requests,
        ]);
    const failure = evidence === undefined ? undefined : occurrenceFailure(inference.input, evidence);
    if (failure !== undefined) {
      return Object.freeze({ contract: inference.contract, inference, result: failure });
    }

    // Preserve the delegate's complete verification envelope. Rebuilding an
    // envelope from `inference` and copying only `.result` would silently hide a
    // delegate that returned a different contract or inference packet, defeating
    // the downstream authority-integrity checks designed to detect that mismatch.
    return delegate.verify(inference);
  },
});

/** Canonical laws guarded here; all remaining laws remain the delegate verifier's responsibility. */
export const REQUEST_TYPE_SOURCE_OCCURRENCE_GUARDED_LAWS = SOURCE_OCCURRENCE_LAWS;
