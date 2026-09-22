import fs from 'fs'
import { ManifestEnricher } from './packages/cli/src/generators/layers/utils/manifest-enricher'

const manifest = JSON.parse(fs.readFileSync('./test-engine-manifest.json', 'utf-8'))

console.log(`Loaded manifest: ${manifest.routes.length} routes\n`)

const enriched = ManifestEnricher.enrich(manifest)

console.log('=== Resources found ===')
for (const resource of enriched.resources || []) {
    console.log(`\n--- ${resource.name} (base: ${resource.baseModel}) ---`)
    console.log('endpoints:', resource.endpoints)
    console.log('fields:')
    for (const [key, field] of Object.entries(resource.fields)) {
        console.log(`  ${key}:`, JSON.stringify(field))
    }
}
