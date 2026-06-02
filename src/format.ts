import type { LiteratureSearchResult } from "./types"

export function formatResultsMarkdown(result: LiteratureSearchResult): string {
  if (!result.results.length) return "No results found."

  return result.results.map((paper, index) => {
    const meta = [paper.year, paper.venue, paper.source].filter(Boolean).join(" · ")
    const links = [
      paper.doi ? `DOI: https://doi.org/${paper.doi}` : null,
      paper.url ? `URL: ${paper.url}` : null,
      paper.oaPdfUrl ? `Open PDF: ${paper.oaPdfUrl}` : null
    ].filter(Boolean)

    return [
      `### ${index + 1}. ${paper.title}`,
      paper.authors.join(", ") || "Unknown authors",
      meta,
      `Citations: ${paper.citedByCount}`,
      ...links
    ].filter(Boolean).join("\n")
  }).join("\n\n")
}
