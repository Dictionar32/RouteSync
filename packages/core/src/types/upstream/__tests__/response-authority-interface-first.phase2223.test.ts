import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../../../../..');
const responseInterface = readFileSync(resolve(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'), 'utf8');
const responseScanner = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/responseScanner.ts'), 'utf8');
const scannerExecutor = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');

describe('Phase 2223 interface-first response authority', () => {
  it('keeps integrated response meaning on the existing upstream pipeline contract', () => {
    expect(responseInterface).toContain('interface LaravelControllerResponseSemanticPipelineInterface');
    expect(responseInterface).toContain('readonly judgeIntegratedResponse:');
    expect(responseInterface).toContain('readonly responseExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface');
    expect(responseInterface).toContain('readonly astProjection: LaravelControllerAstProjectionSemanticAuthorityInterface');
  });

  it('keeps scanner mechanics free of semantic relation/foundation dependencies', () => {
    expect(responseScanner).not.toContain('semantic/relations');
    expect(responseScanner).not.toContain('semantic/foundation');
    expect(responseScanner).toContain('responsePipeline.methodResponseAstProjection.project');
  });

  it('retains the integrated response judgment call in the existing controller scanner executor', () => {
    expect(scannerExecutor).toContain('responseSemanticPipeline.judgeIntegratedResponse');
  });
});
