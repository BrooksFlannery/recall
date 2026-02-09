/**
 * Functional Programming Utilities
 *
 * Custom implementations of common functional programming types and utilities.
 * Built from scratch to understand how they work under the hood.
 *
 * These utilities help you write safer, more predictable code by:
 * - Making null/undefined handling explicit (Option)
 * - Making error handling explicit (Either)
 * - Composing functions in a readable way (pipe)
 */

// ============================================================================
// Option (Maybe) - Represents a value that may or may not exist
// ============================================================================

/**
 * Internal type representing a value that exists.
 * You typically won't use this directly - use `some()` instead.
 */
type Some<A> = {
  readonly _tag: "Some"
  readonly value: A
}

/**
 * Internal type representing a value that doesn't exist.
 * You typically won't use this directly - use `none` instead.
 */
type None = {
  readonly _tag: "None"
}

/**
 * Option type - represents a value that might or might not exist.
 *
 * Instead of using `null` or `undefined` (which can cause errors),
 * Option forces you to handle both cases explicitly.
 *
 * @example
 * // Instead of: const name: string | null = getUserName()
 * // Use: const name: Option<string> = getUserName()
 *
 * // Then you must handle both cases:
 * if (isSome(name)) {
 *   console.log(name.value) // Safe to access
 * } else {
 *   console.log("No name found")
 * }
 */
export type Option<A> = Some<A> | None

/**
 * Creates an Option containing a value.
 *
 * Use this when you have a value that definitely exists.
 *
 * @param value - The value to wrap in an Option
 * @returns An Option containing the value
 *
 * @example
 * const name = some("Alice")
 * // name is now Option<string> with value "Alice"
 */
export const some = <A>(value: A): Option<A> => ({
  _tag: "Some",
  value,
})

/**
 * Represents the absence of a value.
 *
 * Use this when you don't have a value (instead of null or undefined).
 *
 * @example
 * const name = none
 * // name is now Option<never> representing no value
 *
 * // Common pattern:
 * const findUser = (id: number): Option<User> => {
 *   const user = users.find(u => u.id === id)
 *   return user ? some(user) : none
 * }
 */
export const none: Option<never> = {
  _tag: "None",
}

/**
 * Checks if an Option contains a value.
 *
 * This is a type guard - TypeScript will know the value exists
 * inside the if block.
 *
 * @param option - The Option to check
 * @returns true if the Option contains a value, false otherwise
 *
 * @example
 * const name = some("Alice")
 * if (isSome(name)) {
 *   console.log(name.value) // TypeScript knows name.value exists here
 * }
 */
export const isSome = <A>(option: Option<A>): option is Some<A> => option._tag === "Some"

/**
 * Checks if an Option is empty (has no value).
 *
 * This is a type guard - TypeScript will know there's no value
 * inside the if block.
 *
 * @param option - The Option to check
 * @returns true if the Option is empty, false otherwise
 *
 * @example
 * const name = none
 * if (isNone(name)) {
 *   console.log("No name found") // TypeScript knows there's no value here
 * }
 */
export const isNone = <A>(option: Option<A>): option is None => option._tag === "None"

/**
 * Converts a value that might be null or undefined into an Option.
 *
 * This is useful when working with APIs or code that returns null/undefined.
 *
 * @param value - A value that might be null or undefined
 * @returns `some(value)` if value exists, `none` if it's null or undefined
 *
 * @example
 * const userName = fromNullable(document.getElementById("name")?.textContent)
 * // If the element exists and has text, userName is some("text")
 * // Otherwise, userName is none
 *
 * @example
 * const user = fromNullable(users.find(u => u.id === 5))
 * // If user found: some(user)
 * // If not found: none
 */
export const fromNullable = <A>(value: A | null | undefined): Option<A> =>
  value == null ? none : some(value)

/**
 * Transforms the value inside an Option if it exists.
 *
 * If the Option has a value, applies the function to it.
 * If the Option is empty, returns an empty Option.
 *
 * This is like `.map()` on arrays, but for single values that might not exist.
 *
 * @param f - A function that transforms the value
 * @returns A function that takes an Option and returns a new Option with the transformed value
 *
 * @example
 * const name = some("alice")
 * const upperName = map((s: string) => s.toUpperCase())(name)
 * // upperName is some("ALICE")
 *
 * @example
 * const empty = none
 * const result = map((s: string) => s.toUpperCase())(empty)
 * // result is none (function never runs)
 *
 * @example
 * // With pipe (more readable):
 * pipe(
 *   some(5),
 *   map(x => x * 2),
 *   map(x => x + 1)
 * ) // some(11)
 */
export const map =
  <A, B>(f: (a: A) => B) =>
  (option: Option<A>): Option<B> =>
    // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
    isSome(option) ? some(f(option.value)) : none

/**
 * Chains operations that return Options.
 *
 * Similar to `map`, but the function you provide returns an Option.
 * This is useful when you have multiple operations that might fail.
 *
 * Also called "bind" or "flatMap" in other languages.
 *
 * @param f - A function that takes a value and returns an Option
 * @returns A function that takes an Option and chains the operations
 *
 * @example
 * // Find a user, then find their address
 * const findUser = (id: number): Option<User> => { ... }
 * const getUserAddress = (user: User): Option<Address> => { ... }
 *
 * const address = pipe(
 *   findUser(5),
 *   flatMap(user => getUserAddress(user))
 * )
 * // If user found AND address found: some(address)
 * // If either step fails: none
 *
 * @example
 * // Without flatMap, you'd need nested if statements:
 * const user = findUser(5)
 * if (isSome(user)) {
 *   const address = getUserAddress(user.value)
 *   if (isSome(address)) {
 *     // use address.value
 *   }
 * }
 */
export const flatMap =
  <A, B>(f: (a: A) => Option<B>) =>
  (option: Option<A>): Option<B> =>
    // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
    isSome(option) ? f(option.value) : none

/**
 * Extracts the value from an Option, or returns a fallback if empty.
 *
 * This is how you "unwrap" an Option to get the actual value.
 * Use this when you have a sensible default value.
 *
 * @param fallback - The value to return if the Option is empty
 * @returns A function that extracts the value or returns the fallback
 *
 * @example
 * const name = some("Alice")
 * const result = getOrElse("Unknown")(name)
 * // result is "Alice"
 *
 * @example
 * const empty = none
 * const result = getOrElse("Unknown")(empty)
 * // result is "Unknown"
 *
 * @example
 * const count = fromNullable(parseInt(input))
 * const safeCount = getOrElse(0)(count)
 * // If parsing succeeded: the number
 * // If parsing failed: 0
 */
export const getOrElse =
  <A>(fallback: A) =>
  (option: Option<A>): A =>
    // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
    isSome(option) ? option.value : fallback

/**
 * Extracts the value from an Option, or computes a fallback if empty.
 *
 * Like `getOrElse`, but the fallback is computed lazily (only if needed).
 * Use this when computing the fallback is expensive.
 *
 * @param fallback - A function that returns the fallback value
 * @returns A function that extracts the value or computes the fallback
 *
 * @example
 * const expensiveFallback = () => {
 *   console.log("Computing expensive fallback...")
 *   return heavyComputation()
 * }
 *
 * const result = getOrElseLazy(expensiveFallback)(some("value"))
 * // result is "value", expensiveFallback never runs
 *
 * @example
 * const result = getOrElseLazy(expensiveFallback)(none)
 * // result is the computed fallback, expensiveFallback runs
 */
export const getOrElseLazy =
  <A>(fallback: () => A) =>
  (option: Option<A>): A =>
    // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
    isSome(option) ? option.value : fallback()

/**
 * Pattern matching for Options.
 *
 * Provides a way to handle both cases (some/none) in one place.
 * This is often more readable than if/else statements.
 *
 * @param onNone - Function to call if Option is empty
 * @param onSome - Function to call if Option has a value
 * @returns A function that matches on the Option and returns the result
 *
 * @example
 * const name = some("Alice")
 * const greeting = match(
 *   () => "Hello, stranger!",
 *   (name) => `Hello, ${name}!`
 * )(name)
 * // greeting is "Hello, Alice!"
 *
 * @example
 * const empty = none
 * const greeting = match(
 *   () => "Hello, stranger!",
 *   (name) => `Hello, ${name}!`
 * )(empty)
 * // greeting is "Hello, stranger!"
 */
export const match =
  <A, B>(onNone: () => B, onSome: (a: A) => B) =>
  (option: Option<A>): B =>
    // biome-ignore lint/plugin: Internal implementation - isSome() guarantees .value exists
    isSome(option) ? onSome(option.value) : onNone()

// ============================================================================
// Either - Represents a value that is either Left (error) or Right (success)
// ============================================================================

/**
 * Internal type representing an error/failure case.
 * You typically won't use this directly - use `left()` instead.
 */
type Left<E> = {
  readonly _tag: "Left"
  readonly left: E
}

/**
 * Internal type representing a success case.
 * You typically won't use this directly - use `right()` instead.
 */
type Right<A> = {
  readonly _tag: "Right"
  readonly right: A
}

/**
 * Either type - represents a value that is either an error (Left) or success (Right).
 *
 * Instead of throwing exceptions or returning null on error,
 * Either forces you to handle both success and error cases explicitly.
 *
 * Convention: Left = error, Right = right/correct value
 *
 * @example
 * // Instead of: const result: string | null = parseJSON(json)
 * // Use: const result: Either<Error, string> = parseJSON(json)
 *
 * // Then you must handle both cases:
 * if (isRight(result)) {
 *   console.log(result.right) // Success case
 * } else {
 *   console.error(result.left) // Error case
 * }
 */
export type Either<E, A> = Left<E> | Right<A>

/**
 * Creates an Either representing an error/failure.
 *
 * Use this when something goes wrong or when you want to represent failure.
 *
 * @param error - The error value (can be any type: string, Error object, etc.)
 * @returns An Either with the error on the Left side
 *
 * @example
 * const result = left("User not found")
 * // result is Either<string, never> representing an error
 *
 * @example
 * const parseNumber = (str: string): Either<string, number> => {
 *   const num = Number(str)
 *   return isNaN(num) ? left("Invalid number") : right(num)
 * }
 */
export const left = <E>(error: E): Either<E, never> => ({
  _tag: "Left",
  left: error,
})

/**
 * Creates an Either representing success.
 *
 * Use this when something succeeds or when you have a valid result.
 *
 * @param value - The success value
 * @returns An Either with the value on the Right side
 *
 * @example
 * const result = right(42)
 * // result is Either<never, number> representing success
 *
 * @example
 * const divide = (a: number, b: number): Either<string, number> => {
 *   return b === 0 ? left("Division by zero") : right(a / b)
 * }
 */
export const right = <A>(value: A): Either<never, A> => ({
  _tag: "Right",
  right: value,
})

/**
 * Checks if an Either represents an error (Left).
 *
 * This is a type guard - TypeScript will know it's an error
 * inside the if block.
 *
 * @param either - The Either to check
 * @returns true if the Either is an error, false otherwise
 *
 * @example
 * const result = left("Error occurred")
 * if (isLeft(result)) {
 *   console.error(result.left) // TypeScript knows result.left exists here
 * }
 */
export const isLeft = <E, A>(either: Either<E, A>): either is Left<E> => either._tag === "Left"

/**
 * Checks if an Either represents success (Right).
 *
 * This is a type guard - TypeScript will know it's a success
 * inside the if block.
 *
 * @param either - The Either to check
 * @returns true if the Either is a success, false otherwise
 *
 * @example
 * const result = right(42)
 * if (isRight(result)) {
 *   console.log(result.right) // TypeScript knows result.right exists here
 * }
 */
export const isRight = <E, A>(either: Either<E, A>): either is Right<A> => either._tag === "Right"

/**
 * Transforms the success value inside an Either if it exists.
 *
 * If the Either is a success, applies the function to the value.
 * If the Either is an error, returns the error unchanged.
 *
 * @param f - A function that transforms the success value
 * @returns A function that takes an Either and returns a new Either with the transformed value
 *
 * @example
 * const result = right(5)
 * const doubled = mapEither((x: number) => x * 2)(result)
 * // doubled is right(10)
 *
 * @example
 * const error = left("Failed")
 * const result = mapEither((x: number) => x * 2)(error)
 * // result is still left("Failed") - function never runs
 *
 * @example
 * // With pipe:
 * pipe(
 *   right("hello"),
 *   mapEither(s => s.toUpperCase())
 * ) // right("HELLO")
 */
export const mapEither =
  <A, B>(f: (a: A) => B) =>
  <E>(either: Either<E, A>): Either<E, B> =>
    // biome-ignore lint/plugin: Internal implementation - isRight() guarantees .right exists
    isRight(either) ? right(f(either.right)) : either

/**
 * Transforms the error value inside an Either if it exists.
 *
 * If the Either is an error, applies the function to the error.
 * If the Either is a success, returns the success unchanged.
 *
 * Useful for converting error types or adding context to errors.
 *
 * @param f - A function that transforms the error value
 * @returns A function that takes an Either and returns a new Either with the transformed error
 *
 * @example
 * const result = left("not found")
 * const withContext = mapLeft((err: string) => `User ${err}`)(result)
 * // withContext is left("User not found")
 *
 * @example
 * // Convert error string to Error object:
 * pipe(
 *   left("Something went wrong"),
 *   mapLeft(msg => new Error(msg))
 * ) // left(Error("Something went wrong"))
 */
export const mapLeft =
  <E, F>(f: (e: E) => F) =>
  <A>(either: Either<E, A>): Either<F, A> =>
    // biome-ignore lint/plugin: Internal implementation - isLeft() guarantees .left exists
    isLeft(either) ? left(f(either.left)) : either

/**
 * Chains operations that return Eithers.
 *
 * Similar to `mapEither`, but the function you provide returns an Either.
 * This is useful when you have multiple operations that might fail.
 *
 * If any step fails, the error propagates through.
 *
 * @param f - A function that takes a value and returns an Either
 * @returns A function that takes an Either and chains the operations
 *
 * @example
 * // Parse JSON, then parse the result
 * const parseJSON = (str: string): Either<string, object> => { ... }
 * const parseUser = (obj: object): Either<string, User> => { ... }
 *
 * const user = pipe(
 *   parseJSON(jsonString),
 *   flatMapEither(obj => parseUser(obj))
 * )
 * // If both steps succeed: right(user)
 * // If either step fails: left(error)
 *
 * @example
 * // Without flatMapEither, you'd need nested if statements:
 * const json = parseJSON(jsonString)
 * if (isRight(json)) {
 *   const user = parseUser(json.right)
 *   if (isRight(user)) {
 *     // use user.right
 *   }
 * }
 */
export const flatMapEither =
  <A, E, B>(f: (a: A) => Either<E, B>) =>
  (either: Either<E, A>): Either<E, B> =>
    // biome-ignore lint/plugin: Internal implementation - isRight() guarantees .right exists
    isRight(either) ? f(either.right) : either

/**
 * Extracts the success value from an Either, or returns a fallback if it's an error.
 *
 * This is how you "unwrap" an Either to get the actual value.
 * Use this when you have a sensible default value for errors.
 *
 * @param fallback - The value to return if the Either is an error
 * @returns A function that extracts the value or returns the fallback
 *
 * @example
 * const result = right(42)
 * const value = getOrElseEither(0)(result)
 * // value is 42
 *
 * @example
 * const error = left("Failed")
 * const value = getOrElseEither(0)(error)
 * // value is 0 (fallback)
 *
 * @example
 * const count = parseNumber(input)
 * const safeCount = getOrElseEither(0)(count)
 * // If parsing succeeded: the number
 * // If parsing failed: 0
 */
export const getOrElseEither =
  <E, A>(fallback: A) =>
  (either: Either<E, A>): A =>
    // biome-ignore lint/plugin: Internal implementation - isRight() guarantees .right exists
    isRight(either) ? either.right : fallback

/**
 * Extracts the success value from an Either, or computes a fallback from the error.
 *
 * Like `getOrElseEither`, but the fallback can use the error information.
 * Use this when you want to handle the error in some way.
 *
 * @param fallback - A function that takes the error and returns a fallback value
 * @returns A function that extracts the value or computes the fallback
 *
 * @example
 * const result = left("User not found")
 * const message = getOrElseLazyEither(
 *   (error: string) => `Error: ${error}`
 * )(result)
 * // message is "Error: User not found"
 *
 * @example
 * const parseNumber = (str: string): Either<string, number> => { ... }
 * const count = getOrElseLazyEither(
 *   (error: string) => {
 *     console.error(`Parse failed: ${error}`)
 *     return 0
 *   }
 * )(parseNumber(input))
 */
export const getOrElseLazyEither =
  <E, A>(fallback: (error: E) => A) =>
  (either: Either<E, A>): A =>
    // biome-ignore lint/plugin: Internal implementation - isRight()/isLeft() guarantee .right/.left exists
    isRight(either) ? either.right : fallback(either.left)

/**
 * Pattern matching for Eithers.
 *
 * Provides a way to handle both cases (error/success) in one place.
 * This is often more readable than if/else statements.
 *
 * @param onLeft - Function to call if Either is an error
 * @param onRight - Function to call if Either is a success
 * @returns A function that matches on the Either and returns the result
 *
 * @example
 * const result = right(42)
 * const message = matchEither(
 *   (error) => `Error: ${error}`,
 *   (value) => `Success: ${value}`
 * )(result)
 * // message is "Success: 42"
 *
 * @example
 * const error = left("Failed")
 * const message = matchEither(
 *   (error) => `Error: ${error}`,
 *   (value) => `Success: ${value}`
 * )(error)
 * // message is "Error: Failed"
 */
export const matchEither =
  <E, A, B>(onLeft: (e: E) => B, onRight: (a: A) => B) =>
  (either: Either<E, A>): B =>
    // biome-ignore lint/plugin: Internal implementation - isRight()/isLeft() guarantee .right/.left exists
    isRight(either) ? onRight(either.right) : onLeft(either.left)

// ============================================================================
// Pipe - Function composition utility
// ============================================================================

/**
 * Pipes a value through a series of functions, left to right.
 *
 * This is the foundation of functional composition. Instead of nesting
 * function calls, you write them in a readable top-to-bottom flow.
 *
 * How it works: Takes a value, then applies each function in sequence,
 * passing the result of one function as input to the next.
 *
 * @param value - The initial value to start with
 * @param fns - One or more functions to apply in sequence
 * @returns The final result after applying all functions
 *
 * @example
 * // Instead of this nested mess:
 * const result = toString(addOne(multiplyByTwo(5)))
 *
 * // Write this readable flow:
 * const result = pipe(
 *   5,
 *   (x) => x * 2,        // 5 * 2 = 10
 *   (x) => x + 1,        // 10 + 1 = 11
 *   (x) => x.toString()  // 11 -> "11"
 * )
 * // result is "11"
 *
 * @example
 * // Working with Options:
 * const result = pipe(
 *   some(5),
 *   map(x => x * 2),
 *   map(x => x + 1),
 *   getOrElse(0)
 * )
 * // result is 11
 *
 * @example
 * // Working with Eithers:
 * const result = pipe(
 *   right("hello"),
 *   mapEither(s => s.toUpperCase()),
 *   mapEither(s => s + "!")
 * )
 * // result is right("HELLO!")
 *
 * @example
 * // Real-world example: processing user input
 * const processInput = (input: string) => pipe(
 *   input,
 *   (s) => s.trim(),                    // Remove whitespace
 *   (s) => s.toLowerCase(),             // Lowercase
 *   (s) => s.replace(/[^a-z]/g, ""),   // Remove non-letters
 *   (s) => s.length > 0 ? some(s) : none, // Convert to Option
 *   map(s => s.toUpperCase())           // Transform if exists
 * )
 */
export function pipe<A>(value: A): A
export function pipe<A, B>(value: A, fn1: (a: A) => B): B
export function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C
export function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D
export function pipe<A, B, C, D, E>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E
): E
export function pipe<A, B, C, D, E, F>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F
): F
export function pipe<A, B, C, D, E, F, G>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G
): G
export function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H
): H
export function pipe(value: unknown, ...fns: Array<(x: unknown) => unknown>): unknown {
  // How it works: Start with the value, then apply each function in sequence
  // reduce starts with 'value', then for each function, calls it with the
  // accumulated result so far
  return fns.reduce((acc, fn) => fn(acc), value)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Identity function - returns the value unchanged.
 *
 * This might seem useless, but it's useful in functional programming
 * as a placeholder or default function.
 *
 * @param a - Any value
 * @returns The same value, unchanged
 *
 * @example
 * identity(5) // 5
 * identity("hello") // "hello"
 *
 * @example
 * // Useful as a default:
 * const transform = maybeTransform || identity
 * // If maybeTransform is undefined, use identity (no transformation)
 */
export const identity = <A>(a: A): A => a

/**
 * Constant function - always returns the same value, no matter the input.
 *
 * Creates a function that ignores its input and always returns
 * the value you provided.
 *
 * @param a - The value to always return
 * @returns A function that always returns that value
 *
 * @example
 * const alwaysFive = constant(5)
 * alwaysFive(100) // 5
 * alwaysFive("anything") // 5
 * alwaysFive() // 5
 *
 * @example
 * // Useful for default values:
 * const getDefaultName = constant("Unknown")
 * getDefaultName() // "Unknown"
 */
export const constant =
  <A>(a: A) =>
  (): A =>
    a

/**
 * Function composition - combines two functions into one.
 *
 * Composes two functions so that the result of the second function
 * is passed as input to the first function.
 * Mathematical notation: (f ∘ g)(x) = f(g(x))
 *
 * @param f - The outer function (applied second)
 * @param g - The inner function (applied first)
 * @returns A new function that applies g, then f
 *
 * @example
 * const addOne = (x: number) => x + 1
 * const multiplyByTwo = (x: number) => x * 2
 *
 * const addOneThenDouble = compose(multiplyByTwo, addOne)
 * addOneThenDouble(5) // multiplyByTwo(addOne(5)) = multiplyByTwo(6) = 12
 *
 * @example
 * // Same as:
 * const addOneThenDouble = (x: number) => multiplyByTwo(addOne(x))
 *
 * // Or with pipe:
 * const addOneThenDouble = (x: number) => pipe(x, addOne, multiplyByTwo)
 */
export const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a))

/**
 * Flips the arguments of a binary function.
 *
 * Takes a function that takes (a, b) and returns a function
 * that takes (b, a) - the arguments are swapped.
 *
 * @param f - A function that takes two arguments
 * @returns A new function with the arguments flipped
 *
 * @example
 * const divide = (a: number, b: number) => a / b
 * const divideFlipped = flip(divide)
 *
 * divide(10, 2) // 5
 * divideFlipped(2, 10) // 5 (same result, args swapped)
 *
 * @example
 * // Useful with functions that take arguments in the "wrong" order:
 * const prepend = (arr: number[], item: number) => [item, ...arr]
 * const append = flip(prepend)
 * // Now append takes (item, arr) instead of (arr, item)
 */
export const flip =
  <A, B, C>(f: (a: A, b: B) => C) =>
  (b: B, a: A): C =>
    f(a, b)

/**
 * Curries a binary function.
 *
 * Converts a function that takes two arguments into a function
 * that takes one argument and returns a function that takes the second.
 *
 * This allows partial application - you can provide one argument now,
 * and the other later.
 *
 * @param f - A function that takes two arguments
 * @returns A curried version that takes one argument at a time
 *
 * @example
 * const add = (a: number, b: number) => a + b
 * const curriedAdd = curry(add)
 *
 * // Now you can use it two ways:
 * curriedAdd(5)(3) // 8 (same as add(5, 3))
 *
 * // Or partially apply it:
 * const addFive = curriedAdd(5)
 * addFive(3) // 8
 * addFive(10) // 15
 *
 * @example
 * // Useful for creating specialized functions:
 * const multiply = (a: number, b: number) => a * b
 * const double = curry(multiply)(2)
 * double(5) // 10
 * double(7) // 14
 */
export const curry =
  <A, B, C>(f: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B): C =>
    f(a, b)

/**
 * Uncurries a curried function.
 *
 * Converts a curried function (takes one arg, returns a function)
 * back into a regular function that takes both arguments at once.
 *
 * This is the opposite of `curry`.
 *
 * @param f - A curried function
 * @returns A regular function that takes both arguments
 *
 * @example
 * const curriedAdd = (a: number) => (b: number) => a + b
 * const regularAdd = uncurry(curriedAdd)
 *
 * curriedAdd(5)(3) // 8
 * regularAdd(5, 3) // 8 (same result, different syntax)
 *
 * @example
 * // Useful when you have a curried function but need to pass
 * // both arguments at once (e.g., to another function)
 */
export const uncurry =
  <A, B, C>(f: (a: A) => (b: B) => C) =>
  (a: A, b: B): C =>
    f(a)(b)
