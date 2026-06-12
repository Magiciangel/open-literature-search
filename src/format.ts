import type { LiteratureSearchResult, SearchResult } from "./types"

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

export function formatResultsBibtex(result: LiteratureSearchResult): string {
  if (!result.results.length) return ""
  return result.results.map(formatPaperBibtex).join("\n\n")
}

export function formatResultsRis(result: LiteratureSearchResult): string {
  if (!result.results.length) return ""
  return result.results.map(formatPaperRis).join("\n")
}

export function formatPaperCitation(paper: SearchResult): string {
  const authors = paper.authors.length ? paper.authors.join(", ") : "Unknown authors"
  const year = paper.year ? ` (${paper.year}).` : " (n.d.)."
  const venue = paper.venue ? ` ${paper.venue}.` : ""
  const doi = paper.doi ? ` https://doi.org/${paper.doi}` : paper.url ? ` ${paper.url}` : ""

  return `${authors}${year} ${paper.title}.${venue}${doi}`.replace(/\s+/g, " ").trim()
}

function formatPaperBibtex(paper: SearchResult, index: number): string {
  const key = buildCitationKey(paper, index)
  const fields = [
    ["title", paper.title],
    ["author", paper.authors.join(" and ")],
    ["year", paper.year ? String(paper.year) : ""],
    ["journal", paper.venue || ""],
    ["doi", paper.doi || ""],
    ["url", paper.url || paper.landingPageUrl || ""],
    ["abstract", paper.abstract || ""]
  ].filter(([, value]) => value)

  return [
    `@article{${key},`,
    ...fields.map(([field, value]) => `  ${field} = {${escapeBibtex(value)}},`),
    "}"
  ].join("\n")
}

function formatPaperRis(paper: SearchResult): string {
  const lines = [
    "TY  - JOUR",
    `TI  - ${paper.title}`,
    ...paper.authors.map((author) => `AU  - ${author}`),
    paper.year ? `PY  - ${paper.year}` : null,
    paper.venue ? `JO  - ${paper.venue}` : null,
    paper.doi ? `DO  - ${paper.doi}` : null,
    paper.url || paper.landingPageUrl ? `UR  - ${paper.url || paper.landingPageUrl}` : null,
    paper.abstract ? `AB  - ${paper.abstract}` : null,
    "ER  - "
  ].filter(Boolean)

  return lines.join("\n")
}

function buildCitationKey(paper: SearchResult, index: number): string {
  const firstAuthor = paper.authors[0]?.split(/\s+/).at(-1) || "paper"
  const year = paper.year || "nd"
  const titleWord = paper.title.toLowerCase().match(/[a-z0-9]+/)?.[0] || "result"
  return sanitizeKey(`${firstAuthor}${year}${titleWord}${index + 1}`)
}

function sanitizeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "")
}

function escapeBibtex(value: string): string {
  return value.replace(/[{}]/g, "").replace(/\s+/g, " ").trim()
}
