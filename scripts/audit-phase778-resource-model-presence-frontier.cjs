const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const knowledge = path.join(root, 'packages/core/src/compiler/scanner/subscanners/resource/resourceModelKnowledgeDataFlow.ts');
const resolver = path.join(root, 'packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts');

const knowledgeText = fs.readFileSync(knowledge, 'utf8');
const resolverText = fs.readFileSync(resolver, 'utf8');
const combined = `${knowledgeText}\n${resolverText}`;

const canonicalPresenceBoundary =
  /viaRelation:\s*Presence<RelationName>/.test(knowledgeText) &&
  !/viaRelation\?:\s*RelationName/.test(knowledgeText) &&
  /viaRelation,/.test(knowledgeText);

const noOptionalRawRelation = !/viaRelation\?/.test(knowledgeText);
const noUndefinedPresenceConstruction = !/presenceOf\(viaRelation\)/.test(knowledgeText);
const allFactoriesCarryPresence = [...resolverText.matchAll(/createResourceModelResolutionFact\(([^\n]+)\)/g)]
  .map(match => match[1])
  .every(args => args.split(',').length >= 4);
const noParsedDescriptor = !/Parsed[A-Za-z]+Descriptor/.test(combined);
const noFreeUndefined = !/\bundefined\b/.test(combined);

const result = {
  phase: 778,
  resourceModelKnowledge: {
    canonicalPresenceBoundary,
    noOptionalRawRelation,
    noUndefinedPresenceConstruction,
    allFactoriesCarryPresence,
    noParsedDescriptor,
    noFreeUndefined,
  },
  allPass: canonicalPresenceBoundary && noOptionalRawRelation && noUndefinedPresenceConstruction && allFactoriesCarryPresence && noParsedDescriptor && noFreeUndefined,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.allPass ? 0 : 1);
