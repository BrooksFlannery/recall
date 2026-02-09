#!/bin/bash
# Install git hooks from .githooks directory

set -e

GIT_HOOKS_DIR=".git/hooks"
SOURCE_HOOKS_DIR=".githooks"

if [ ! -d "$SOURCE_HOOKS_DIR" ]; then
  echo "❌ .githooks directory not found"
  exit 1
fi

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "❌ .git/hooks directory not found. Are you in a git repository?"
  exit 1
fi

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
