// @ts-nocheck
/**
 * Functional Programming Patterns - Idiomatic Code Examples
 *
 * Reference guide for using Option, Either, and pipe in this codebase.
 * Patterns to follow and anti-patterns to avoid.
 *
 * @fileoverview
 * Note: Functions in this file are examples only and intentionally unused.
 * Unused variable warnings are expected and acceptable for example code.
 * Type checking is disabled for this file to allow intentional unused examples.
 */

import {
  type Either,
  flatMap,
  flatMapEither,
  fromNullable,
  getOrElse,
  isSome,
  left,
  map,
  mapEither,
  mapLeft,
  match,
  matchEither,
  none,
  type Option,
  pipe,
  right,
  some,
} from "./fp"

// ============================================================================
// Option: Chaining Operations
// ============================================================================

// ✅ DO: Use pipe with flatMap for sequential operations
const _getUserData = (userId: number): Option<string> =>
  pipe(
    getUser(userId),
    flatMap(getUserProfile),
    flatMap(getProfileEmail),
    map((email) => email.toLowerCase())
  )

// ❌ DON'T: Nest flatMap calls or use imperative conditionals
// const getUserData = (userId: number) => {
//   const user = getUser(userId)
//   if (isSome(user)) {
//     const profile = getUserProfile(user.value)
//     if (isSome(profile)) {
//       // ...
//     }
//   }
// }

// ✅ DO: Use map for transformations that don't return Options
const _formatUser = (userId: number): Option<string> =>
  pipe(
    getUser(userId),
    map((user) => `${user.name} (${user.id})`)
  )

// ❌ DON'T: Use flatMap when map suffices
// pipe(getUser(userId), flatMap(user => some(formatUser(user))))

// ============================================================================
// Option: Extracting Values
// ============================================================================

// ✅ DO: Use match for explicit handling of both cases
const _displayUser = (userId: number): string =>
  pipe(
    getUser(userId),
    match(
      () => "User not found",
      (user) => `Welcome, ${user.name}`
    )
  )

// ✅ DO: Use getOrElse for simple fallbacks
const _getUserName = (userId: number): string =>
  pipe(
    getUser(userId),
    map((u) => u.name),
    getOrElse("Unknown")
  )

// ❌ DON'T: Access .value without checking isSome
// const name = getUser(userId).value.name // Type error + runtime risk

// ============================================================================
// Option: Converting from Nullable
// ============================================================================

// ✅ DO: Use fromNullable for APIs that return null/undefined
const _parseInput = (input: string | null): Option<string> => fromNullable(input?.trim())

// ✅ DO: Convert find() results to Option
const _findUserById = (id: number): Option<User> => fromNullable(users.find((u) => u.id === id))

// ❌ DON'T: Return null/undefined from functions
// const findUser = (id: number): User | null => users.find(...)

// ============================================================================
// Either: Error Handling
// ============================================================================

// ✅ DO: Use Either for operations that can fail with meaningful errors
const parseNumber = (str: string): Either<string, number> => {
  const num = Number(str)
  return Number.isNaN(num) ? left("Invalid number format") : right(num)
}

// ✅ DO: Chain Either operations with flatMapEither
const _processData = (input: string): Either<string, ProcessedData> =>
  pipe(parseNumber(input), flatMapEither(validateRange), flatMapEither(transformData))

// ✅ DO: Use mapEither for transformations that can't fail
const _formatResult = (result: Either<string, number>): Either<string, string> =>
  pipe(
    result,
    mapEither((n) => `Result: ${n}`)
  )

// ❌ DON'T: Use Either for simple nullable cases (use Option)
// const getUser = (id: number): Either<"not found", User> => ...

// ============================================================================
// Either: Error Propagation
// ============================================================================

// ✅ DO: Let errors propagate through the chain
const _complexOperation = (input: string): Either<string, Output> =>
  pipe(
    parseInputEither(input),
    flatMapEither(validateInput),
    flatMapEither(transformInput),
    flatMapEither(validateOutput),
    mapEither(() => ({ result: "success" }))
    // If any step fails, entire chain returns left(error)
  )

// ✅ DO: Use mapLeft to transform error types
const _withErrorContext = (result: Either<string, ProcessedData>): Either<Error, ProcessedData> =>
  pipe(
    result,
    mapLeft((msg: string) => new Error(`Operation failed: ${msg}`))
  )

// ❌ DON'T: Catch and ignore errors in the middle of a chain
// pipe(
//   parseInput(input),
//   flatMapEither(x => getOrElseEither(defaultValue)(validate(x))) // Wrong!
// )

// ============================================================================
// Pipe: Composition Patterns
// ============================================================================

// ✅ DO: Keep pipe chains readable (3-5 operations max)
const _processUser = (id: number): Option<string> =>
  pipe(getUser(id), flatMap(getUserProfile), map(formatProfile))

// ✅ DO: Extract complex logic into named functions
const formatProfile = (profile: Profile): string => {
  // Complex formatting logic here
  return `${profile.userId} - ${profile.email}`
}

// ❌ DON'T: Create deeply nested pipes or inline complex logic
// pipe(
//   getUser(id),
//   flatMap(user => pipe(
//     getUserProfile(user),
//     map(profile => `${profile.name} - ${profile.email} - ${profile.bio}...`)
//   ))
// )

// ============================================================================
// Mixed: Option and Either
// ============================================================================

// ✅ DO: Convert Option to Either when you need error context
const requireUser = (userId: number): Either<string, User> => {
  const userOption = getUser(userId)
  // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
  return isSome(userOption) ? right(userOption.value) : left(`User ${userId} not found`)
}

// ✅ DO: Convert Either to Option when error details don't matter
const _getUserOption = (userId: number): Option<User> =>
  pipe(
    requireUser(userId),
    matchEither(
      () => none,
      (user) => some(user)
    )
  )

// ============================================================================
// Common Patterns
// ============================================================================

// Pattern: Safe property access
const _getNestedValue = (obj: { user?: { profile?: { email?: string } } }) =>
  pipe(
    fromNullable(obj.user),
    flatMap((user) => fromNullable(user.profile)),
    flatMap((profile) => fromNullable(profile.email))
  )

// Pattern: Validation pipeline
const _validateAndProcess = (input: unknown): Either<string, Processed> =>
  pipe(validateInput(input), flatMapEither(transformInput), flatMapEither(validateOutput))

// Pattern: Optional transformation
const _maybeTransform = (value: string): Option<string> =>
  pipe(
    fromNullable(value),
    map((v) => v.trim()),
    flatMap((v) => (v.length > 0 ? some(v.toUpperCase()) : none))
  )

// ============================================================================
// Anti-Patterns
// ============================================================================

// ❌ DON'T: Mix imperative and functional styles
// const bad = (id: number) => {
//   const user = getUser(id)
//   if (isSome(user)) {
//     return some(processUser(user.value))
//   }
//   return none
// }

// ❌ DON'T: Unwrap Options/Eithers prematurely
// const bad = (id: number) => {
//   const user = getUser(id)
//   if (isSome(user)) {
//     const profile = getUserProfile(user.value) // Should use flatMap
//   }
// }

// ❌ DON'T: Use Option/Either for control flow (use regular conditionals)
// const bad = (condition: boolean) => condition ? some(doWork()) : none
// // Use: if (condition) doWork()

// ❌ DON'T: Create Option/Either from values that can't fail
// const bad = (x: number) => some(x * 2) // Just return x * 2

// ============================================================================
// Type Helpers
// ============================================================================

type User = { id: number; name: string }
type Profile = { userId: number; email: string }
type ProcessedData = { value: number }
type Processed = { data: ProcessedData }
type Output = { result: string }

// Placeholder functions for examples
const getUser = (_id: number): Option<User> => none
const getUserProfile = (_user: User): Option<Profile> => none
const getProfileEmail = (_profile: Profile): Option<string> => none
const parseInputEither = (_input: string): Either<string, unknown> => right({})
const validateRange = (_n: number): Either<string, number> => right(0)
const transformData = (_n: number): Either<string, ProcessedData> => right({ value: 0 })
const validateInput = (_input: unknown): Either<string, unknown> => right({})
const transformInput = (_input: unknown): Either<string, unknown> => right({})
const validateOutput = (_input: unknown): Either<string, Processed> => right({ data: { value: 0 } })

const users: User[] = []
