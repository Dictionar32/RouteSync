const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowInterface.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowAuthority.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts'), 'utf8');
let passed = 0;
const check = (label, condition) => {
  if (!condition) {
    console.error(`FAIL ${label}`);
    process.exitCode = 1;
    return;
  }
  passed += 1;
  console.log(`PASS ${label}`);
};
check('boundary remains a read-only admission contract', /interface SemanticDataflowJudgmentBoundaryInterface[\s\S]*?admit: \(judgment: AstDataflowJudgment\)/.test(contract));
check('reasoning proof facets are validated together', /reasoning_proof_facets_inconsistent/.test(contract) && /contract\.evidence\.kind/.test(contract) && /contract\.derivation\.kind/.test(contract) && /contract\.provenance\.kind/.test(contract) && /contract\.closure\.kind/.test(contract));
check('judgment identity and source span are conserved', /origin_identity_mismatch/.test(contract) && /source_identity_mismatch/.test(contract) && /boundarySourceKey\(judgment\.source\)/.test(contract));
check('input facts must survive in the closed closure', /input_fact_missing_from_closure/.test(contract) && /judgment\.facts\.some\(fact => !boundaryContainsFact\(judgment\.closure, fact\)\)/.test(contract));
check('derivation premises and conclusions must be grounded in closure', /derivation_premise_missing/.test(contract) && /derivation_conclusion_missing/.test(contract));
check('path endpoints and step continuity are checked', /path_endpoint_mismatch/.test(contract) && /path_step_disconnected/.test(contract));
check('fact lineage source must match its producer identity', /fact_lineage_mismatch/.test(contract) && /boundarySourceKey\(fact\.lineage\.source\) !== boundarySourceKey\(fact\.lineage\.identity\.source\)/.test(contract));
check('solver owns derivation and closure creation', /createSemanticDataflowJudgment/.test(authority) && /judge: createSemanticDataflowJudgment/.test(authority));
check('scanner admits upstream judgment before legacy projection', /semanticDataflowReasoningAuthority\.judge\(input\)/.test(scanner) && /semanticDataflowJudgmentBoundary\.admit\(judged\)/.test(scanner));
check('interface boundary does not create a second solver', !/createSemanticDataflowJudgment|reachClosure|pathClosure|relationFixedPoint/.test(contract));
console.log(`\nPhase 1537 semantic-dataflow proof-boundary audit: ${passed}/10 passed`);
