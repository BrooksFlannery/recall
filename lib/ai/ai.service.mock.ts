import { type Context, Effect, Layer } from "effect"
import { AIService } from "./types"

/**
 * Mock AI Service implementation for testing
 * Returns deterministic, fixed values for all operations
 */
const mockImplementation: Context.Tag.Service<AIService> = {
  generateQuestionAnswer: (content: string) =>
    Effect.succeed({
      question: `What is the main topic of: "${content.slice(0, 50)}${content.length > 50 ? "..." : ""}"?`,
      answer: `The main topic is about ${content.slice(0, 30)}${content.length > 30 ? "..." : ""}.`,
    }),

  gradeAnswer: (userAnswer: string, canonicalAnswer: string) => {
    // Simple deterministic grading based on string similarity
    const userLower = userAnswer.toLowerCase().trim()
    const canonicalLower = canonicalAnswer.toLowerCase().trim()

    if (userLower === canonicalLower) {
      return Effect.succeed({
        grade: "correct" as const,
        confidence: 1.0,
        rationale: "Answer matches the canonical answer exactly.",
      })
    }

    // Check if user answer contains key words from canonical answer
    const canonicalWords = canonicalLower.split(/\s+/)
    const matchingWords = canonicalWords.filter((word) =>
      userLower.includes(word)
    )
    const matchRatio = matchingWords.length / canonicalWords.length

    if (matchRatio > 0.7) {
      return Effect.succeed({
        grade: "partial" as const,
        confidence: 0.7,
        rationale: "Answer contains most key concepts from the canonical answer.",
      })
    }

    return Effect.succeed({
      grade: "incorrect" as const,
      confidence: 0.8,
      rationale: "Answer does not match the canonical answer.",
    })
  },
}

/**
 * Mock AI Service Layer for testing
 * Use this in tests that depend on the AI service
 */
export const MockAIServiceLayer = Layer.succeed(AIService, mockImplementation)
