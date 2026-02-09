---
name: biome-custom-rules
description: Guidelines for creating effective custom Biome linter rules using GritQL. Covers the Documented Exception Pattern, rule design principles, common patterns, and maintenance strategies. Use when writing new custom linter rules, updating existing rules, or reviewing rule effectiveness.
license: MIT
compatibility: Requires Biome 1.0+ with GritQL plugin support
metadata:
  version: 1.0.0
  category: linting
  related-files:
    - BIOME_CUSTOM_RULES.md
    - biome.json
    - plugins/*.grit
---

# Skill: Writing Custom Biome Linter Rules

Guidelines for creating effective custom linter rules using Biome's GritQL plugin system. This skill codifies best practices, patterns, and maintenance strategies for custom rules in this codebase.

## When to Use

- Writing new custom Biome linter rules
- Updating existing custom rules
- Reviewing rule effectiveness and exception cases
- Deciding whether a rule should use the Documented Exception Pattern
- Testing and validating new rules

## The Documented Exception Pattern

For rules that aren't 100% absolute but should still be strictly enforced, use the **Documented Exception Pattern**.

### Pattern Structure

The error message should:

1. **State the rule clearly** - What should be done instead
2. **Acknowledge exceptions exist** - "If truly exceptional..."
3. **Require documentation** - Instruct developers to:
   - Use `@ts-expect-error` to suppress TypeScript errors
   - Update the rule's error message itself to document the exception case

### Example Implementation

```gritql
engine biome(1.0)
language js

`if ($x === null)` as $check where {
  register_diagnostic(
    span=$check, 
    message="Direct null checks are discouraged. Use Option/Either patterns instead. If truly exceptional, use @ts-expect-error and update this error message to explicitly state the type of situation that makes breaking this rule acceptable.", 
    severity="error"
  )
}
```

### When to Use This Pattern

✅ **Use when:**
- The rule is generally correct but may have edge cases
- You want strict enforcement but acknowledge reality
- Exception cases should be documented and tracked
- You want the rule to evolve based on real-world usage

❌ **Don't use when:**
- The rule should be absolute (e.g., "no console.log in production")
- Exceptions are already well-documented elsewhere
- The rule is too complex to benefit from this pattern

### Pattern Evolution

The rule's error message evolves as exceptions are discovered:

**Initial:**
```
"Direct null checks are discouraged. Use Option/Either patterns instead. If truly exceptional, use @ts-expect-error and update this error message..."
```

**After exceptions:**
```
"Direct null checks are discouraged. Use Option/Either patterns instead. Exceptions: (1) Third-party library APIs that return null, (2) React refs that may be null during initial render. If truly exceptional, use @ts-expect-error and update this error message..."
```

## Rule Design Principles

1. **Be Specific** - Catch real problems, not style preferences
2. **Provide Context** - Error messages should explain why the rule exists
3. **Allow Suppression** - But require justification via Documented Exception Pattern
4. **Evolve Over Time** - Rules should improve based on usage and discovered exceptions
5. **Use Error Severity** - Rules are hard and fast, not suggestions (use `severity="error"`)

## Common Patterns

### Test Quality Rules

Pattern for rules that apply only to test files:

```gritql
engine biome(1.0)
language js

// Applied via biome.json override to test files only
JsImportCallExpression() as $import where {
  register_diagnostic(span=$import, message="...", severity="error")
}
```

**Examples:**
- `no-dynamic-imports-in-tests.grit` - Forbid dynamic imports
- `no-toBeDefined-or-toBeTruthy-in-tests.grit` - Enforce precise assertions
- `no-spyOn-in-tests.grit` - Ban spyOn (with Documented Exception Pattern)
- `no-explicit-any-in-tests.grit` - Ban explicit any types

### Type Safety Rules

Pattern for enforcing type-safe patterns:

```gritql
engine biome(1.0)
language js

`$name: any` as $type where {
  register_diagnostic(
    span=$type, 
    message="Explicit 'any' type is not allowed. Use specific types, 'unknown', or proper type inference. If truly exceptional, use @ts-expect-error and update this error message to document the exception case.", 
    severity="error"
  )
}
```

### Functional Programming Pattern Rules

Pattern for enforcing FP patterns (Option/Either usage):

```gritql
engine biome(1.0)
language js

// Example: Enforce Option/Either over nullable returns
`function $name($params): $returnType` as $func where {
  $returnType <: contains `| null` or $returnType <: contains `| undefined`,
  register_diagnostic(
    span=$func, 
    message="Functions should return Option<T> or Either<E, T> instead of | null or | undefined. If truly exceptional, use @ts-expect-error and update this error message to explicitly state the type of situation that makes breaking this rule acceptable.", 
    severity="error"
  )
}
```

**Examples:**
- `enforce-option-either-usage.grit` - Enforce Option/Either over nullable returns
- `no-direct-null-checks.grit` - Discourage direct null checks
- `no-unhandled-option-either.grit` - Ensure Option/Either values are handled

### Deprecation Rules

Pattern for enforcing API deprecations:

```gritql
engine biome(1.0)
language js

`z.nativeEnum($args)` as $call where {
  register_diagnostic(
    span=$call, 
    message="z.nativeEnum() is deprecated in Zod 4. Use z.enum() instead.", 
    severity="error"
  )
}
```

## Implementation Checklist

Before adding a new rule:

- [ ] Rule catches a real problem (not just style preference)
- [ ] Error message is clear and actionable
- [ ] Rule uses appropriate severity (`error` for hard rules)
- [ ] Documented Exception Pattern applied if rule may have exceptions
- [ ] Rule is tested on existing codebase
- [ ] Rule is added to `biome.json` overrides with correct file patterns
- [ ] Rule file is created in `plugins/` directory
- [ ] Rule is documented in `BIOME_CUSTOM_RULES.md`
- [ ] Suppression mechanism is documented (biome-ignore or @ts-expect-error)

## Rule File Structure

Each rule should be a `.grit` file in the `plugins/` directory:

```
plugins/
├── rule-name.grit          # Active rule
└── rule-name-hibernated.grit  # Hibernated rule (commented out)
```

### Hibernated Rules

For rules that aren't ready to activate (patterns haven't emerged yet):

1. Create the rule file with implementation
2. Comment out the entire rule with explanation
3. Add hibernation note explaining when to enable
4. Include stubbed/placeholder specifics (file paths, function names, etc.)
5. Add commented override in `biome.json`

Example hibernation header:

```gritql
// HIBERNATION NOTE: This rule is ready but not active.
// Enable this rule once [specific condition] emerges in the codebase.
// Update [specific placeholders] to match actual patterns.
//
// [commented rule implementation]
```

## Maintenance Guidelines

### Regular Review

- Review exception cases periodically (quarterly or as needed)
- Update error messages as exceptions are discovered
- Consider splitting rules if exceptions become too common
- Remove rules that are no longer relevant

### Exception Documentation

When a developer uses `@ts-expect-error` with a rule:

1. They should update the rule's error message
2. Add the exception case to the error message
3. Keep exception list organized (numbered or bulleted)
4. Be specific about when the exception applies

### Rule Evolution

Rules should evolve based on:

- Real-world usage patterns
- Discovered legitimate exceptions
- Changes in codebase patterns
- Feedback from developers

## Testing Custom Rules

1. **Test on existing codebase** - Run biome lint to see what the rule catches
2. **Verify false positives** - Ensure rule doesn't flag legitimate code
3. **Test suppressions** - Verify suppression mechanisms work
4. **Check edge cases** - Test with various code patterns

## Related Documentation

- `BIOME_CUSTOM_RULES.md` - Current rules and decisions
- `biome.json` - Biome configuration with rule overrides
- `plugins/*.grit` - Individual rule implementations
- `whats-a-skill.md` - Discussion of the Documented Exception Pattern

## Examples from This Codebase

### Active Rules

See `BIOME_CUSTOM_RULES.md` for complete list. Current active rules include:

- Test quality: `no-dynamic-imports-in-tests`, `no-toBeDefined-or-toBeTruthy-in-tests`, `no-spyOn-in-tests`, `no-explicit-any-in-tests`
- Type safety: `no-zod-native-enum`
- FP patterns: `enforce-option-either-usage`, `no-direct-null-checks`, `no-unhandled-option-either`

### Hibernated Rules

- `no-raw-drizzle-business-logic.grit` - Enable when database access patterns emerge
- `deterministic-idempotency-keys.grit` - Enable when idempotency key functions are identified

## Suppression Patterns

### Biome Suppression

```typescript
// biome-ignore lint/plugin: <justification>
```

### TypeScript Suppression (with Documented Exception Pattern)

```typescript
// @ts-expect-error - [specific exception case]
// Update rule error message to document this exception
```

## Best Practices Summary

1. ✅ Use Documented Exception Pattern for non-absolute rules
2. ✅ Keep error messages clear and actionable
3. ✅ Use `severity="error"` for hard rules
4. ✅ Test rules on existing codebase before enabling
5. ✅ Document rules in `BIOME_CUSTOM_RULES.md`
6. ✅ Hibernate rules that aren't ready (with clear activation criteria)
7. ✅ Evolve rules based on real-world usage
8. ✅ Keep rule files focused and well-commented
