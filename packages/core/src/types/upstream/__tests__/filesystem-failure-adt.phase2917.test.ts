import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory, stringValue } from '../names';
import { filesystemFailureCodeFactory, filesystemFailureLocationFactory } from '../filesystemFailureInterface';
import { nodeFilesystemFailureObservation } from '../../../compiler/scanner/wiring/phpSourceDocumentReader';

const root = sourceFileIdentityFactory.create(stringValue.create('/project'));
const directory = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers'));
const failure = Object.freeze({ kind: 'filesystem_failure_evidence' });

const context = (location: ReturnType<typeof filesystemFailureLocationFactory.root> | ReturnType<typeof filesystemFailureLocationFactory.directory>) => Object.freeze({
  root,
  directory,
  location,
  failure,
});

describe('upstream filesystem failure domain operations', () => {
  it('shares one typed Node failure observation across runtime consumers', () => {
    const missing = nodeFilesystemFailureObservation.observe(Object.assign(new Error('missing route file'), { code: 'ENOENT' }));
    expect(missing.failureCode.kind).toBe('filesystem_failure_code_missing');
    expect(missing.failureName.value).toBe('Error');
    expect(missing.failureMessage.value).toBe('missing route file');
  });

  it('retains a closed diagnostic when a filesystem adapter rejects with a non-Error value', () => {
    const observation = nodeFilesystemFailureObservation.observe(Object.freeze({ code: 'EACCES' }));
    expect(observation.failureCode.kind).toBe('filesystem_failure_code_access_denied');
    expect(observation.failureName.value).toBe('NonErrorRejection');
    expect(observation.failureMessage.value).toBe('Filesystem operation rejected with a non-Error value');
  });
  it('maps missing failure to the location-owned blocker operation', () => {
    expect(filesystemFailureCodeFactory.missing().createDiscoveryBlocker(context(filesystemFailureLocationFactory.root(root))).kind)
      .toBe('controller_source_discovery_root_missing');
    expect(filesystemFailureCodeFactory.missing().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory))).kind)
      .toBe('controller_source_discovery_directory_missing');
  });

  it('maps every filesystem failure code to the correct source-read blocker', () => {
    expect(filesystemFailureCodeFactory.missing().createSourceReadBlocker(directory).kind).toBe('php_source_document_file_missing');
    expect(filesystemFailureCodeFactory.isDirectory().createSourceReadBlocker(directory).kind).toBe('php_source_document_path_not_file');
    expect(filesystemFailureCodeFactory.notDirectory().createSourceReadBlocker(directory).kind).toBe('php_source_document_path_not_file');
    expect(filesystemFailureCodeFactory.accessDenied().createSourceReadBlocker(directory).kind).toBe('php_source_document_file_unreadable');
    expect(filesystemFailureCodeFactory.permissionDenied().createSourceReadBlocker(directory).kind).toBe('php_source_document_file_unreadable');
    expect(filesystemFailureCodeFactory.unrecognized().createSourceReadBlocker(directory).kind).toBe('php_source_document_failure_code_unrecognized');
  });

  it('maps directory-kind failures to explicit discovery blockers', () => {
    expect(filesystemFailureCodeFactory.isDirectory().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory))).kind)
      .toBe('controller_source_discovery_path_not_directory');
    expect(filesystemFailureCodeFactory.notDirectory().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory))).kind)
      .toBe('controller_source_discovery_path_not_directory');
  });

  it('maps access failures to unreadable blockers', () => {
    expect(filesystemFailureCodeFactory.accessDenied().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory))).kind)
      .toBe('controller_source_discovery_directory_unreadable');
    expect(filesystemFailureCodeFactory.permissionDenied().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory))).kind)
      .toBe('controller_source_discovery_directory_unreadable');
  });

  it('preserves an explicit blocker for unrecognized filesystem failures', () => {
    const blocker = filesystemFailureCodeFactory.unrecognized().createDiscoveryBlocker(context(filesystemFailureLocationFactory.directory(directory)));
    expect(blocker.kind).toBe('controller_source_discovery_failure_code_unrecognized');
    expect(blocker).toHaveProperty('failure', failure);
  });
});
