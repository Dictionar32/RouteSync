import type { SourceFile } from './names';
import { laravelControllerSourceDiscoveryBlockerFactory, type LaravelControllerSourceDiscoveryBlocker } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import { phpSourceDocumentReadBlockerFactory, type PhpSourceDocumentReadBlocker } from './phpSourceFrontendInterface';

/** Inputs needed to turn normalized filesystem failure evidence into a controller-discovery blocker. */
export interface FilesystemFailureDiscoveryBlockerInput {
  readonly root: SourceFile;
  readonly directory: SourceFile;
  readonly location: FilesystemFailureLocation;
  readonly failure: unknown;
}

/** Filesystem failure codes own the domain operation that settles discovery after a read failure. */
export interface FilesystemFailureCodeOperations {
  readonly createDiscoveryBlocker: (input: FilesystemFailureDiscoveryBlockerInput) => LaravelControllerSourceDiscoveryBlocker;
  readonly createSourceReadBlocker: (sourceFile: SourceFile) => PhpSourceDocumentReadBlocker;
}

export type FilesystemFailureCode =
  | (Readonly<{ readonly kind: 'filesystem_failure_code_missing' }> & FilesystemFailureCodeOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_code_is_directory' }> & FilesystemFailureCodeOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_code_not_directory' }> & FilesystemFailureCodeOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_code_access_denied' }> & FilesystemFailureCodeOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_code_permission_denied' }> & FilesystemFailureCodeOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_code_unrecognized' }> & FilesystemFailureCodeOperations);

export interface FilesystemFailureCodeFactoryInterface {
  readonly missing: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_missing' }>;
  readonly isDirectory: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_is_directory' }>;
  readonly notDirectory: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_not_directory' }>;
  readonly accessDenied: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_access_denied' }>;
  readonly permissionDenied: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_permission_denied' }>;
  readonly unrecognized: () => Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_unrecognized' }>;
}

const missingCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_missing' }> = Object.freeze({
  kind: 'filesystem_failure_code_missing',
  createDiscoveryBlocker: input => input.location.createMissingPathBlocker(input.root, input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.fileMissing(sourceFile),
});
const isDirectoryCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_is_directory' }> = Object.freeze({
  kind: 'filesystem_failure_code_is_directory',
  createDiscoveryBlocker: input => laravelControllerSourceDiscoveryBlockerFactory.pathNotDirectory(input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.pathNotFile(sourceFile),
});
const notDirectoryCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_not_directory' }> = Object.freeze({
  kind: 'filesystem_failure_code_not_directory',
  createDiscoveryBlocker: input => laravelControllerSourceDiscoveryBlockerFactory.pathNotDirectory(input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.pathNotFile(sourceFile),
});
const accessDeniedCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_access_denied' }> = Object.freeze({
  kind: 'filesystem_failure_code_access_denied',
  createDiscoveryBlocker: input => laravelControllerSourceDiscoveryBlockerFactory.directoryUnreadable(input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.fileUnreadable(sourceFile),
});
const permissionDeniedCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_permission_denied' }> = Object.freeze({
  kind: 'filesystem_failure_code_permission_denied',
  createDiscoveryBlocker: input => laravelControllerSourceDiscoveryBlockerFactory.directoryUnreadable(input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.fileUnreadable(sourceFile),
});
const unrecognizedCode: Extract<FilesystemFailureCode, { readonly kind: 'filesystem_failure_code_unrecognized' }> = Object.freeze({
  kind: 'filesystem_failure_code_unrecognized',
  createDiscoveryBlocker: input => laravelControllerSourceDiscoveryBlockerFactory.failureCodeUnrecognized(input.directory, input.failure),
  createSourceReadBlocker: sourceFile => phpSourceDocumentReadBlockerFactory.failureCodeUnrecognized(sourceFile),
});

/** Existing upstream contract owns filesystem failure classification after the platform boundary. */
export const filesystemFailureCodeFactory: FilesystemFailureCodeFactoryInterface = Object.freeze({
  missing: () => missingCode,
  isDirectory: () => isDirectoryCode,
  notDirectory: () => notDirectoryCode,
  accessDenied: () => accessDeniedCode,
  permissionDenied: () => permissionDeniedCode,
  unrecognized: () => unrecognizedCode,
});

export interface FilesystemFailureLocationOperations {
  readonly createMissingPathBlocker: (
    root: SourceFile,
    directory: SourceFile,
    failure: unknown,
  ) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_root_missing' | 'controller_source_discovery_directory_missing' }>;
}

export type FilesystemFailureLocation =
  | (Readonly<{ readonly kind: 'filesystem_failure_location_root'; readonly source: SourceFile }> & FilesystemFailureLocationOperations)
  | (Readonly<{ readonly kind: 'filesystem_failure_location_directory'; readonly source: SourceFile }> & FilesystemFailureLocationOperations);

export interface FilesystemFailureLocationFactoryInterface {
  readonly root: (source: SourceFile) => Extract<FilesystemFailureLocation, { readonly kind: 'filesystem_failure_location_root' }>;
  readonly directory: (source: SourceFile) => Extract<FilesystemFailureLocation, { readonly kind: 'filesystem_failure_location_directory' }>;
}

export const filesystemFailureLocationFactory: FilesystemFailureLocationFactoryInterface = Object.freeze({
  root: source => {
    const evidence = Object.freeze({ kind: 'filesystem_failure_location_root' as const, source });
    return Object.freeze({
      ...evidence,
      createMissingPathBlocker: (root, _directory, failure) => laravelControllerSourceDiscoveryBlockerFactory.rootMissing(root, failure),
    });
  },
  directory: source => {
    const evidence = Object.freeze({ kind: 'filesystem_failure_location_directory' as const, source });
    return Object.freeze({
      ...evidence,
      createMissingPathBlocker: (_root, directory, failure) => laravelControllerSourceDiscoveryBlockerFactory.directoryMissing(directory, failure),
    });
  },
});
