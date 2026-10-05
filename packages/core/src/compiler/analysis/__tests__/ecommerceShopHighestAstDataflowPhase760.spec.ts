import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { classifyPhpBlock } from '../../scanner/lexer/astClassifier';
import { tokenizePhpSource } from '../../scanner/lexer/tokenizer';
import { producePhpAstSemanticKnowledgeDataFlow } from '../../scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter';
import { createSemanticDataflowJudgment } from '../astDataflowAuthority';
import { semanticDataflowInterfaceFromJudgment } from '../../../types/upstream/semanticDataflowInterface';
import { createSemanticDataflowInput } from '../../scanner/upstream/semanticDataflowInputAdapter';
import type { SourceSpan } from '../../../types/upstream/provenance';

const fixtureRoot = path.resolve(__dirname, '../../../../../sdk/tests/fixtures/ecommerce-shop-source');
const sourceFile = path.join(fixtureRoot, 'app/Http/Controllers/OrderController.php');
const requestFile = path.join(fixtureRoot, 'app/Http/Requests/StoreOrderRequest.php');
const modelFile = path.join(fixtureRoot, 'app/Models/Order.php');
const resourceFile = path.join(fixtureRoot, 'app/Http/Resources/OrderResource.php');
const routeFile = path.join(fixtureRoot, 'routes/web.php');

const requestSource = readFileSync(requestFile, 'utf8');
const modelSource = readFileSync(modelFile, 'utf8');
const resourceSource = readFileSync(resourceFile, 'utf8');
const controllerSource = readFileSync(sourceFile, 'utf8');
const routeSource = readFileSync(routeFile, 'utf8');

const sourceSpan: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: sourceFile }) }),
  start: Object.freeze({ kind: 'number_value', value: 0 }),
  end: Object.freeze({ kind: 'number_value', value: 1000 }),
});

describe('ecommerce-shop highest AST dataflow Phase 760', () => {
  test('keeps Laravel ecommerce model/request/resource/controller facts as source workload', () => {
    expect(requestSource).toContain("items.*.produk_item_id");
    expect(modelSource).toContain('recalculateTotal(): void');
    expect(resourceSource).toContain('public readonly Order $order');
    expect(controllerSource).toContain('$order->recalculateTotal();');
    expect(controllerSource).toContain("#[Middleware('admin')]");
    expect(controllerSource).toContain("#[Authorize('update', [Order::class, 'order'])]");
    expect(routeSource).toContain("Route::middleware('auth')");
    expect(controllerSource).toContain('new OrderResource($order)');
  });

  test('elevates controller dataflow evidence into a closed upstream ADT', () => {
    const flowSource = controllerSource;
    const block = classifyPhpBlock(tokenizePhpSource(flowSource));
    const knowledge = producePhpAstSemanticKnowledgeDataFlow(block, sourceFile, 'parser');
    const anchor = {
      kind: 'semantic_dataflow_identity' as const,
      source: sourceSpan,
      role: 'scope' as const,
      slot: { kind: 'string_value' as const, value: 'controller' },
    };
    const input = createSemanticDataflowInput(anchor, sourceSpan, knowledge);
    const judgment = createSemanticDataflowJudgment(input);
    const dataflow = semanticDataflowInterfaceFromJudgment(judgment);

    expect(dataflow.judgment.kind).toBe('semantic_dataflow_judgment');
    expect(dataflow.judgment.closed).toBe(true);
    expect(dataflow.judgment.fixedPoint).toBe('least_fixed_point');
    expect(dataflow.judgment.facts.length).toBeGreaterThan(0);
    expect(dataflow.judgment.closure.some(fact => fact.kind === 'reaches')).toBe(true);
  });
});
