import type {
  PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface,
  PhpFunctionInvocationSemanticJudgmentBatchClosureResult,
  PhpFunctionInvocationSemanticJudgmentBatchDerivationInput,
  PhpFunctionInvocationSemanticJudgmentBatchEntry,
  PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt,
  PhpFunctionInvocationSemanticJudgmentBatchViolation,
  PhpFunctionInvocationSourceEvidence,
  PhpFunctionInvocationSourceInventory,
} from './phpFunctionInvocationSemanticAuthorityInterface';
import { PHP_FUNCTION_INVOCATION_SEMANTIC_JUDGMENT_BATCH_CONTRACT } from './phpFunctionInvocationSemanticAuthorityInterface';
import { phpFunctionInvocationSemanticAuthority } from './phpFunctionInvocationSemanticAuthority';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';

const sameFile = (left: SourceFile, right: SourceFile): boolean => left.value.value === right.value.value;
const sameSpan = (left: SourceSpan, right: SourceSpan): boolean => sameFile(left.file, right.file) && left.start.value === right.start.value && left.end.value === right.end.value;
const sameSpanFile = (span: SourceSpan, file: SourceFile): boolean => sameFile(span.file, file);
const spanWithin = (span: SourceSpan, outer: SourceSpan): boolean =>
  sameFile(span.file, outer.file)
  && span.start.value >= outer.start.value
  && span.end.value >= span.start.value
  && span.end.value <= outer.end.value;
const evidenceSource = (evidence: PhpFunctionInvocationSourceEvidence): SourceSpan => evidence.resolutionInput.source;
const syntaxSources = (evidence: PhpFunctionInvocationSourceEvidence): readonly SourceSpan[] => {
  const syntax = evidence.resolutionInput.syntaxEvidence;
  switch (syntax.kind) {
    case 'unqualified_function_name_evidence': return [syntax.segment.source];
    case 'qualified_function_name_evidence':
    case 'fully_qualified_function_name_evidence': return syntax.segments.map(segment => segment.source);
    case 'malformed_function_name_evidence': return [syntax.source];
  }
};
const environmentFile = (evidence: PhpFunctionInvocationSourceEvidence): SourceFile => evidence.resolutionInput.environment.environment.sourceFile;
const evidenceIdentity = (evidence: PhpFunctionInvocationSourceEvidence): string => {
  const span = evidenceSource(evidence);
  const syntax = evidence.resolutionInput.syntaxEvidence;
  const name = syntax.kind === 'malformed_function_name_evidence' ? syntax.reason : syntax.kind === 'unqualified_function_name_evidence' ? syntax.segment.name.value.value : syntax.segments.map(segment => segment.name.value.value).join('\\');
  return `${span.file.value.value}\u0000${span.start.value}\u0000${span.end.value}\u0000${name}`;
};
const sameResolutionSource = (entry: PhpFunctionInvocationSemanticJudgmentBatchEntry): boolean => entry.judgment.resolution.source === entry.evidence.resolutionInput;

const close = (input: Readonly<{
  readonly kind: 'php_function_invocation_semantic_judgment_batch_closure_input';
  readonly inventory: PhpFunctionInvocationSourceInventory;
  readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry[];
}>): PhpFunctionInvocationSemanticJudgmentBatchClosureResult => {
  const { inventory, entries } = input;
  const violations: PhpFunctionInvocationSemanticJudgmentBatchViolation[] = [];
  const inventoryFile = inventory.sourceFile;
  const witness = inventory.completeness;

  if (!sameFile(witness.sourceFile, inventoryFile) || !sameSpanFile(witness.source, inventoryFile)) {
    violations.push(Object.freeze({ kind: 'inventory-completeness-file-mismatch', inventory: inventoryFile, witness }));
  }
  if (!sameFile(witness.sourceFile, inventoryFile) || witness.obligations.length !== 3 || witness.obligations[0] !== 'all-php-function-call-nodes-inventoried' || witness.obligations[1] !== 'all-call-arguments-captured' || witness.obligations[2] !== 'all-name-resolution-environments-accounted-for') violations.push(Object.freeze({ kind: 'incomplete-inventory-witness', witness }));

  for (const evidence of inventory.entries) {
    if (!sameFile(evidenceSource(evidence).file, inventoryFile)) violations.push(Object.freeze({ kind: 'inventory-file-mismatch', inventory: inventoryFile, evidence }));
    if (!spanWithin(evidenceSource(evidence), witness.source) || syntaxSources(evidence).some(source => !spanWithin(source, witness.source))) violations.push(Object.freeze({ kind: 'invocation-outside-certified-source-span', evidence, certifiedSource: witness.source }));
    if (!sameFile(environmentFile(evidence), inventoryFile)) violations.push(Object.freeze({ kind: 'resolution-environment-file-mismatch', inventory: inventoryFile, evidence }));
    if (!sameFile(evidenceSource(evidence).file, environmentFile(evidence))) violations.push(Object.freeze({ kind: 'resolution-source-file-mismatch', evidence }));
    if (syntaxSources(evidence).some(source => !sameFile(source.file, inventoryFile))) violations.push(Object.freeze({ kind: 'name-syntax-source-file-mismatch', evidence }));
    const matched = entries.filter(entry => entry.evidence === evidence);
    if (matched.length === 0) violations.push(Object.freeze({ kind: 'missing-invocation-judgment', evidence }));
    if (matched.length > 1) violations.push(Object.freeze({ kind: 'duplicate-invocation-evidence', evidence }));
  }

  for (const entry of entries) {
    if (!inventory.entries.includes(entry.evidence)) violations.push(Object.freeze({ kind: 'orphan-invocation-judgment', entry }));
    if (!sameResolutionSource(entry)) violations.push(Object.freeze({ kind: 'judgment-resolution-mismatch', entry }));
    if (entry.judgment.arguments !== entry.evidence.arguments) violations.push(Object.freeze({ kind: 'judgment-arguments-mismatch', entry }));
  }

  const evidenceIdentities = inventory.entries.map(evidenceIdentity);
  const uniqueEvidenceCount = evidenceIdentities.filter((identity, index, identities) => identities.indexOf(identity) === index).length;
  if (uniqueEvidenceCount !== inventory.entries.length) {
    for (const evidence of inventory.entries) {
      if (inventory.entries.filter(candidate => evidenceIdentity(candidate) === evidenceIdentity(evidence)).length > 1) {
        violations.push(Object.freeze({ kind: 'duplicate-invocation-evidence', evidence }));
      }
    }
  }

  const firstViolation = violations[0];
  if (firstViolation !== undefined) {
    const remainingViolations = violations.slice(1);
    const rejectionItems: [PhpFunctionInvocationSemanticJudgmentBatchViolation, ...PhpFunctionInvocationSemanticJudgmentBatchViolation[]] = [firstViolation, ...remainingViolations];
    const rejectionLedger: readonly [PhpFunctionInvocationSemanticJudgmentBatchViolation, ...PhpFunctionInvocationSemanticJudgmentBatchViolation[]] = Object.freeze(rejectionItems);
    return Object.freeze({
      kind: 'php_function_invocation_semantic_judgment_batch_rejected',
      inventory,
      entries: Object.freeze([...entries]),
      violations: rejectionLedger,
    });
  }

  const correspondences: PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt['correspondences'] = inventory.entries.map((evidence): PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt['correspondences'][number] => {
    const entry = entries.find(candidate => candidate.evidence === evidence);
    if (entry === undefined) throw new Error('Validated invocation correspondence disappeared after closure checks.');
    return Object.freeze({ kind: 'php_function_invocation_source_judgment_correspondence', evidence, judgment: entry.judgment });
  });
  return Object.freeze({
    kind: 'php_function_invocation_semantic_judgment_batch_validated',
    receipt: Object.freeze({
      kind: 'php_function_invocation_semantic_judgment_batch_closure_receipt',
      contract: PHP_FUNCTION_INVOCATION_SEMANTIC_JUDGMENT_BATCH_CONTRACT,
      inventory,
      entries: Object.freeze([...entries]),
      correspondences: Object.freeze(correspondences),
      invariant: 'inventory-and-judgments-form-a-total-bijection-with-identical-source-and-argument-evidence',
    }),
  });
};

const derive = (input: PhpFunctionInvocationSemanticJudgmentBatchDerivationInput): PhpFunctionInvocationSemanticJudgmentBatchClosureResult => {
  const entries: PhpFunctionInvocationSemanticJudgmentBatchEntry[] = input.inventory.entries.flatMap((evidence) => input.resolutions
    .filter((resolution) => resolution.source === evidence.resolutionInput)
    .map((resolution): PhpFunctionInvocationSemanticJudgmentBatchEntry => Object.freeze({
      kind: 'php_function_invocation_semantic_judgment_batch_entry',
      evidence,
      judgment: phpFunctionInvocationSemanticAuthority.derive(Object.freeze({
        kind: 'php_function_invocation_semantic_input',
        resolution,
        arguments: evidence.arguments,
      })),
    })));
  const closure = close(Object.freeze({
    kind: 'php_function_invocation_semantic_judgment_batch_closure_input',
    inventory: input.inventory,
    entries: Object.freeze(entries),
  }));
  const orphanResolutions = input.resolutions.filter((resolution) => !input.inventory.entries.some((evidence) => evidence.resolutionInput === resolution.source));
  const orphanViolations: PhpFunctionInvocationSemanticJudgmentBatchViolation[] = orphanResolutions.map((resolution) => Object.freeze({
    kind: 'name-resolution-judgment-outside-inventory',
    resolution,
  }));
  const firstOrphanViolation = orphanViolations[0];
  if (firstOrphanViolation === undefined) return closure;
  const allViolations = closure.kind === 'php_function_invocation_semantic_judgment_batch_rejected'
    ? [...closure.violations, ...orphanViolations]
    : orphanViolations;
  const firstViolation = allViolations[0];
  if (firstViolation === undefined) return closure;
  const remainingViolations = allViolations.slice(1);
  const rejectionLedger: readonly [PhpFunctionInvocationSemanticJudgmentBatchViolation, ...PhpFunctionInvocationSemanticJudgmentBatchViolation[]] = Object.freeze([firstViolation, ...remainingViolations]);
  return Object.freeze({
    kind: 'php_function_invocation_semantic_judgment_batch_rejected',
    inventory: input.inventory,
    entries: Object.freeze(entries),
    violations: rejectionLedger,
  });
};

export const phpFunctionInvocationSemanticJudgmentBatchClosureAuthority: PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface = Object.freeze({
  kind: 'php_function_invocation_semantic_judgment_batch_closure_authority',
  contract: PHP_FUNCTION_INVOCATION_SEMANTIC_JUDGMENT_BATCH_CONTRACT,
  close,
  derive,
});
