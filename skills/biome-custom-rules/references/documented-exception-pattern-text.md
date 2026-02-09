# Documented Exception Pattern - Standard Text

This file contains the standard text to use when implementing the Documented Exception Pattern in Biome custom rules.

## Standard Exception Text

When a rule uses the Documented Exception Pattern, include this text at the end of the error message:

```
If truly exceptional, use @ts-expect-error and update this error message to explicitly state the type of situation that makes breaking this rule acceptable.
```

## Usage in GritQL Rules

Since GritQL doesn't support string interpolation or constants, you'll need to include this text directly in each error message. Copy this text verbatim to ensure consistency across all rules.

## Example

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

## Variations

If you need to customize the text slightly for context, maintain the core elements:
- "If truly exceptional..."
- "use @ts-expect-error"
- "update this error message to explicitly state the type of situation"

## Why No Constants?

GritQL doesn't support:
- String interpolation (e.g., `${VARIABLE}`)
- Constants or variables in error messages
- Template strings with embedded expressions

Error messages must be static strings. This is a limitation of the GritQL language itself.
