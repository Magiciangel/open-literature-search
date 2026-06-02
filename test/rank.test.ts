import { describe, expect, it } from "vitest"
import type { SearchResult } from "../src/types"
import { rankResults, scoreResult } from "../src/utils/rank"

describe("rankResults", () => {
  it("scores title matches higher than weak matches", () => {
    const titleMatch = makeResult({ title: "AI feedback in academic writing" })
    const weakMatch = makeResult({ title: "General education technology", abstract: "AI feedback appears once." })

    expect(scoreResult("AI feedback in academic writing", titleMatch)).toBeGreaterThan(scoreResult("AI feedback in academic writing", weakMatch))
  })

  it("sorts by year and citations", () => {
    const older = makeResult({ title: "Older", year: 2020, citedByCount: 100 })
    const newer = makeResult({ title: "Newer", year: 2025, citedByCount: 1 })

    expect(rankResults([older, newer], "education", "year")[0].title).toBe("Newer")
    expect(rankResults([older, newer], "education", "citations")[0].title).toBe("Older")
  })
})

function makeResult(overrides: Partial<SearchResult>): SearchResult {
  return {
    title: "Result",
    authors: [],
    year: 2024,
    doi: null,
    venue: null,
    url: null,
    abstract: null,
    source: "openalex",
    externalId: null,
    accessStatus: "metadata_only",
    license: null,
    oaStatus: null,
    oaPdfUrl: null,
    landingPageUrl: null,
    citedByCount: 0,
    ...overrides
  }
}
