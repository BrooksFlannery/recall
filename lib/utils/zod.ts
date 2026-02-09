/**
 * Zod Utilities - Integration with Functional Programming
 *
 * Utilities for using Zod schemas with Option and Either types.
 * Provides type-safe validation with functional error handling.
 */

import type { z } from "zod"
import { type Either, flatMap, fromNullable, left, none, type Option, right, some } from "./fp"

/**
 * Validates a value against a Zod schema, returning an Option.
 * Returns none if validation fails (error details are lost).
 *
 * Use this when you don't need to know why validation failed.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Option containing the validated value, or none if invalid
 *
 * @example
 * const UserSchema = z.object({ id: z.number(), name: z.string() })
 * const result = parseOption(UserSchema, { id: 1, name: "Alice" })
 * // some({ id: 1, name: "Alice" })
 */
export const parseOption = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): Option<z.infer<T>> => {
  const result = schema.safeParse(value)
  return result.success ? some(result.data) : none
}

/**
 * Validates a value against a Zod schema, returning an Either.
 * Returns left with the Zod error if validation fails.
 *
 * Use this when you need error details for user feedback or logging.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Either containing the validated value, or left with ZodError
 *
 * @example
 * const UserSchema = z.object({ id: z.number(), name: z.string() })
 * const result = parseEither(UserSchema, { id: "invalid" })
 * // left(ZodError)
 */
export const parseEither = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): Either<z.ZodError, z.infer<T>> => {
  const result = schema.safeParse(value)
  return result.success ? right(result.data) : left(result.error)
}

/**
 * Validates a value against a Zod schema, returning an Either with error message.
 * Returns left with a formatted error message if validation fails.
 *
 * Use this when you need a simple error message string.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Either containing the validated value, or left with error message
 *
 * @example
 * const UserSchema = z.object({ id: z.number(), name: z.string() })
 * const result = parseEitherMessage(UserSchema, { id: "invalid" })
 * // left("Expected number, received string")
 */
export const parseEitherMessage = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): Either<string, z.infer<T>> => {
  const result = schema.safeParse(value)
  if (result.success) {
    return right(result.data)
  }
  const message = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
  return left(message)
}

/**
 * Creates a function that validates input and returns an Option.
 * Useful for creating reusable validators.
 *
 * @param schema - Zod schema to validate against
 * @returns A function that takes a value and returns an Option
 *
 * @example
 * const validateUser = createOptionValidator(UserSchema)
 * const user = validateUser(input) // Option<User>
 */
export const createOptionValidator = <T extends z.ZodTypeAny>(schema: T) => {
  return (value: unknown): Option<z.infer<T>> => parseOption(schema, value)
}

/**
 * Creates a function that validates input and returns an Either.
 * Useful for creating reusable validators with error details.
 *
 * @param schema - Zod schema to validate against
 * @returns A function that takes a value and returns an Either
 *
 * @example
 * const validateUser = createEitherValidator(UserSchema)
 * const user = validateUser(input) // Either<ZodError, User>
 */
export const createEitherValidator = <T extends z.ZodTypeAny>(schema: T) => {
  return (value: unknown): Either<z.ZodError, z.infer<T>> => parseEither(schema, value)
}

/**
 * Converts a nullable value to Option, then validates it.
 * Combines fromNullable and parseOption for convenience.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value that might be null/undefined
 * @returns Option containing the validated value
 *
 * @example
 * const user = parseNullableOption(UserSchema, maybeUser)
 * // Handles both null/undefined and validation errors
 */
export const parseNullableOption = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): Option<z.infer<T>> => {
  return flatMap((v: unknown) => parseOption(schema, v))(fromNullable(value))
}

/**
 * Type helper: Extract the inferred type from a Zod schema.
 * Alias for z.infer for convenience.
 */
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>
