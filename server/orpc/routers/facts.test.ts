import { describe, it } from "vitest"

describe("facts.list", () => {
  it.skip("returns facts for user newest first", async () => {
    // Setup: seed two facts for the same user with different createdAt timestamps
    // (older fact inserted first, newer fact inserted second)
    //
    // Expectation: list returns both facts ordered by createdAt desc —
    // the newer fact appears at index 0 and the older at index 1;
    // each fact is joined with its latest fact_items row
  })
})

describe("facts.delete", () => {
  it.skip("removes fact for user", async () => {
    // Setup: seed a fact (and its associated fact_items row) for a user
    //
    // Expectation: calling delete with the fact's id returns { success: true }
    // and the fact no longer exists in the database;
    // cascading delete also removes all associated fact_items rows
  })
})

describe("facts.create", () => {
  it.skip("calls AI and stores fact with generic type", async () => {
    // Setup: mock the AI service so generateQuestionAnswer returns a
    // deterministic question and canonicalAnswer; provide an authenticated
    // user session in the oRPC context
    //
    // Expectation: create calls the AI service with the supplied userContent;
    // a facts row is inserted with type "generic" and the correct userId;
    // a linked fact_items row is inserted containing the AI-generated
    // question and canonicalAnswer; the returned FactWithLatestItem reflects
    // both the new fact and its fact_item
  })
})

describe("facts.update", () => {
  it.skip("updates content and Q/A; resets SRS when keep_schedule false", async () => {
    // Setup: seed an existing fact with srsLevel > 0 and a fact_items row;
    // mock the AI service to return new question and canonicalAnswer for the
    // updated userContent
    //
    // Expectation: update changes the fact's userContent; inserts a new
    // fact_items row with the fresh AI-generated Q/A (preserving history);
    // when keepSchedule is false, srsLevel is reset to 0 and nextScheduledAt
    // is set to approximately now + 1 day
  })
})
