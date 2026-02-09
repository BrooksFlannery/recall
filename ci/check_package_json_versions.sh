#!/usr/bin/env bash
#
# Check that package.json does not contain caret (^) version prefixes.
# All dependencies should use explicit versions for deterministic installs.

set -euo pipefail

PACKAGE_JSON="package.json"

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Error: $PACKAGE_JSON not found" >&2
  exit 1
fi

# Check for caret prefixes in dependency versions
# This regex matches: "package-name": "^version" or "package-name": "^version",
CARET_MATCHES=$(grep -E '^\s*"[^"]+":\s*"\^' "$PACKAGE_JSON" || true)

if [ -n "$CARET_MATCHES" ]; then
  echo "Error: package.json contains caret (^) version prefixes. Use explicit versions instead." | tee -a "$GITHUB_STEP_SUMMARY" >&2
  echo "" | tee -a "$GITHUB_STEP_SUMMARY" >&2
  echo "Found caret versions:" | tee -a "$GITHUB_STEP_SUMMARY" >&2
  echo "$CARET_MATCHES" | tee -a "$GITHUB_STEP_SUMMARY" >&2
  echo "" | tee -a "$GITHUB_STEP_SUMMARY" >&2
  echo "Example fix: Change \"^1.2.3\" to \"1.2.3\"" | tee -a "$GITHUB_STEP_SUMMARY" >&2
  exit 1
fi

echo "✓ package.json uses explicit versions (no caret prefixes)"
