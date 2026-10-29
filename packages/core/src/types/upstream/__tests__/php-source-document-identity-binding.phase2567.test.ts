import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory } from '../names';
import { stringValue } from '../valueObjects';
import { phpSourceDocumentReadBatchFactory, phpSourceDocumentReadBlockerFactory, phpSourceDocumentReadOperationBatchFactory, phpSourceDocumentReadOperationSettlementFactory, phpSourceDocumentReadResultFactory } from '../phpSourceFrontendInterface';
import { phpSourceDocumentIdentityBinding } from '../phpSourceDocumentIdentityBindingAuthority';
import { phpSourceDocumentIdentityBindingBatchFactory } from '../phpSourceDocumentIdentityBindingBatchAuthority';
import type { PhpSourceDocumentReadResult } from '../phpSourceFrontendInterface';

const sourceFile = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/OrderController.php'));
const otherSourceFile = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/OtherController.php'));

const completeResult = (file: typeof sourceFile): Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_complete' }> => phpSourceDocumentReadResultFactory.complete(Object.freeze({
  kind: 'php_source_document',
  sourceFile: file,
  content: Object.freeze({ kind: 'php_source_text', value: stringValue.create('<?php') }),
}));

describe('PHP source document identity binding', () => {
  it('binds a complete read only to its requested source identity', () => {
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(sourceFile),
    })).kind).toBe('php_source_document_identity_bound');
  });

  it('exposes identity binding as a named source-read domain operation', () => {
    const result = completeResult(sourceFile);
    expect(result.bindIdentity(sourceFile, phpSourceDocumentIdentityBinding).kind).toBe('php_source_document_identity_bound');
  });

  it('contributes an identity judgment through its typed batch operation', () => {
    const judgment = phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(sourceFile),
    }));
    expect(typeof judgment.contributeToBatch).toBe('function');
    expect(phpSourceDocumentIdentityBindingBatchFactory.fromJudgments([judgment]).kind)
      .toBe('php_source_document_identity_binding_batch_bound');
  });

  it('binds a fulfilled source-read operation batch through its named identity operation', () => {
    const settlement = phpSourceDocumentReadOperationSettlementFactory.fulfilled(sourceFile, completeResult(sourceFile));
    const batch = phpSourceDocumentReadOperationBatchFactory.fromSettlements([settlement]);
    expect(batch.kind).toBe('php_source_document_read_operation_batch_fulfilled');
    if (batch.kind === 'php_source_document_read_operation_batch_fulfilled') {
      expect(batch.bindIdentityBatch(phpSourceDocumentIdentityBindingBatchFactory, phpSourceDocumentIdentityBinding).kind)
        .toBe('php_source_document_identity_binding_batch_bound');
    }
  });

  it('continues a bound identity batch into the source-read batch domain', () => {
    const judgment = phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(sourceFile),
    }));
    const batch = phpSourceDocumentIdentityBindingBatchFactory.fromJudgments([judgment]);
    expect(batch.kind).toBe('php_source_document_identity_binding_batch_bound');
    if (batch.kind === 'php_source_document_identity_binding_batch_bound') {
      expect(batch.toSourceReadBatch(phpSourceDocumentReadBatchFactory).kind)
        .toBe('php_source_document_read_batch_complete');
    }
  });

  it('preserves rejected identity evidence through its named domain operation', () => {
    const judgment = phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(otherSourceFile),
    }));
    const batch = phpSourceDocumentIdentityBindingBatchFactory.fromJudgments([judgment]);
    expect(batch.kind).toBe('php_source_document_identity_binding_batch_rejected');
    if (batch.kind === 'php_source_document_identity_binding_batch_rejected') {
      expect(batch.preserveRejectedEvidence().rejections).toHaveLength(1);
    }
  });

  it('rejects a complete document returned for another source identity', () => {
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(otherSourceFile),
    })).kind).toBe('php_source_document_identity_rejected');
  });

  it('rejects a blocker whose source identity differs from the requested source', () => {
    const result: Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }> = phpSourceDocumentReadResultFactory.blocked(
      sourceFile,
      phpSourceDocumentReadBlockerFactory.fileMissing(otherSourceFile),
    );
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result,
    })).kind).toBe('php_source_document_identity_rejected');
  });

  it('contributes complete source-read evidence directly to the batch domain operation', () => {
    const batch = phpSourceDocumentReadBatchFactory.fromResults([completeResult(sourceFile)]);
    expect(batch.kind).toBe('php_source_document_read_batch_complete');
    if (batch.kind === 'php_source_document_read_batch_complete') {
      expect(batch.provideDocumentsForSemanticPipeline().map(document => document.sourceFile.value.value))
        .toEqual(['/project/app/Http/Controllers/OrderController.php']);
    }
  });

  it('preserves blocked source-read evidence while contributing it to the batch domain operation', () => {
    const blocked = phpSourceDocumentReadResultFactory.blocked(
      sourceFile,
      phpSourceDocumentReadBlockerFactory.fileMissing(sourceFile),
    );
    const batch = phpSourceDocumentReadBatchFactory.fromResults([completeResult(otherSourceFile), blocked]);
    expect(batch.kind).toBe('php_source_document_read_batch_blocked');
    if (batch.kind === 'php_source_document_read_batch_blocked') {
      const blockedEvidence = batch.preserveBlockedEvidence();
      expect({
        partialDocuments: blockedEvidence.partialDocuments.map(document => document.sourceFile.value.value),
        blockedSource: blockedEvidence.blockedReads[0].sourceFile.value.value,
        blockerKind: blockedEvidence.blockedReads[0].blocker.kind,
      }).toEqual({
        partialDocuments: ['/project/app/Http/Controllers/OtherController.php'],
        blockedSource: '/project/app/Http/Controllers/OrderController.php',
        blockerKind: 'php_source_document_file_missing',
      });
    }
  });

  it('continues a missing-file blocker through its domain operation', () => {
    expect(phpSourceDocumentReadBlockerFactory.fileMissing(sourceFile).continueWith({
      onFileMissing: blocker => blocker.kind,
      onPathNotFile: blocker => blocker.kind,
      onFileUnreadable: blocker => blocker.kind,
      onFailureCodeUnrecognized: blocker => blocker.kind,
    })).toBe('php_source_document_file_missing');
  });

  it('continues a path-not-file blocker through its domain operation', () => {
    expect(phpSourceDocumentReadBlockerFactory.pathNotFile(sourceFile).continueWith({
      onFileMissing: blocker => blocker.kind,
      onPathNotFile: blocker => blocker.kind,
      onFileUnreadable: blocker => blocker.kind,
      onFailureCodeUnrecognized: blocker => blocker.kind,
    })).toBe('php_source_document_path_not_file');
  });

  it('continues an unreadable-file blocker through its domain operation', () => {
    expect(phpSourceDocumentReadBlockerFactory.fileUnreadable(sourceFile).continueWith({
      onFileMissing: blocker => blocker.kind,
      onPathNotFile: blocker => blocker.kind,
      onFileUnreadable: blocker => blocker.kind,
      onFailureCodeUnrecognized: blocker => blocker.kind,
    })).toBe('php_source_document_file_unreadable');
  });

  it('preserves an unrecognized filesystem failure code as a distinct domain blocker', () => {
    expect(phpSourceDocumentReadBlockerFactory.failureCodeUnrecognized(sourceFile).continueWith({
      onFileMissing: blocker => blocker.kind,
      onPathNotFile: blocker => blocker.kind,
      onFileUnreadable: blocker => blocker.kind,
      onFailureCodeUnrecognized: blocker => blocker.kind,
    })).toBe('php_source_document_failure_code_unrecognized');
  });
});

