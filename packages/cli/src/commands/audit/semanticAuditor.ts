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
import { ModelControllerMap, ModelNodeMap, ModelServiceMap } from '@routesync/core';
import type { ServiceGraph, ServiceResult } from '@routesync/core';

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

  const serialized = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const graph: ServiceGraph = {
    services: ModelServiceMap.fromEntries(serialized.services.entries),
    controllers: ModelControllerMap.fromEntries(serialized.controllers.entries),
    models: ModelNodeMap.fromEntries(serialized.models.entries),
    edges: serialized.edges,
  };
  const serviceEntries = graph.services.entries;

  let serviceMethodCount = 0;
  let serviceExpressionMethodCount = 0;
  let serviceVoidMethodCount = 0;
  let serviceExpressionCount = 0;

  for (const entry of serviceEntries) {
    const service = entry.service;
    const methods = service.methods;
    for (const method of methods) {
      serviceMethodCount++;
      const result: ServiceResult = method.result;

      if (result.kind === 'expressions') {
        serviceExpressionMethodCount++;
        let items = result.items;
        while (items.kind === 'cons') {
          serviceExpressionCount++;
          items = items.tail;
        }
      } else {
        serviceVoidMethodCount++;
      }
    }
  }

  console.log(chalk.bold('\nService Graph Coverage\n──────────────────────'));
  console.log(`Methods: ${serviceMethodCount}`);
  console.log(`Methods with return expressions: ${serviceExpressionMethodCount}/${serviceMethodCount}`);
  console.log(`Void methods: ${serviceVoidMethodCount}`);
  console.log(`Resolved return expressions carried to consumer: ${serviceExpressionCount}\n`);

  if (options.verbose) {
    console.log(chalk.bold('Service Result ADT'));
    for (const entry of serviceEntries) {
      const service = entry.service;
      for (const method of service.methods) {
        const methodName = `${service.name.value.value}.${method.name.value.value}`;
        console.log(`  ${methodName}: ${JSON.stringify(method.result)}`);
      }
    }
    console.log('');
  }
}
