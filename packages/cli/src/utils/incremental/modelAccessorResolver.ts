/**
 * modelAccessorResolver.ts
 *
 * Resolves Eloquent model accessors and syncs back to kernel model graph.
 *
 * @module cli/utils/incremental/modelAccessorResolver
 */

import { PhpCodeParser } from '../../parsers/PhpCodeParser';
import { ScannedManifest, ScannedModel, KernelResolver } from './incrementalTypes';
import { IRNodeRegistrar } from './fieldResolver';

export function resolveModelAccessors(
  manifest: ScannedManifest,
  kernel: KernelResolver,
  registerIRNode: IRNodeRegistrar
): void {
  if (!manifest.models) return;

  manifest.models.forEach((model: ScannedModel) => {
    if (model.accessors) {
      for (const key in model.accessors) {
        const accessor = model.accessors[key];
        if (accessor) {
          let resolved: Record<string, unknown> | null = null;
          let parsedAst: unknown = null;
          let exprCode = accessor.expression || accessor.expression_code || null;

          if (typeof exprCode === 'string' && exprCode.trim()) {
            parsedAst = PhpCodeParser.parseExpression(exprCode);
            const context = {
              layer: 'model',
              fileName: model.name,
              modelMap: {},
              relationMap: {},
              assignments: {}
            };
            resolved = kernel.resolve(parsedAst, context);
          }

          if ((!resolved || resolved.status === 'unknown') && accessor.type && accessor.type !== 'mixed') {
            resolved = {
              status: 'resolved',
              type: accessor.type,
              confidence: 100,
              trace: [{ source: 'ReflectionScanner', input: key, output: accessor.type, rule: 'Reflection return type signature' }]
            };
          }

          if (!resolved) {
            resolved = {
              status: 'unknown',
              type: 'unknown',
              confidence: 0,
              trace: []
            };
          }

          model.accessors[key] = {
            source: { file: accessor.sourceFile ?? '', line: accessor.sourceLine ?? undefined },
            ast: parsedAst,
            semantic: resolved
          };

          if (resolved.status !== 'unknown') {
            registerIRNode(
              `model:${model.name}#accessors.${key}`,
              { file: accessor.sourceFile ?? '', line: accessor.sourceLine ?? undefined, context: 'model' },
              typeof exprCode === 'string' ? exprCode : '',
              resolved,
              [`model:${model.name}`]
            );
          }
        }
      }
    }
  });

  // Sync resolved accessors back to the kernel's model graph
  if (kernel.getModels) {
    const kernelModels = kernel.getModels();
    manifest.models.forEach((model: ScannedModel) => {
      if (model.accessors) {
        const target = kernelModels.find((m: Record<string, unknown>) => m.name === model.name);
        if (target) {
          target.accessors = model.accessors;
        }
      }
    });
  }
}
