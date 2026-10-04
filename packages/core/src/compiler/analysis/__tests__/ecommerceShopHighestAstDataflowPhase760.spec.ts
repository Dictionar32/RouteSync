import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { classifyPhpBlock } from '../../scanner/lexer/astClassifier';
import { tokenizePhpSource } from '../../scanner/lexer/tokenizer';
import { producePhpAstSemanticKnowledgeDataFlow } from '../../scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter';
import { createAstDataflowInterface } from '../astDataflowAuthority';
import type { AstNodeIdentity } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';

const root = `${process.cwd()}/examples/ecommerce-shop-source`;
const sourceFile = `${root}/app/Http/Controllers/OrderController.php`;

const sourceSpan: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: sourceFile }) }),
  start: Object.freeze({ kind: 'number_value', value: 0 }),
  end: Object.freeze({ kind: 'number_value', value: 1000 }),
});

const node: AstNodeIdentity = Object.freeze({
  kind: 'ast_node_identity',
  node: 'controller_ast',
  source: sourceSpan,
});

describe('ecommerce-shop highest AST dataflow Phase 760', () => {
  test('keeps Laravel ecommerce model/request/resource/controller facts as source workload', () => {
    const request = readFileSync(`${root}/app/Http/Requests/StoreOrderRequest.php`, 'utf8');
    const model = readFileSync(`${root}/app/Models/Order.php`, 'utf8');
    const resource = readFileSync(`${root}/app/Http/Resources/OrderResource.php`, 'utf8');
    const controller = readFileSync(sourceFile, 'utf8');

    expect(request).toContain("items.*.produk_item_id");
    expect(model).toContain('details(): HasMany');
    expect(model).toContain('payment(): HasOne');
    expect(resource).toContain('$this->details');
    expect(controller).toContain('$order = $this->getOrCreatePendingOrder($request);');
    expect(controller).toContain('new OrderResource($order->load');
  });

  test('elevates controller dataflow evidence into a closed upstream ADT', () => {
    const flowSource = [
      '$order = $this->getOrCreatePendingOrder($request);',
      '$this->recalculateTotal($order);',
      'return new OrderResource($order);',
    ].join(' ');
    const block = classifyPhpBlock(tokenizePhpSource(flowSource));
    const knowledge = producePhpAstSemanticKnowledgeDataFlow(block, sourceFile, 'parser');
    const dataflow = createAstDataflowInterface(node, sourceSpan, knowledge);

    expect(dataflow.judgment.kind).toBe('ast_dataflow_judgment');
    expect(dataflow.judgment.closed).toBe(true);
    expect(dataflow.judgment.fixedPoint).toBe('least_fixed_point');
    expect(dataflow.judgment.facts.length).toBeGreaterThan(0);
    expect(dataflow.judgment.closure.some(fact => fact.kind === 'reaches')).toBe(true);
  });
});
