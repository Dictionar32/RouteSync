/**
 * provenance.ts
 *
 * Data Provenance ADT & Endpoint Provenance Descriptors.
 * Active Consumer: Orchestrates Data Provenance domain model.
 *
 * @module types/domain/provenance
 */

export {
  DataProvenanceKind,
  type DataProvenanceKindSpecification,
  type DataProvenanceKindRegistry,
  DATA_PROVENANCE_REGISTRY,
  type ProvenanceSourceRef,
  type DataProvenanceVisitor,
  matchDataProvenance,
  type EndpointProvenanceDescriptor,
  ScannedEndpointProvenanceDescriptor
} from './provenance/index';
