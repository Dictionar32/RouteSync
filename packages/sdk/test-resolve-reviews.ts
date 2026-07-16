import { SemanticResolutionKernel } from '../core/src/index'
import { normalizeManifest } from '../cli/src/generators/normalizer'
import fs from 'fs-extra'
import path from 'path'
import { PhpCodeParser } from '../cli/src/parsers/PhpCodeParser'

async function debug() {
  const manifestPath = '/home/annas-zen/Documents/laragon-docker/www/toko-online/routesync.manifest.json'
  if (!await fs.pathExists(manifestPath)) {
    console.error('Manifest not found at', manifestPath)
    return
  }

  const manifest = await fs.readJson(manifestPath)
  const kernel = new SemanticResolutionKernel()
  normalizeManifest(manifest, kernel)

  // Find the POST reviews route
  const postRoute = manifest.routes.find((r: any) => r.name === 'produk_id_reviews.post')
  if (!postRoute) {
    console.error('POST reviews route not found')
    return
  }

  console.log('--- Route assignments ---')
  console.log(postRoute.assignments)

  // Parsed assignments for the route
  const routeAssignments: Record<string, any> = {}
  if (postRoute.assignments) {
    for (const [varName, code] of Object.entries(postRoute.assignments)) {
      routeAssignments[varName] = PhpCodeParser.parseExpression(code as string, {})
    }
  }

  const context = {
    layer: 'route',
    fileName: postRoute.name,
    modelMap: {},
    relationMap: {},
    assignments: routeAssignments
  }

  // Resolve $review->title
  const titleAst = postRoute.response.fields.data.fields.title
  console.log('\n--- Resolving title AST ---', JSON.stringify(titleAst, null, 2))
  const resolvedTitle = kernel.resolve(titleAst, context)
  console.log('Result:', JSON.stringify(resolvedTitle, null, 2))

  // Resolve $review->comment
  const commentAst = postRoute.response.fields.data.fields.comment
  console.log('\n--- Resolving comment AST ---')
  const resolvedComment = kernel.resolve(commentAst, context)
  console.log('Result:', JSON.stringify(resolvedComment, null, 2))
}

debug().catch(console.error)
