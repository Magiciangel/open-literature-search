import type { LiteratureSort, SearchResult } from "../types"
import { hasOpenAccessSignal } from "./access"

export function scoreResult(query: string, result: SearchResult): number {
  const normalizedQuery = normalizeForSearch(query)
  const tokens = tokenize(query)
  const title = normalizeForSearch(result.title)
  const abstract = normalizeForSearch(result.abstract || "")
  const venue = normalizeForSearch(result.venue || "")
  const authors = normalizeForSearch(result.authors.join(" "))

  let score = 0
  if (normalizedQuery && title.includes(normalizedQuery)) score += 10
  if (normalizedQuery && abstract.includes(normalizedQuery)) score += 3

  for (const token of tokens) {
    if (title.includes(token)) score += 4
    if (abstract.includes(token)) score += 1
    if (venue.includes(token)) score += 0.5
    if (authors.includes(token)) score += 0.5
  }

  if (result.doi) score += 0.2
  if (hasOpenAccessSignal(result)) score += 0.3
  if (result.citedByCount) score += Math.min(2, Math.log10(result.citedByCount + 1) * 0.35)

  return Number(score.toFixed(4))
}

export function rankResults(results: SearchResult[], query: string, sort: LiteratureSort = "relevance"): SearchResult[] {
  const scored = results.map((result) => ({
    ...result,
    relevanceScore: scoreResult(query, result)
  }))

  return scored.sort((a, b) => {
    if (sort === "year") return compareNumbers(b.year, a.year) || compareRelevance(a, b)
    if (sort === "citations") return compareNumbers(b.citedByCount, a.citedByCount) || compareRelevance(a, b)
    if (sort === "open-access") {
      return Number(hasOpenAccessSignal(b)) - Number(hasOpenAccessSignal(a)) || compareRelevance(a, b)
    }
    return compareRelevance(a, b) || compareNumbers(b.citedByCount, a.citedByCount)
  })
}

function compareRelevance(a: SearchResult, b: SearchResult): number {
  return (b.relevanceScore || 0) - (a.relevanceScore || 0)
}

function compareNumbers(a?: number | null, b?: number | null): number {
  return (a || 0) - (b || 0)
}

function tokenize(query: string): string[] {
  const normalized = normalizeForSearch(query)
  if (!normalized) return []
  return Array.from(new Set(normalized.split(/[\s,;:，；：、]+/).filter((token) => token.length >= 2)))
}

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}
