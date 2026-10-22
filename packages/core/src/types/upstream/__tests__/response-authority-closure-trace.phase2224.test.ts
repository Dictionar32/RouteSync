import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../../../../..');
const responseInterface = readFileSync(resolve(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'), 'utf8');
const responsePipeline = readFileSync(resolve(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts'), 'utf8');
const actionContract = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts'), 'utf8');
const responseAttributeScanner = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/controller/responseAttributeScanner.ts'), 'utf8');
const controllerScanner = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');

describe('Phase 2224 integrated response authority closure trace', () => {
  it('keeps integrated response judgment and execution on the existing upstream interface', () => {
    expect(responseInterface).toContain('interface LaravelControllerResponseSemanticPipelineInterface');
    expect(responseInterface).toContain('readonly judgeIntegratedResponse:');
    expect(responseInterface).toContain('readonly responseExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface');
    expect(responsePipeline).toContain('judgeIntegratedResponse');
  });

  it('preserves invocation-to-response integration in the existing Laravel controller scanner', () => {
    expect(controllerScanner).toContain('responseSemanticPipeline.judgeIntegratedResponse');
    expect(controllerScanner).toContain('invocationJudgment');
  });

  it('retires action-level response descriptor derivation in favor of the existing integrated response authority', () => {
    expect(actionContract).not.toContain('resolveResponseAttributeAst');
    expect(actionContract).not.toContain('function resolveResponse(');
    expect(actionContract).not.toContain('readonly response: ResponseDescriptor');
    expect(responseAttributeScanner).not.toContain('resolveResponseAttributeAst');
    expect(responsePipeline).toContain('judgeIntegratedResponse');
  });
});
