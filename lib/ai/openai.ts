import { Effect, Layer } from "effect"
import OpenAi from "openai"
import { AIService } from "./types"
import type { AIGenerationError, GradeResult, GradingError } from "./types"

/**
 * OpenAI implementation of AIService
 * Uses GPT-4o-mini for question generation and answer grading
 */
const makeOpenAiService = Effect.sync(() => {
  const client = new OpenAi({
    apiKey: process.env["OPENAI_API_KEY"],
  })

  return {
    generateQuestionAnswer: (content: string) =>
      Effect.tryPromise({
        try: async () => {
          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert at creating educational questions and answers. Generate a question and its answer based on the provided content. Return only valid JSON with 'question' and 'answer' fields.",
              },
              {
                role: "user",
                content: `Create a question and answer pair from this content:\n\n${content}`,
              },
            ],
            temperature: 0.7,
            // biome-ignore lint/style/useNamingConvention: OpenAI SDK uses snake_case
            response_format: { type: "json_object" },
          })

          const responseContent = completion.choices[0]?.message?.content
          if (!responseContent) {
            throw new Error("No response from OpenAI")
          }

          const parsed = JSON.parse(responseContent) as {
            question?: string
            answer?: string
          }

          if (!parsed.question || !parsed.answer) {
            throw new Error("Invalid response format from OpenAI")
          }

          return {
            question: parsed.question,
            answer: parsed.answer,
          }
        },
        catch: (error) => {
          const message = error instanceof Error ? error.message : "Unknown error"
          const code = error instanceof OpenAi.APIError && error.code ? error.code : undefined
          const aiError: AIGenerationError = {
            _tag: "AIGenerationError",
            message: `Failed to generate question/answer: ${message}`,
            ...(code ? { code } : {}),
          }
          return aiError
        },
      }),

    gradeAnswer: (userAnswer: string, canonicalAnswer: string) =>
      Effect.tryPromise({
        try: async () => {
          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert grader. Compare the user's answer to the canonical answer and grade it. Return only valid JSON with 'grade' (correct/partial/incorrect), 'confidence' (0-1), and 'rationale' fields.",
              },
              {
                role: "user",
                content: `Canonical answer: ${canonicalAnswer}\n\nUser's answer: ${userAnswer}\n\nGrade the user's answer.`,
              },
            ],
            temperature: 0.3,
            // biome-ignore lint/style/useNamingConvention: OpenAI SDK uses snake_case
            response_format: { type: "json_object" },
          })

          const responseContent = completion.choices[0]?.message?.content
          if (!responseContent) {
            throw new Error("No response from OpenAI")
          }

          const parsed = JSON.parse(responseContent) as {
            grade?: string
            confidence?: number
            rationale?: string
          }

          if (!parsed.grade || parsed.confidence === undefined || !parsed.rationale) {
            throw new Error("Invalid response format from OpenAI")
          }

          if (
            parsed.grade !== "correct" &&
            parsed.grade !== "partial" &&
            parsed.grade !== "incorrect"
          ) {
            throw new Error(`Invalid grade value: ${parsed.grade}`)
          }

          const result: GradeResult = {
            grade: parsed.grade,
            confidence: parsed.confidence,
            rationale: parsed.rationale,
          }

          return result
        },
        catch: (error) => {
          const message = error instanceof Error ? error.message : "Unknown error"
          const code = error instanceof OpenAi.APIError && error.code ? error.code : undefined
          const gradingError: GradingError = {
            _tag: "GradingError",
            message: `Failed to grade answer: ${message}`,
            ...(code ? { code } : {}),
          }
          return gradingError
        },
      }),
  }
})

/**
 * Layer that provides the OpenAI implementation of AIService
 * Requires OPENAI_API_KEY environment variable
 */
export const OpenAIAIServiceLayer = Layer.effect(AIService, makeOpenAiService)
