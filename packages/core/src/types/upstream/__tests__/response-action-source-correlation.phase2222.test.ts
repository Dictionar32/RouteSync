import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../../../../..');
const responseInterface = readFileSync(resolve(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'), 'utf8');
const responsePipeline = readFileSync(resolve(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts'), 'utf8');
const responseScanner = readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/responseScanner.ts'), 'utf8');

describe('Phase 2222 canonical action/response source correlation', () => {
  it('requires canonical action publications at the existing method response projection boundary', () => {
    expect(responseInterface).toContain('readonly actionJudgments: readonly ControllerActionJudgmentPublication[]');
    expect(responseInterface).toContain("readonly kind: 'controller_method_response_action_correlation_rejected'");
    expect(responseInterface).toContain('readonly actionCorrelationRule:');
  });

  it('matches action identity and exact source span before producing a response AST', () => {
    expect(responsePipeline).toContain('publication.judgment.semantic.actionName.value.value === product.method.action.action.value.value');
    expect(responsePipeline).toContain('publication.judgment.semantic.source.file.value.value === product.method.source.file.value.value');
    expect(responsePipeline).toContain('publication.judgment.semantic.source.start.value === product.method.source.start.value');
    expect(responsePipeline).toContain('publication.judgment.semantic.source.end.value === product.method.source.end.value');
    expect(responsePipeline).toContain("reason: 'ambiguous_action_judgments'");
    expect(responsePipeline).toContain('actionJudgment, outputTypeJudgment, definition, ast');
  });

  it('feeds the canonical artifact publications into projection and suppresses rejected ASTs', () => {
    expect(responseScanner).toContain('actionJudgments: artifact.actionJudgments');
    expect(responseScanner).toContain("projection.kind === 'controller_method_response_ast_projection_complete'");
  });
});
