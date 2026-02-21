#!/bin/bash
# Install git hooks from .githooks directory

set -e

SOURCE_HOOKS_DIR=".githooks"

if [ ! -d "$SOURCE_HOOKS_DIR" ]; then
  echo "❌ .githooks directory not found"
  exit 1
fi

# Find the actual git directory (works for both regular repos and worktrees)
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || echo "")

if [ -z "$GIT_DIR" ]; then
  echo "❌ Not in a git repository"
  exit 1
fi

GIT_HOOKS_DIR="$GIT_DIR/hooks"

# Create hooks directory if it doesn't exist (needed for worktrees)
mkdir -p "$GIT_HOOKS_DIR"

# Install each hook from .githooks
for hook in "$SOURCE_HOOKS_DIR"/*; do
  if [ -f "$hook" ]; then
    hook_name=$(basename "$hook")
    target="$GIT_HOOKS_DIR/$hook_name"
    
    echo "📦 Installing git hook: $hook_name"
    cp "$hook" "$target"
    chmod +x "$target"
  fi
done

echo "✅ Git hooks installed successfully"
