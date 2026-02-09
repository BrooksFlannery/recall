#!/usr/bin/env bash
#
# Lint only changed files in the repository.
# For PRs, compares against the base branch. For other events, compares against main.
# Falls back to linting everything if no changed files are found.

set -euo pipefail

# Determine the base commit to compare against
if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] || [ "${GITHUB_EVENT_NAME:-}" = "merge_group" ]; then
  # For PRs and merge groups, fetch the base branch and compare against it
  BASE_REF="${GITHUB_BASE_REF:-main}"
  echo "Fetching base branch: $BASE_REF"
  git fetch origin "$BASE_REF" --depth=1 || git fetch origin "$BASE_REF"
  BASE_COMMIT="origin/$BASE_REF"
elif [ -n "${GITHUB_SHA:-}" ]; then
  # For push events, compare against the previous commit
  # If this is the first commit, we'll lint everything
  BASE_COMMIT="${GITHUB_SHA}~1"
  if ! git rev-parse --verify "$BASE_COMMIT" >/dev/null 2>&1; then
    echo "No previous commit found, linting all files"
    BASE_COMMIT=""
  fi
else
  # For local runs or workflow_dispatch, compare against main
  BASE_COMMIT="origin/main"
  if ! git rev-parse --verify "$BASE_COMMIT" >/dev/null 2>&1; then
    echo "Base commit not found, linting all files"
    BASE_COMMIT=""
  fi
fi

# Get changed files if we have a base commit
if [ -n "$BASE_COMMIT" ]; then
  # Get all changed files (including deleted, modified, added, renamed)
  CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR "$BASE_COMMIT" HEAD 2>/dev/null || echo "")
  
  if [ -z "$CHANGED_FILES" ]; then
    echo "No changed files found, linting all files"
    BASE_COMMIT=""
  else
    # Filter to only lintable files (TypeScript, JavaScript, JSON, CSS, etc.)
    LINTABLE_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|tsx|js|jsx|json|css|mjs|cjs)$' || true)
    
    if [ -z "$LINTABLE_FILES" ]; then
      echo "No lintable files changed, skipping lint"
      exit 0
    fi
    
    # Filter out files that don't exist (deleted files)
    EXISTING_FILES=""
    while IFS= read -r file; do
      if [ -f "$file" ]; then
        EXISTING_FILES="${EXISTING_FILES}${file}"$'\n'
      fi
    done <<< "$LINTABLE_FILES"
    EXISTING_FILES=$(echo "$EXISTING_FILES" | sed '/^$/d')
    
    if [ -z "$EXISTING_FILES" ]; then
      echo "All changed lintable files were deleted, skipping lint"
      exit 0
    fi
    
    echo "Linting changed files:"
    echo "$EXISTING_FILES" | sed 's/^/  - /'
    
    # Convert newline-separated list to space-separated for biome
    FILES_TO_LINT=$(echo "$EXISTING_FILES" | tr '\n' ' ')
    
    # Run biome lint on changed files only
    bun run biome lint $FILES_TO_LINT
    exit 0
  fi
fi

# Fallback: lint everything
echo "Linting all files (fallback)"
bun run lint
