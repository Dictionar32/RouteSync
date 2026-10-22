import { describe, expect, it } from 'vitest';
import { createSourceFile } from '../names';
import { stringValue } from '../valueObjects';
import { phpSourceDocumentIdentityBinding } from '../phpSourceDocumentIdentityBindingAuthority';
import type { PhpSourceDocumentReadResult } from '../phpSourceFrontendInterface';

const sourceFile = createSourceFile('/project/app/Http/Controllers/OrderController.php');
const otherSourceFile = createSourceFile('/project/app/Http/Controllers/OtherController.php');

const completeResult = (file: typeof sourceFile): Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_complete' }> => Object.freeze({
  kind: 'php_source_document_read_complete',
  document: Object.freeze({
    kind: 'php_source_document',
    sourceFile: file,
    content: Object.freeze({ kind: 'php_source_text', value: stringValue('<?php') }),
  }),
});

describe('PHP source document identity binding', () => {
  it('binds a complete read only to its requested source identity', () => {
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(sourceFile),
    })).kind).toBe('php_source_document_identity_bound');
  });

  it('rejects a complete document returned for another source identity', () => {
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result: completeResult(otherSourceFile),
    })).kind).toBe('php_source_document_identity_rejected');
  });

  it('rejects a blocker whose source identity differs from the requested source', () => {
    const result: Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }> = Object.freeze({
      kind: 'php_source_document_read_blocked',
      sourceFile,
      blocker: Object.freeze({ kind: 'php_source_document_file_missing', sourceFile: otherSourceFile }),
    });
    expect(phpSourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: sourceFile,
      result,
    })).kind).toBe('php_source_document_identity_rejected');
  });
});
