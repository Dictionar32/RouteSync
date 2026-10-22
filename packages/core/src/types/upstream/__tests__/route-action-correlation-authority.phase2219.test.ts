import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const readSource = (relativePath: string): string => readFileSync(path.resolve(sourceRoot, relativePath), 'utf8');

describe('route action correlation authority phase 2219', () => {
  it('owns route/action matching and validates canonical publication provenance upstream', () => {
    const authority = readSource('types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
    const scanner = readSource('compiler/scanner/wiring/laravelRouteScanner.ts');
    const contract = readSource('types/upstream/laravelControllerScannerInterface.ts');
    const routeComposition = readSource('compiler/scanner/upstream/routeDeclarationComposition.ts');

    expect(authority).toContain('interface ControllerActionRouteCorrelationAuthorityInterface');
    expect(authority).toContain('publicationCoherence');
    expect(authority).toContain('sameSourceSpan(publication.source, judgment.semantic.source)');
    expect(authority).toContain('publication.controller.value.value === judgment.semantic.controllerName.value.value');
    expect(authority).toContain("kind: 'invalid_action_judgment_publication'");
    expect(routeComposition).toContain('correlationAuthority.judge({');
    expect(scanner).not.toContain('const matches = publications.filter');
    expect(contract).toContain("readonly kind: 'invalid_action_judgment_publication'");
    expect(contract).toContain('readonly controllerName: ControllerName;');
    expect(contract).toContain('readonly controllerIdentityCorrelation:');
  });

  it('preserves invalid provenance as an unresolved route request instead of treating it as no request', () => {
    const boundary = readSource('compiler/scanner/upstream/routeDeclarationComposition.ts');
    const request = readSource('types/domain/request.ts');
    const endpoint = readSource('types/upstream/endpointBindings.ts');

    expect(boundary).toContain("reason: 'action_judgment_provenance_invalid'");
    expect(request).toContain("'action_judgment_provenance_invalid'");
    expect(endpoint).toContain("'action_judgment_provenance_invalid'");
  });
});
