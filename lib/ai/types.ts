import { Context, type Effect } from "effect"

/**
 * Error types for AI operations
 */
export interface AIGenerationError {
  readonly _tag: "AIGenerationError"
  readonly message: string
  readonly code?: string
}

export interface GradingError {
  readonly _tag: "GradingError"
  readonly message: string
  readonly code?: string
}

/**
 * Result type for answer grading
 */
export interface GradeResult {
  readonly grade: "correct" | "partial" | "incorrect"
  readonly confidence: number // 0-1
  readonly rationale: string
}

/**
 * AI Service interface for question/answer generation and grading
 */
export interface AIService {
  /**
   * Generate question and answer pair from user content
   */
  readonly generateQuestionAnswer: (
    content: string
  ) => Effect.Effect<{ question: string; answer: string }, AIGenerationError>

  /**
   * Grade a user's answer against a canonical answer
   */
  readonly gradeAnswer: (
    userAnswer: string,
    canonicalAnswer: string
  ) => Effect.Effect<GradeResult, GradingError>
}

/**
 * AI Service Tag for dependency injection
 */
// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: Effect-TS Context.Tag pattern requires declaration merging
export class AIService extends Context.Tag("AIService")<AIService, AIService>() {}
