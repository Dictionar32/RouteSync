/**
 * Canonical source-evidence inventory for RequestType derivation.
 *
 * Identity is an upstream-owned operation algebra. Inventory construction only
 * packages source evidence and the canonical identity judgments; it does not
 * resolve requests, classify routes, produce semantic judgments, or claim proof.
 */
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type {
  RequestTypeCanonicalRequestIdentity,
  RequestTypeCanonicalRequestIdentityRelationJudgment,
  RequestTypeCanonicalResourceIdentity,
  RequestTypeCanonicalResourceIdentityRelationJudgment,
  RequestTypeCanonicalRouteIdentity,
  RequestTypeCanonicalRouteIdentityRelationJudgment,
  RequestTypeDerivationInput,
  RequestTypeDerivationSourceEvidenceInventoryInterface,
  RequestTypeDuplicateIdentityWitness,
  RequestTypeDerivationIdentityCollisionInventory,
  RequestTypeNonEmptyLedger,
  RequestTypeRouteOccurrenceKey,
  RequestTypeResourceOccurrenceKey,
  RequestTypeRequestOccurrenceKey,
  RequestTypeRouteEvidenceReference,
  RequestTypeResourceEvidenceReference,
  RequestTypeRequestEvidenceReference,
} from '../../../types/upstream/requestTypeDerivationInterface';
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { RequestAst, ResourceAst } from '../../../types/upstream/ast';

/**
 * Encode the file component before delimiting coordinates. Source occurrence
 * identity is a tuple (file, start, end), not a concatenated path string: raw
 * file names may themselves contain colons, so leaving the component unescaped
 * makes the serialization boundary ambiguous. Coordinate values remain decimal
 * integers and therefore need no additional encoding.
 */
const sourceSpanIdentity = (file: string, start: number, end: number): string =>
  `${encodeURIComponent(file)}:${start}:${end}`;

const canonicalRouteOccurrenceKeyImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalRouteOccurrenceKey'] = (
  provenance: RouteSemanticFlow['provenance'],
): RequestTypeRouteOccurrenceKey => {
  const span = provenance.declarationSpan;
  return `route-occurrence:${sourceSpanIdentity(span.file.value.value, span.start.value, span.end.value)}`;
};

const canonicalResourceOccurrenceKeyImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalResourceOccurrenceKey'] = (
  source: ResourceAst['source'],
): RequestTypeResourceOccurrenceKey =>
  `resource-occurrence:${sourceSpanIdentity(source.file.value.value, source.start.value, source.end.value)}`;

const canonicalRequestOccurrenceKeyImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalRequestOccurrenceKey'] = (
  source: RequestAst['source'],
): RequestTypeRequestOccurrenceKey =>
  `request-occurrence:${sourceSpanIdentity(source.file.value.value, source.start.value, source.end.value)}`;

const canonicalRouteIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalRouteIdentity'] = (
  identity: RouteSemanticFlow['identity'],
): RequestTypeCanonicalRouteIdentity => {
  const { coordinates, domain } = identity;
  const endpointIdentity = [
    coordinates.method,
    coordinates.path.value.value,
    coordinates.name.value.value,
    domain.resource.value.value,
    domain.domain.value.value,
    domain.group.value.value,
  ].map(encodeURIComponent).join(':');

  return Object.freeze({
    kind: 'canonical_route_identity',
    coordinates: Object.freeze({ method: coordinates.method, path: coordinates.path, name: coordinates.name }),
    domain: Object.freeze({
      resource: domain.resource,
      domain: domain.domain,
      group: domain.group,
    }),
    routeName: coordinates.name,
    semanticKey: `route:${endpointIdentity}`,
  });
};

const canonicalResourceIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalResourceIdentity'] = (
  identity: ResourceAst['definition']['name'],
): RequestTypeCanonicalResourceIdentity => {
  const canonicalName = SemanticValueFactory.resourceName(identity.value.value.toLowerCase());
  return Object.freeze({
    kind: 'canonical_resource_identity',
    canonicalName,
    semanticKey: `resource:${canonicalName.value.value}`,
  });
};

/** Structural route equality; serialized keys are never used as identity authority. */
const relateCanonicalRouteIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['relateCanonicalRouteIdentity'] = (
  left: RequestTypeCanonicalRouteIdentity,
  right: RequestTypeCanonicalRouteIdentity,
): RequestTypeCanonicalRouteIdentityRelationJudgment => {
  const equivalent = left.coordinates.method === right.coordinates.method
    && left.coordinates.path.value.value === right.coordinates.path.value.value
    && left.coordinates.name.value.value === right.coordinates.name.value.value
    && left.domain.resource.value.value === right.domain.resource.value.value
    && left.domain.domain.value.value === right.domain.domain.value.value
    && left.domain.group.value.value === right.domain.group.value.value;
  return Object.freeze({ kind: equivalent ? 'canonical_route_identity_equivalent' : 'canonical_route_identity_distinct', left, right });
};

/** Domain relation owned by the upstream canonical identity inventory. */
const relateCanonicalResourceIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['relateCanonicalResourceIdentity'] = (
  left: RequestTypeCanonicalResourceIdentity,
  right: RequestTypeCanonicalResourceIdentity,
): RequestTypeCanonicalResourceIdentityRelationJudgment => Object.freeze({
  kind: left.canonicalName.value.value === right.canonicalName.value.value
    ? 'canonical_resource_identity_equivalent'
    : 'canonical_resource_identity_distinct',
  left,
  right,
});

const relateCanonicalRequestIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['relateCanonicalRequestIdentity'] = (
  left: RequestTypeCanonicalRequestIdentity,
  right: RequestTypeCanonicalRequestIdentity,
): RequestTypeCanonicalRequestIdentityRelationJudgment => {
  const equivalent = left.identityKind === right.identityKind
    && left.requestName.value.value === right.requestName.value.value
    && (left.identityKind === 'http_request_identity'
      || (right.identityKind === 'form_request_identity'
        && left.formType.value.value === right.formType.value.value));
  return Object.freeze({ kind: equivalent ? 'canonical_request_identity_equivalent' : 'canonical_request_identity_distinct', left, right });
};

type RequestIdentitySource = RequestAst['definition']['identity'];
type RequestIdentityKind = RequestIdentitySource['kind'];
type RequestIdentityVariant<K extends RequestIdentityKind> = Extract<
  RequestIdentitySource,
  { readonly kind: K }
>;
type CanonicalRequestIdentityVariant<K extends RequestIdentityKind> = Extract<
  RequestTypeCanonicalRequestIdentity,
  { readonly identityKind: K }
>;

/**
 * Closed ADT dispatch: each key accepts only its matching source variant and
 * returns only the matching canonical identity variant. No runtime `if` or
 * string-based branch is needed to narrow the source union.
 */
type CanonicalRequestIdentityDispatchInterface = {
  readonly [K in RequestIdentityKind]: (
    identity: RequestIdentityVariant<K>,
  ) => CanonicalRequestIdentityVariant<K>;
};

const canonicalRequestIdentityDispatch: CanonicalRequestIdentityDispatchInterface = Object.freeze({
  http_request_identity: (identity: RequestIdentityVariant<'http_request_identity'>) => Object.freeze({
    kind: 'canonical_request_identity',
    identityKind: 'http_request_identity',
    requestName: identity.request,
    semanticKey: `request:http:${encodeURIComponent(identity.request.value.value)}`,
  }),
  form_request_identity: (identity: RequestIdentityVariant<'form_request_identity'>) => Object.freeze({
    kind: 'canonical_request_identity',
    identityKind: 'form_request_identity',
    requestName: identity.request,
    formType: identity.formType,
    semanticKey: `request:form:${encodeURIComponent(identity.request.value.value)}:${encodeURIComponent(identity.formType.value.value)}`,
  }),
});

const canonicalRequestIdentityDispatchInvocation: <K extends RequestIdentityKind>(
  identity: RequestIdentityVariant<K>,
) => CanonicalRequestIdentityVariant<K> = identity =>
  canonicalRequestIdentityDispatch[identity.kind](identity);

const canonicalRequestIdentityImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalRequestIdentity'] =
  canonicalRequestIdentityDispatchInvocation;

const routeReference: (route: RequestTypeDerivationInput['routes'][number]) => RequestTypeRouteEvidenceReference = route => {
  const occurrenceKey = canonicalRouteOccurrenceKeyImplementation(route.provenance);
  const identity = canonicalRouteIdentityImplementation(route.identity);
  return Object.freeze({
    source: Object.freeze({ kind: 'route', identity: route.identity, provenance: route.provenance }),
    semanticKey: identity.semanticKey,
    canonicalIdentity: identity,
    occurrenceKey,
    location: Object.freeze({
      kind: 'route_declaration_location',
      file: route.provenance.sourceFile,
      line: route.provenance.sourceLine,
      span: route.provenance.declarationSpan,
    }),
  });
};

const resourceReference: (resource: RequestTypeDerivationInput['resources'][number]) => RequestTypeResourceEvidenceReference = resource => {
  const occurrenceKey = canonicalResourceOccurrenceKeyImplementation(resource.source);
  const identity = canonicalResourceIdentityImplementation(resource.definition.name);
  return Object.freeze({
    source: Object.freeze({ kind: 'resource', identity: resource.definition.name, source: resource.source }),
    semanticKey: identity.semanticKey,
    canonicalIdentity: identity,
    occurrenceKey,
    location: Object.freeze({ kind: 'source_span_location', span: resource.source }),
  });
};

const requestReference: (request: RequestTypeDerivationInput['requests'][number]) => RequestTypeRequestEvidenceReference = request => {
  const occurrenceKey = canonicalRequestOccurrenceKeyImplementation(request.source);
  const identity = canonicalRequestIdentityImplementation(request.definition.identity);
  return Object.freeze({
    source: Object.freeze({ kind: 'request', identity: request.definition.identity, source: request.source }),
    semanticKey: identity.semanticKey,
    canonicalIdentity: identity,
    occurrenceKey,
    location: Object.freeze({ kind: 'source_span_location', span: request.source }),
  });
};

const inventoryRequestTypeDerivationSourceEvidenceImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['inventory'] = (input: RequestTypeDerivationInput) => Object.freeze({
  routes: Object.freeze(input.routes.map(routeReference)),
  resources: Object.freeze(input.resources.map(resourceReference)),
  requests: Object.freeze(input.requests.map(requestReference)),
});

/**
 * Preserve every repeated canonical identity as a typed collision witness.
 * Distinct occurrence keys remain attached to the evidence; this operation
 * reports collisions but does not decide whether the final judgment is conflict
 * or invalid input. That disposition belongs to the semantic reasoning algebra.
 */
const isNonEmptyDuplicateIdentityWitnessLedger = (
  witnesses: readonly RequestTypeDuplicateIdentityWitness[],
): witnesses is RequestTypeNonEmptyLedger<RequestTypeDuplicateIdentityWitness> =>
  witnesses.length > 0 && witnesses[0] !== undefined;

const distinctRouteOccurrences = (
  candidates: readonly RequestTypeRouteEvidenceReference[],
): readonly RequestTypeRouteEvidenceReference[] => {
  const uniqueOccurrences = candidates.filter((candidate, index, all) =>
    all.findIndex(other => other.occurrenceKey === candidate.occurrenceKey) === index,
  );
  const first = uniqueOccurrences[0];
  if (first === undefined) return Object.freeze([]);
  const second = uniqueOccurrences.find(candidate => candidate.occurrenceKey !== first.occurrenceKey);
  if (second === undefined) return Object.freeze([]);
  return Object.freeze(uniqueOccurrences);
};

const distinctResourceOccurrences = (
  candidates: readonly RequestTypeResourceEvidenceReference[],
): readonly RequestTypeResourceEvidenceReference[] => {
  const uniqueOccurrences = candidates.filter((candidate, index, all) =>
    all.findIndex(other => other.occurrenceKey === candidate.occurrenceKey) === index,
  );
  const first = uniqueOccurrences[0];
  if (first === undefined) return Object.freeze([]);
  const second = uniqueOccurrences.find(candidate => candidate.occurrenceKey !== first.occurrenceKey);
  if (second === undefined) return Object.freeze([]);
  return Object.freeze(uniqueOccurrences);
};

const distinctRequestOccurrences = (
  candidates: readonly RequestTypeRequestEvidenceReference[],
): readonly RequestTypeRequestEvidenceReference[] => {
  const uniqueOccurrences = candidates.filter((candidate, index, all) =>
    all.findIndex(other => other.occurrenceKey === candidate.occurrenceKey) === index,
  );
  const first = uniqueOccurrences[0];
  if (first === undefined) return Object.freeze([]);
  const second = uniqueOccurrences.find(candidate => candidate.occurrenceKey !== first.occurrenceKey);
  if (second === undefined) return Object.freeze([]);
  return Object.freeze(uniqueOccurrences);
};

/**
 * A repeated semantic key is a collision only when at least two distinct source
 * occurrence keys claim it. Repeated copies of the same parsed source span are
 * not treated as separate declarations.
 */
const requestTypeDerivationDuplicateIdentityWitnessesImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['duplicateIdentityWitnesses'] = input => {
  const inventory = inventoryRequestTypeDerivationSourceEvidenceImplementation(input);
  const witnesses: RequestTypeDuplicateIdentityWitness[] = [];

  inventory.routes.forEach((route, index, routes) => {
    if (routes.findIndex(candidate => relateCanonicalRouteIdentityImplementation(candidate.canonicalIdentity, route.canonicalIdentity).kind === 'canonical_route_identity_equivalent') !== index) return;
    const candidates = routes.filter(candidate => relateCanonicalRouteIdentityImplementation(candidate.canonicalIdentity, route.canonicalIdentity).kind === 'canonical_route_identity_equivalent');
    const occurrences = distinctRouteOccurrences(candidates);
    const first = occurrences[0];
    const second = occurrences[1];
    if (first === undefined || second === undefined) return;
    witnesses.push(Object.freeze({
      domain: 'routes',
      semanticKey: route.semanticKey,
      occurrences: Object.freeze({ first, second, additional: Object.freeze(occurrences.slice(2)) }),
    }));
  });

  inventory.resources.forEach((resource, index, resources) => {
    if (resources.findIndex(candidate => relateCanonicalResourceIdentityImplementation(candidate.canonicalIdentity, resource.canonicalIdentity).kind === 'canonical_resource_identity_equivalent') !== index) return;
    const candidates = resources.filter(candidate => relateCanonicalResourceIdentityImplementation(candidate.canonicalIdentity, resource.canonicalIdentity).kind === 'canonical_resource_identity_equivalent');
    const occurrences = distinctResourceOccurrences(candidates);
    const first = occurrences[0];
    const second = occurrences[1];
    if (first === undefined || second === undefined) return;
    witnesses.push(Object.freeze({
      domain: 'resources',
      semanticKey: resource.semanticKey,
      occurrences: Object.freeze({ first, second, additional: Object.freeze(occurrences.slice(2)) }),
    }));
  });

  inventory.requests.forEach((request, index, requests) => {
    if (requests.findIndex(candidate => relateCanonicalRequestIdentityImplementation(candidate.canonicalIdentity, request.canonicalIdentity).kind === 'canonical_request_identity_equivalent') !== index) return;
    const candidates = requests.filter(candidate => relateCanonicalRequestIdentityImplementation(candidate.canonicalIdentity, request.canonicalIdentity).kind === 'canonical_request_identity_equivalent');
    const occurrences = distinctRequestOccurrences(candidates);
    const first = occurrences[0];
    const second = occurrences[1];
    if (first === undefined || second === undefined) return;
    witnesses.push(Object.freeze({
      domain: 'requests',
      semanticKey: request.semanticKey,
      occurrences: Object.freeze({ first, second, additional: Object.freeze(occurrences.slice(2)) }),
    }));
  });

  return Object.freeze(witnesses);
};

const requestTypeDerivationIdentityCollisionInventoryImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['identityCollisionInventory'] = input => {
  const witnesses = requestTypeDerivationDuplicateIdentityWitnessesImplementation(input);
  if (isNonEmptyDuplicateIdentityWitnessLedger(witnesses)) {
    return Object.freeze({ kind: 'identity_inventory_collisions', witnesses });
  }
  return Object.freeze({ kind: 'identity_inventory_collision_free' });
};

const requestTypeDerivationSourceEvidenceKeysImplementation: RequestTypeDerivationSourceEvidenceInventoryInterface['evidenceKeys'] = input => {
  const inventory = inventoryRequestTypeDerivationSourceEvidenceImplementation(input);
  return Object.freeze([
    ...inventory.routes.map(evidence => evidence.semanticKey),
    ...inventory.resources.map(evidence => evidence.semanticKey),
    ...inventory.requests.map(evidence => evidence.semanticKey),
  ]);
};

export const requestTypeDerivationSourceEvidenceInventory: RequestTypeDerivationSourceEvidenceInventoryInterface = Object.freeze({
  canonicalRouteIdentity: canonicalRouteIdentityImplementation,
  canonicalResourceIdentity: canonicalResourceIdentityImplementation,
  canonicalRequestIdentity: canonicalRequestIdentityImplementation,
  relateCanonicalRouteIdentity: relateCanonicalRouteIdentityImplementation,
  relateCanonicalResourceIdentity: relateCanonicalResourceIdentityImplementation,
  relateCanonicalRequestIdentity: relateCanonicalRequestIdentityImplementation,
  canonicalRouteOccurrenceKey: canonicalRouteOccurrenceKeyImplementation,
  canonicalResourceOccurrenceKey: canonicalResourceOccurrenceKeyImplementation,
  canonicalRequestOccurrenceKey: canonicalRequestOccurrenceKeyImplementation,
  inventory: inventoryRequestTypeDerivationSourceEvidenceImplementation,
  duplicateIdentityWitnesses: requestTypeDerivationDuplicateIdentityWitnessesImplementation,
  identityCollisionInventory: requestTypeDerivationIdentityCollisionInventoryImplementation,
  evidenceKeys: requestTypeDerivationSourceEvidenceKeysImplementation,
});
