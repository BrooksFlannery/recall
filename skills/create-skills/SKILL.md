---
name: create-skills
description: Guide for creating new Agent Skills following the Agent Skills format specification. Use when creating a new skill, structuring skill directories, writing SKILL.md files with proper frontmatter, or organizing skill-related documentation and scripts.
license: MIT
compatibility: Follows Agent Skills format from agentskills.io
metadata:
  version: 1.0.0
  category: meta
  related-files:
    - SKILLS_STRUCTURE_ANALYSIS.md
    - skills/*/SKILL.md
---

# Skill: Creating Agent Skills

Guide for creating new Agent Skills that follow the [Agent Skills format specification](https://agentskills.io/specification). This meta-skill helps you structure, document, and organize skills for AI coding agents.

## When to Use

- Creating a new skill for the codebase
- Structuring skill directories and files
- Writing SKILL.md files with proper frontmatter
- Organizing skill documentation and scripts
- Ensuring skills follow the specification

## Directory Structure

Create skills in the `skills/` directory at the project root:

```
skills/
└── skill-name/              # Directory name matches skill name
    ├── SKILL.md             # Required: Main skill definition
    ├── references/           # Optional: Detailed documentation
    │   └── detailed-doc.md
    ├── scripts/              # Optional: Executable helper scripts
    │   └── helper.sh
    └── assets/               # Optional: Templates, images, configs
        └── template.json
```

### Naming Conventions

- **Directory name**: Must match the skill `name` in frontmatter exactly
- **Format**: lowercase letters, digits, hyphens only
- **Constraints**: 
  - 1-64 characters
  - Can't start or end with hyphen
  - No consecutive hyphens
  - Examples: `biome-custom-rules`, `create-skills`, `fp-patterns`

## SKILL.md Format

### Required Structure

1. **YAML Frontmatter** (between `---` delimiters at the top)
2. **Markdown Body** (instructions/content after frontmatter)

### Required Frontmatter Fields

```yaml
---
name: skill-name              # Required: 1-64 chars, matches directory name
description: Brief description # Required: 1-1024 chars, explains what AND when
---
```

**Description Guidelines:**
- Must explain **what** the skill does
- Must explain **when** to use it
- Keep it concise but informative
- Examples:
  - ✅ "Guidelines for creating custom Biome linter rules. Use when writing new rules or updating existing ones."
  - ❌ "Custom linter rules" (too vague, missing "when")

### Optional Frontmatter Fields

```yaml
---
name: skill-name
description: ...
license: MIT                    # Optional: License name or reference
compatibility: Node.js 18+      # Optional: Requirements (max ~500 chars)
metadata:                        # Optional: Key-value map
  version: 1.0.0
  author: Your Name
  category: linting
allowed-tools: read_file write_file  # Optional: Space-delimited tool list
---
```

### Frontmatter Validation

- Only these fields are allowed: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`
- `name` must match directory name exactly
- All required fields must be present
- Character limits must be respected

## Body Content Guidelines

### Structure Recommendations

1. **Overview/Introduction** - What the skill does
2. **When to Use** - Specific scenarios (bulleted list)
3. **Instructions** - Step-by-step guidance
4. **Examples** - Input/output examples
5. **Edge Cases** - Special considerations
6. **Related Documentation** - Links to other files

### Content Guidelines

- ✅ Keep main SKILL.md under ~500 lines
- ✅ Move detailed docs to `references/` subdirectory
- ✅ Include practical examples
- ✅ Be specific about when to use the skill
- ✅ Reference related files and documentation
- ❌ Don't duplicate information available elsewhere
- ❌ Don't make it too long (split into references/)

## Implementation Checklist

Before considering a skill complete:

- [ ] Directory created: `skills/skill-name/`
- [ ] `SKILL.md` created with proper frontmatter
- [ ] `name` matches directory name exactly
- [ ] `description` explains what AND when
- [ ] All required frontmatter fields present
- [ ] Body content is clear and actionable
- [ ] Examples included (if applicable)
- [ ] Related files referenced
- [ ] Optional subdirectories created if needed (`references/`, `scripts/`, `assets/`)
- [ ] Skill tested/validated

## Example: Complete Skill Structure

### Directory Structure

```
skills/
└── example-skill/
    ├── SKILL.md
    ├── references/
    │   └── detailed-patterns.md
    └── scripts/
        └── validate.sh
```

### SKILL.md Template

```markdown
---
name: example-skill
description: Brief description of what this skill does and when to use it. Should be 1-1024 characters and explain both the purpose and usage scenarios.
license: MIT
compatibility: Node.js 18+, requires network access
metadata:
  version: 1.0.0
  category: example
---

# Skill: Example Skill

## Overview

Detailed explanation of the skill's purpose and capabilities.

## When to Use

- Scenario 1: When you need to...
- Scenario 2: When working with...
- Scenario 3: When reviewing...

## Instructions

Step-by-step instructions for the agent...

### Step 1: Do this
[Instructions]

### Step 2: Then do that
[Instructions]

## Examples

### Example 1: Basic Usage
[Input/Output examples]

### Example 2: Advanced Usage
[Input/Output examples]

## Edge Cases

[Documentation of edge cases and special considerations]

## Related Documentation

- `references/detailed-patterns.md` - Detailed pattern documentation
- `BIOME_CUSTOM_RULES.md` - Related rules (if applicable)
- Other relevant files
```

## Common Patterns

### Skill for Code Patterns

When documenting coding patterns or best practices:

```markdown
## When to Use

- Writing new [component/function/feature]
- Reviewing existing code
- Refactoring [specific area]

## The Pattern

[Explanation of the pattern]

## Examples

### ✅ Good
[Good example]

### ❌ Bad
[Bad example]
```

### Skill for Tool Usage

When documenting how to use tools or processes:

```markdown
## When to Use

- [Specific task 1]
- [Specific task 2]

## Prerequisites

- [Requirement 1]
- [Requirement 2]

## Step-by-Step

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

## Best Practices

1. **Be Specific** - Clearly define what the skill does and when to use it
2. **Include Examples** - Show practical usage, not just theory
3. **Reference Related Files** - Link to detailed docs, configs, etc.
4. **Keep It Focused** - One skill = one clear purpose
5. **Update Regularly** - Skills should evolve with the codebase
6. **Test Instructions** - Make sure the skill's instructions actually work

## Integration with Project

Skills should integrate with existing project documentation:

- Reference relevant files (e.g., `AGENTS.md`, `BIOME_CUSTOM_RULES.md`)
- Link to code examples when applicable
- Connect to project standards and conventions
- Update related documentation when skills change

## Maintenance

- Review skills periodically for accuracy
- Update examples as codebase evolves
- Remove or archive obsolete skills
- Consolidate related skills if they overlap

## Related Skills

- `biome-custom-rules` - For creating custom linter rules
- (Add other related skills as they're created)

## References

- [Agent Skills Specification](https://agentskills.io/specification)
- `SKILLS_STRUCTURE_ANALYSIS.md` - Analysis of the format
- Existing skills in `skills/` directory for examples
