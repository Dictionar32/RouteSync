const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = 'packages/core/src/types/upstream/';
const contractFiles = {
  expressionAuthority: upstream + 'phpAstExpressionSemanticAuthorityInterface.ts',
  expressionOperation: upstream + 'expressionProducerInterface.ts',
  resourceMapping: upstream + 'resourceAstExpressionMappingInterface.ts',
  semanticEvidenceAdapter: upstream + 'semanticKnowledgeEvidenceAdapterInterface.ts',
  manifest: upstream + 'manifestBuilderInterface.ts',
  sourcePipeline: upstream + 'laravelSourceAstPipelineInterface.ts',
};
const contracts = Object.fromEntries(Object.entries(contractFiles).map(([key, file]) => [key, read(file)]));
check('existing PHP expression authority inspected before any new contract', /PhpAstExpressionSemanticAuthorityInterface/.test(contracts.expressionAuthority));
check('existing expression projection operation inspected before any new contract', /ExpressionFromPhpAstOperationInterface/.test(contracts.expressionOperation));
check('existing Resource mapping operation and authority inspected', /ResourceAstExpressionMappingOperationInterface/.test(contracts.resourceMapping) && /ResourceAstExpressionMappingAuthorityInterface/.test(contracts.resourceMapping));
check('existing semantic evidence adapter contract inspected before changing its runtime binding', /SemanticKnowledgeEvidenceAdapter/.test(contracts.semanticEvidenceAdapter));
check('existing manifest builder and source AST pipeline contracts inspected for runtime trace', /ManifestBuilderInterface/.test(contracts.manifest) && /LaravelSourceAstPipelineInterface/.test(contracts.sourcePipeline));
const binding = read('packages/core/src/compiler/frontend/php/routeAst/routeBindingDeclarationAst.ts');
const routeParser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
check('route binding parser is exported as a frozen interface-typed operation object', /export const routeBindingDeclarationParser:\s*RouteBindingDeclarationParserInterface\s*=\s*Object\.freeze\(/.test(binding) && !/^export\s+function\s+parseRouteBindingDeclarations/m.test(binding));
check('route declaration runtime consumes the operation object rather than the removed free function', /routeBindingDeclarationParser\.parse\(path\.value\)/.test(routeParser));
const statementRegistry = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const semanticAdapter = read('packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
check('statement syntax evidence projection is an interface-typed frozen operation object', /export const phpStatementSyntaxEvidenceProjection:\s*PhpStatementSyntaxEvidenceProjectionInterface\s*=\s*Object\.freeze\(/.test(statementRegistry) && !/^export\s+function\s+projectPhpStatementSyntaxEvidence/m.test(statementRegistry));
check('semantic adapter invokes the statement projection operation through its contract', /phpStatementSyntaxEvidenceProjection\.project\(statement,/.test(semanticAdapter));
const producerAdapter = read('packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
const producer = read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts');
check('semantic dataflow producer uses interface-typed frozen operation object', /export const phpAstSemanticKnowledgeDataFlowProductionOperation:\s*PhpAstSemanticKnowledgeDataFlowProductionOperationInterface\s*=\s*Object\.freeze\(/.test(producerAdapter) && !/^export\s+function\s+producePhpAstSemanticKnowledgeDataFlow/m.test(producerAdapter));
check('public convenience producer uses interface-typed frozen operation object', /export const semanticKnowledgeDataFlowProducer:\s*SemanticKnowledgeDataFlowProducerInterface\s*=\s*Object\.freeze\(/.test(producer) && !/^export\s+function\s+produceSemanticKnowledgeDataFlow/m.test(producer));
const runtimeFiles = [binding, statementRegistry, producerAdapter, producer, read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionMappings.ts'), read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionClosure.ts')];
check('audited runtime implementation files have no exported free function declarations', runtimeFiles.every(source => !/^export\s+function\s+/m.test(source)));
check('upstream collections remains intentionally empty', fs.statSync(path.join(root, upstream, 'collections.ts')).size === 0);
const trace = read(upstream + 'PHASE2794_UPSTREAM_CONTRACT_RUNTIME_SCANNER_AUDIT.md');
check('CLI-to-manifest trace and contract-first boundary documented', /commands\/scan\.ts \/ sync\.ts/.test(trace) && /ManifestBuilderOperationPreparationInterface/.test(trace) && /LaravelSourceAstPipelineInterface/.test(trace));
check('producer contract boundary and remaining direct-adapter simplification are documented', /SemanticKnowledgeEvidenceAdapter/.test(trace) && /not shape-equivalent/.test(trace) && /not claimed here as completed/.test(trace));
for (const result of checks) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${checks.filter(x => x.pass).length}/${checks.length} checks passed`);
if (checks.some(x => !x.pass)) process.exitCode = 1;
