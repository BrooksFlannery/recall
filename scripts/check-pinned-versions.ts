/**
 * Enforces that all entries in `dependencies` and `devDependencies` use exact
 * (pinned) version strings. Ranges like `^1.2.3`, `~1.2.3`, `>=1.2.3`, `*`,
 * or tags like `latest` are rejected.
 *
 * Run automatically as part of the pre-commit hook via `bun run pre-commit`.
 * Can also be invoked directly: `bun run check:versions`
 */

import pkg from "../package.json"

const DYNAMIC_PREFIX = /^[\^~>]/
const DYNAMIC_TAG = new Set(["latest", "next", "canary", "*"])

const allDeps: Record<string, string> = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
}

const unpinned = Object.entries(allDeps).filter(
  ([, version]) => DYNAMIC_PREFIX.test(version) || DYNAMIC_TAG.has(version),
)

if (unpinned.length > 0) {
  console.error("❌ Unpinned dependency versions detected:")
  for (const [name, version] of unpinned) {
    console.error(`   ${name}: "${version}"`)
  }
  console.error(
    '\nAll versions must be exact (e.g. "1.2.3" not "^1.2.3"). ' +
      "Remove the range prefix or tag before committing.",
  )
  process.exit(1)
}

console.log("✓ All dependency versions are pinned.")
