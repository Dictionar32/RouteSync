import fs from 'node:fs/promises';
import {
  phpSourceDocumentReadResultFactory,
  phpSourceTextFactory,
} from '../../../types/upstream/phpSourceFrontendInterface';
import { filesystemFailureCodeFactory, type FilesystemFailureCode } from '../../../types/upstream/filesystemFailureInterface';
import { stringValue, type StringValue } from '../../../types/upstream/valueObjects';
import type { PhpSourceDocumentReadInput, PhpSourceDocumentReadResult, PhpSourceDocumentReaderInterface } from '../../../types/upstream/phpSourceFrontendInterface';

/** Normalized diagnostics retained from a Node filesystem rejection at the platform boundary. */
export interface NodeFilesystemFailureObservation {
  readonly failureCode: FilesystemFailureCode;
  readonly failureName: StringValue;
  readonly failureMessage: StringValue;
}

/** Interface-typed operation shared by source reads and CLI discovery; platform error inspection has one owner. */
export interface NodeFilesystemFailureObservationInterface {
  readonly observe: (thrownValue: unknown) => NodeFilesystemFailureObservation;
}

export const nodeFilesystemFailureObservation: NodeFilesystemFailureObservationInterface = Object.freeze({
  observe: (thrownValue: unknown): NodeFilesystemFailureObservation => {
    const platformError = thrownValue instanceof Error ? thrownValue : undefined;
    const code = typeof thrownValue === 'object' && thrownValue !== null && 'code' in thrownValue
      ? thrownValue.code
      : undefined;
    const failureCode = code === 'ENOENT' ? filesystemFailureCodeFactory.missing()
      : code === 'EISDIR' ? filesystemFailureCodeFactory.isDirectory()
      : code === 'ENOTDIR' ? filesystemFailureCodeFactory.notDirectory()
      : code === 'EACCES' ? filesystemFailureCodeFactory.accessDenied()
      : code === 'EPERM' ? filesystemFailureCodeFactory.permissionDenied()
      : filesystemFailureCodeFactory.unrecognized();
    return Object.freeze({
      failureCode,
      failureName: stringValue.create(platformError?.name ?? 'NonErrorRejection'),
      failureMessage: stringValue.create(platformError?.message ?? 'Filesystem operation rejected with a non-Error value'),
    });
  },
});

/** Shared interface-first source reader; read failures remain explicit upstream ADTs. */
export const phpSourceDocumentReader: PhpSourceDocumentReaderInterface = Object.freeze({
  kind: 'php_source_document_reader',
  closed: true,
  contractVersion: 1,
  read: (input: PhpSourceDocumentReadInput): Promise<PhpSourceDocumentReadResult> =>
    fs.readFile(input.sourceFile.value.value, 'utf8').then(
      content => phpSourceDocumentReadResultFactory.complete(
        phpSourceTextFactory.create(stringValue.create(content)).bindTo(input.sourceFile),
      ),
      failure => phpSourceDocumentReadResultFactory.blocked(
        input.sourceFile,
        nodeFilesystemFailureObservation.observe(failure).failureCode.createSourceReadBlocker(input.sourceFile),
      ),
    ),
});
