/** Upstream-owned Laravel service-provider declaration evidence. Concrete PHP AST stays in the scanner. */
export type ProviderSourceEvidence = {
  readonly kind: 'provider_source_evidence';
  readonly attributes: readonly ProviderAttributeEvidence[];
  readonly className: ClassName;
  readonly methods: readonly ProviderMethodEvidence[];
  readonly source: SourceSpan;
};

export type ProviderAttributeEvidence = {
  readonly kind: 'provider_attribute_evidence';
  readonly name: ClassName;
  readonly arguments: ExpressionArguments;
  readonly source: SourceSpan;
};

export type ProviderMethodEvidence = {
  readonly kind: 'provider_method_evidence';
  readonly name: MethodName;
  readonly body: Expression;
  readonly source: SourceSpan;
};
