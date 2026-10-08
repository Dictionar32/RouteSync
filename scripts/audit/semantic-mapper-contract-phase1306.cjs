const fs = require('node:fs');
const failures = [];
const pass = [];
const read = rel => fs.readFileSync(rel, 'utf8');
function must(rel, needle, label) { if (read(rel).includes(needle)) pass.push(label); else failures.push(`${rel}: missing ${label}`); }
function mustNot(rel, pattern, label) { if (new RegExp(pattern).test(read(rel))) failures.push(`${rel}: mapper reclassification remains: ${label}`); else pass.push(label); }

must('packages/core/src/types/upstream/semanticMapping.ts', 'SemanticMappingContractInterface', 'semantic mapping contract interface');
must('packages/core/src/types/upstream/semanticMapping.ts', 'MapperWiringInterface', 'mapper upstream wiring interface');
must('packages/core/src/types/interfaces/mapperProjectionInterface.ts', 'MapperProjectionInterface', 'mapper projection interface');
must('packages/core/src/types/upstream/semanticMapping.ts', 'SemanticReasoningContract', 'mapper carries reasoning proof');
must('packages/core/src/compiler/scanner/subscanners/request-deriver/semanticMappingDeriver.ts', 'deriveSemanticMappingContract', 'single upstream mapping producer');
must('packages/core/src/compiler/artifacts/ResourceMappersArtifact.ts', 'MapperProjectionTarget', 'closed mapper artifact wiring target');
must('packages/core/src/compiler/passes/MapperGeneratorPass.ts', "ResourceMappers", 'mapper pass consumes semantic mapping artifact');
must('packages/core/src/compiler/passes/mapper/mapperAssembler.ts', "dependencies: ['ResourceMappers']", 'generated mapper lineage points to semantic mapping artifact');
must('packages/core/src/compiler/projectors/MapperProjector.ts', 'ResourceMappersArtifact', 'mapper projector consumes semantic mapping artifact');
mustNot('packages/core/src/compiler/passes/mapper/resourceRegistry.ts', 'RequestType|resolveMappingIntent|toPascalResourceName|toCamelPropertyName|toPascalResponseTypeName', 'generator does not derive semantic mapping/naming');
mustNot('packages/core/src/compiler/passes/mapper/readMapperBuilder.ts', 'resolveMappingIntent|toCamelPropertyName|toPascalResourceName|SemanticType', 'read mapper does not infer mapping');
mustNot('packages/core/src/compiler/passes/mapper/formMapperBuilder.ts', 'RequestType|toPascalResourceName|toPascalCase|resolveMappingIntent', 'form mapper does not infer mapping');
const result = { audit:'semantic-mapper-contract-phase1306', topology:'Laravel semantic evidence -> reasoning -> MapperContract -> ResourceMappersArtifact -> MapperWiring -> projector', passed: failures.length === 0, passedChecks: pass.length, failures };
process.stdout.write(JSON.stringify(result, null, 2)+'\n');
process.exitCode = failures.length ? 1 : 0;
