import type { ClassName } from './names';
import type { PhpClassNameResolutionContext } from './phpClassNameResolutionInterface';
import type { SourceSpan } from './provenance';

/**
 * Source evidence retained on the canonical DTO property after syntax parsing.
 * This is deliberately not a binding judgment: project-wide declaration
 * inventory is required before a class reference can be canonically bound.
 */
export type DtoPropertyTypeEvidence =
  | Readonly<{ readonly kind: 'dto_property_primitive_type_evidence'; readonly source: SourceSpan }>
  | Readonly<{ readonly kind: 'dto_property_mixed_type_evidence'; readonly source: SourceSpan }>
  | Readonly<{
      readonly kind: 'dto_property_class_reference_type_evidence';
      readonly sourceName: ClassName;
      readonly lexicalContext: PhpClassNameResolutionContext;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'dto_property_unsupported_type_evidence';
      readonly reason: 'unsupported_php_property_type_syntax';
      readonly source: SourceSpan;
    }>;

export interface DtoPropertyTypeEvidenceContract {
  readonly kind: 'dto_property_type_evidence_contract';
  readonly version: 1;
  readonly classReferenceRule: 'retain-source-class-name-and-lexical-context-until-project-inventory-binding';
  readonly unsupportedSyntaxRule: 'unsupported-type-syntax-is-not-promoted-to-a-guessed-class-reference';
  readonly provenanceRule: 'each-property-type-evidence-retains-source-span';
}

export const DTO_PROPERTY_TYPE_EVIDENCE_CONTRACT: DtoPropertyTypeEvidenceContract = Object.freeze({
  kind: 'dto_property_type_evidence_contract',
  version: 1,
  classReferenceRule: 'retain-source-class-name-and-lexical-context-until-project-inventory-binding',
  unsupportedSyntaxRule: 'unsupported-type-syntax-is-not-promoted-to-a-guessed-class-reference',
  provenanceRule: 'each-property-type-evidence-retains-source-span',
});
