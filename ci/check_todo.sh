#!/usr/bin/env bash
#
# Check for TODO comments in the codebase.
# TODO is used for tasks that should be done before merging a PR; if you want to leave a message in the codebase, use FIXME.

set -euo pipefail

# This allows us to leave TODO comments in this file and have them still be
# picked up by this script without having the script itself trigger false
# positives. The alternative would be to exclude this script entirely, which
# would mean that we couldn't use TODO comments in this script.
KEYWORD="TODO"

# Make sure `rg` is installed (if this fails, `set -e` above will cause the
# script to exit).
rg --version >/dev/null

# -H: Print filename (default for multiple files/recursive)
# -n: Print line number
# -w: Match whole words
# Exclude this script itself and common directories that might have TODO comments
output=$(rg -H -n -w "$KEYWORD" --glob '!ci/check_todo.sh' --glob '!node_modules/**' --glob '!.next/**' --glob '!.git/**' || true)

if [ -n "$output" ]; then
  echo "Found $KEYWORD markers in the codebase." >&2
  echo "$KEYWORD is used for tasks that should be done before merging a PR; if you want to leave a message in the codebase, use FIXME." >&2
  echo "" >&2
  echo "$output" >&2
  exit 1
fi
