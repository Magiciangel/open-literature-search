import { describe, expect, it } from "vitest"
import type { SearchResult } from "../src/types"
import { dedupeResults } from "../src/utils/dedupe"

describe("dedupeResults", () => {
  it("deduplicates by normalized DOI and keeps richer metadata", () => {
    const base = makeResult({ source: "crossref", doi: "https://doi.org/10.1000/test", abstract: null, citedByCount: 2 })
    const duplicate = makeResult({ source: "openalex", doi: "10.1000/TEST", abstract: "A longer abstract", citedByCount: 10, oaPdfUrl: "https://example.com/paper.pdf", accessStatus: "open_pdf" })

    const results = dedupeResults([base, duplicate])

    expect(results).toHaveLength(1)
    expect(results[0].doi).toBe("10.1000/test")
    expect(results[0].abstract).toBe("A longer abstract")
    expect(results[0].citedByCount).toBe(10)
    expect(results[0].oaPdfUrl).toBe("https://example.com/paper.pdf")
  })

  it("deduplicates by normalized title when DOI is missing", () => {
    const results = dedupeResults([
      makeResult({ title: "AI Feedback in Academic Writing", doi: null, source: "openalex" }),
      makeResult({ title: "AI feedback in academic writing.", doi: null, source: "crossref" })
    ])

    expect(results).toHaveLength(1)
  })
})

function makeResult(overrides: Partial<SearchResult>): SearchResult {
  return {
    title: "AI Feedback in Academic Writing",
    authors: ["Jane Doe"],
    year: 2024,
    doi: "10.1000/test",
    venue: "Journal",
    url: "https://example.com",
    abstract: "Abstract",
    source: "openalex",
    externalId: "id",
    accessStatus: "metadata_only",
    license: null,
    oaStatus: null,
    oaPdfUrl: null,
    landingPageUrl: "https://example.com",
    citedByCount: 0,
    ...overrides
  }
}
