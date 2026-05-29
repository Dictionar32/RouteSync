#!/bin/bash
set -e

echo "🔨 Building all packages..."
pnpm build

echo ""
echo "📦 Publishing packages in dependency order..."

publish_pkg() {
  local pkg=$1
  echo ""
  echo "→ Publishing $pkg..."
  pnpm publish --filter "$pkg" --no-git-checks --access public
}

publish_pkg @routesync/core
publish_pkg @routesync/sdk
publish_pkg @routesync/react
publish_pkg @routesync/vue
publish_pkg @routesync/cli

echo ""
echo "✅ All packages published!"
