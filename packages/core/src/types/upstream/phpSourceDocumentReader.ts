import fs from 'node:fs/promises';
import {
  phpSourceDocumentReadResultFactory,
  phpSourceTextFactory,
  type PhpSourceDocumentReadInput,
  type PhpSourceDocumentReadResult,
  type PhpSourceDocumentReaderInterface,
} from './phpSourceFrontendInterface';
import { filesystemFailureCodeFactory, type FilesystemFailureCode } from './filesystemFailureInterface';
import { stringValue, type StringValue } from './valueObjects';

export interface NodeFilesystemFailureObservation {
  readonly failureCode: FilesystemFailureCode;
  readonly failureName: StringValue;
  readonly failureMessage: StringValue;
}

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

export const phpSourceDocumentReader: PhpSourceDocumentReaderInterface = Object.freeze({
  kind: 'php_source_document_reader',
  closed: true,
  contractVersion: 1,
  read: (input: PhpSourceDocumentReadInput): Promise<PhpSourceDocumentReadResult> =>
    fs.readFile(input.sourceFile.value.value, 'utf8').then(
      content => phpSourceDocumentReadResultFactory.complete(
        phpSourceTextFactory.create(stringValue.create(content)).bindTo(input.sourceFile),
      ),
      failure => nodeFilesystemFailureObservation.observe(failure)
        .failureCode
        .createSourceReadBlocker(input.sourceFile)
        .blockRequestedRead(),
    ),
});

