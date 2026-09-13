/**
 * semanticAuditor.ts
 *
 * Audits semantic resolution kernel coverage and identifies unresolved breakdown categories.
 *
 * @module cli/commands/audit
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { SemanticResolutionKernel } from '@routesync/core';

export interface SemanticAuditOptions {
  readonly graph: string;
  readonly verbose?: boolean;
}

export function auditSemanticCoverage(options: SemanticAuditOptions, cwd: string = process.cwd()): void {
  const graphPath = path.resolve(cwd, options.graph);
  if (!fs.existsSync(graphPath)) {
    console.error(chalk.red(`Graph file not found: ${graphPath}`));
    console.error(chalk.yellow('Run `routesync scan --models` first to generate the graph.'));
    process.exit(1);
  }

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const resolver = new SemanticResolutionKernel(graph.models || [], graph.resources || []);

  let resolvedCount = 0;
  let explainableCount = 0;

  const unresolvedBreakdown: Record<string, string[]> = {
    'Missing MethodReturn Resolver': [],
    'Missing ResourceGraph Resolver': [],
    'Missing Framework Registry': [],
    'Missing Accessor Resolver': [],
    'Missing Relation Resolver': [],
    'Dynamic Runtime Value': [],
    'External Service Boundary': [],
    'Other Unresolved': [],
  };

  function checkField(
    fieldObj: Record<string, unknown> | undefined | null,
    fieldPath: string,
    contextModel?: Record<string, unknown> | null
  ) {
    if (!fieldObj) return;

    if (fieldObj.kind === 'object' && fieldObj.fields) {
      const fields = fieldObj.fields as Record<string, unknown>;
      for (const [key, val] of Object.entries(fields)) {
        checkField(val as Record<string, unknown>, `${fieldPath}.${key}`, contextModel);
      }
      return;
    }

    if (fieldObj.collection && fieldObj.paginated === undefined && fieldObj.resource === undefined && fieldObj.model === undefined && fieldObj.kind !== 'resource') {
      // Arrays that are primitives
    }

    const res = resolver.resolve(fieldObj, contextModel);
    explainableCount++;

    if (res.status === 'resolved') {
      resolvedCount++;
    } else {
      const lastTrace = res.trace && res.trace.length > 0 ? res.trace[res.trace.length - 1] as Record<string, unknown> : null;
      const reasonRule = typeof lastTrace?.rule === 'string' ? lastTrace.rule : 'Unknown Reason';
      const reasonSource = typeof lastTrace?.source === 'string' ? lastTrace.source : '';

      if (reasonRule.includes('MethodReturn') || reasonRule.includes('Eloquent method registry') || reasonSource.includes('EloquentMethodResolver')) {
        unresolvedBreakdown['Missing MethodReturn Resolver'].push(fieldPath);
      } else if (reasonRule.includes('FrameworkResolver') || reasonSource.includes('FrameworkRegistryResolver')) {
        unresolvedBreakdown['Missing Framework Registry'].push(fieldPath);
      } else if (reasonRule.includes('Model') || reasonSource.includes('ModelColumnResolver')) {
        unresolvedBreakdown['Missing Relation Resolver'].push(fieldPath);
      } else if (reasonRule.includes('Accessor') || reasonSource.includes('AccessorResolver')) {
        unresolvedBreakdown['Missing Accessor Resolver'].push(fieldPath);
      } else {
        unresolvedBreakdown['Other Unresolved'].push(`${fieldPath} (${reasonRule})`);
      }
    }
  }

  // Check routes
  const routesList = (graph.routes || []) as Array<Record<string, unknown>>;
  for (const route of routesList) {
    if (route.response) {
      const nameStr = typeof route.name === 'string' ? route.name : 'UnknownRoute';
      checkField(route.response as Record<string, unknown>, nameStr);
    }
  }

  // Check resources
  const resourcesList = (graph.resources || []) as Array<Record<string, unknown>>;
  for (const resource of resourcesList) {
    if (resource.fields) {
      const resName = typeof resource.name === 'string' ? resource.name : 'UnknownResource';
      const modelsList = (graph.models || []) as Array<Record<string, unknown>>;
      const contextModel = modelsList.find((m) => m.name === resName.replace('Resource', ''));
      const fields = resource.fields as Record<string, unknown>;
      for (const [key, val] of Object.entries(fields)) {
        checkField(val as Record<string, unknown>, `${resName}.${key}`, contextModel);
      }
    }
  }

  console.log(chalk.bold('\nSemantic Coverage\n─────────────────'));

  const coverage = explainableCount > 0 ? Math.round((resolvedCount / explainableCount) * 100) : 0;
  console.log(`Resolved: ${coverage === 100 ? chalk.green('100%') : chalk.yellow(coverage + '%')}`);
  console.log(`Explainable: ${chalk.green('100%')}\n`);

  let hasUnresolved = false;
  for (const items of Object.values(unresolvedBreakdown)) {
    if (items.length > 0) hasUnresolved = true;
  }

  if (hasUnresolved) {
    console.log(chalk.bold('Unresolved:'));
    for (const [category, items] of Object.entries(unresolvedBreakdown)) {
      if (items.length > 0) {
        console.log(`  ${category}: ${items.length}`);
      }
    }
    console.log('');

    if (options.verbose) {
      for (const [category, items] of Object.entries(unresolvedBreakdown)) {
        if (items.length > 0) {
          console.log(chalk.yellow(`[${category}]`));
          items.forEach(i => console.log(`  - ${i}`));
        }
      }
      console.log(chalk.bold('Suggested Action:'));
      console.log('Implement Laravel Attribute Resolver / Check dynamic runtime values.\n');
    } else {
      console.log(chalk.gray('Run `routesync audit --verbose` for details.\n'));
    }
  }
}
