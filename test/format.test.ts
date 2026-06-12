import { describe, expect, it } from "vitest"
import { formatPaperCitation, formatResultsBibtex, formatResultsMarkdown, formatResultsRis } from "../src/format"
import type { LiteratureSearchResult, SearchResult } from "../src/types"

describe("export formatters", () => {
  it("formats Markdown, BibTeX, RIS, and plain citations", () => {
    const result: LiteratureSearchResult = {
      query: "AI feedback",
      sources: [],
      results: [makePaper()]
    }

    expect(formatResultsMarkdown(result)).toContain("### 1. AI Feedback in Academic Writing")
    expect(formatResultsBibtex(result)).toContain("@article{Doe2025ai1,")
    expect(formatResultsBibtex(result)).toContain("author = {Jane Doe and John Smith}")
    expect(formatResultsRis(result)).toContain("TY  - JOUR")
    expect(formatResultsRis(result)).toContain("DO  - 10.1000/test")
    expect(formatPaperCitation(makePaper())).toContain("Jane Doe, John Smith (2025). AI Feedback in Academic Writing.")
  })
})

function makePaper(): SearchResult {
  return {
    title: "AI Feedback in Academic Writing",
    authors: ["Jane Doe", "John Smith"],
    year: 2025,
    doi: "10.1000/test",
    venue: "Journal of Writing",
    url: "https://doi.org/10.1000/test",
    abstract: "A study about feedback.",
    source: "openalex",
    externalId: "W1",
    accessStatus: "open_link",
    license: null,
    oaStatus: "open",
    oaPdfUrl: null,
    landingPageUrl: "https://doi.org/10.1000/test",
    citedByCount: 3
  }
}
