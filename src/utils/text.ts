import type { SearchResult } from "../types"

export function cleanText(value: string | null | undefined): string | null {
  if (!value) return null

  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return cleaned || null
}

export function cleanSearchResult(result: SearchResult): SearchResult {
  return {
    ...result,
    title: cleanText(result.title) || "Untitled",
    authors: result.authors.map((author) => cleanText(author)).filter((author): author is string => Boolean(author)),
    venue: cleanText(result.venue),
    abstract: cleanText(result.abstract)
  }
}
