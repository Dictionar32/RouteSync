import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const readSource = (relativePath: string): string => readFileSync(path.resolve(sourceRoot, relativePath), 'utf8');

describe('canonical controller identity phase 2220', () => {
  it('publishes controller identity as semantic knowledge instead of trusting the compiler projection', () => {
    const contract = readSource('types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
    const producer = readSource('compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');

    expect(contract).toContain('readonly controllerName: ControllerName;');
    expect(contract).toContain('readonly controllerName: ControllerName;');
    expect(contract).toContain('readonly version: 45;');
    expect(producer).toContain('controllerName: input.controller');
    expect(producer).toContain('version: 45 as const');
  });

  it('correlates route publication against canonical semantic identity only', () => {
    const authority = readSource('types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
    const routeScanner = readSource('compiler/scanner/wiring/laravelRouteScanner.ts');

    expect(authority).toContain('publication.controller.value.value === judgment.semantic.controllerName.value.value');
    expect(authority).toContain('readonly contractVersion: 2;');
    expect(authority).toContain("identityCorrelation: 'route-publication-controller-and-action-match-canonical-semantic-identity-without-consumer-projection-identity'");
    expect(authority).not.toContain('projectionIdentity');
    expect(routeScanner).toContain('correlationAuthority.judge({');
    expect(routeScanner).toContain('controller: semanticJudgment.semantic.controllerName');
    expect(routeScanner).toContain('action: semanticJudgment.semantic.actionName');
    expect(routeScanner).not.toContain('controller: semanticJudgment.projection.identity.controllerName');
    expect(routeScanner).not.toContain('action: semanticJudgment.projection.identity.actionName');
    expect(routeScanner).not.toContain('const matches = publications.filter');
  });
});
