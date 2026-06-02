import type { SearchResult } from "../types"
import { normalizeDoi } from "./doi"

export function dedupeResults(results: SearchResult[]): SearchResult[] {
  const byDoi = new Map<string, SearchResult>()
  const byTitle = new Map<string, SearchResult>()

  for (const result of results) {
    const doi = normalizeDoi(result.doi)
    const normalized = { ...result, doi }
    const doiKey = doi ? `doi:${doi}` : null
    const titleKey = normalized.title ? `title:${normalizeTitle(normalized.title)}` : null

    if (doiKey && byDoi.has(doiKey)) {
      const merged = mergeResults(byDoi.get(doiKey)!, normalized)
      byDoi.set(doiKey, merged)
      if (titleKey) byTitle.set(titleKey, merged)
      continue
    }

    if (titleKey && byTitle.has(titleKey)) {
      const merged = mergeResults(byTitle.get(titleKey)!, normalized)
      byTitle.set(titleKey, merged)
      if (merged.doi) byDoi.set(`doi:${merged.doi}`, merged)
      continue
    }

    if (doiKey) byDoi.set(doiKey, normalized)
    if (titleKey) byTitle.set(titleKey, normalized)
  }

  return Array.from(new Set([...byDoi.values(), ...byTitle.values()]))
}

function mergeResults(a: SearchResult, b: SearchResult): SearchResult {
  const better = scoreForCompleteness(b) > scoreForCompleteness(a) ? b : a
  const other = better === a ? b : a

  return {
    ...better,
    authors: better.authors.length >= other.authors.length ? better.authors : other.authors,
    year: better.year || other.year,
    doi: better.doi || other.doi,
    venue: better.venue || other.venue,
    url: better.url || other.url,
    abstract: longerText(better.abstract, other.abstract),
    license: better.license || other.license,
    oaStatus: better.oaStatus || other.oaStatus,
    oaPdfUrl: better.oaPdfUrl || other.oaPdfUrl,
    landingPageUrl: better.landingPageUrl || other.landingPageUrl,
    citedByCount: Math.max(better.citedByCount || 0, other.citedByCount || 0),
    accessStatus: accessRank(other.accessStatus) > accessRank(better.accessStatus) ? other.accessStatus : better.accessStatus,
    raw: { primary: better.raw, duplicate: other.raw }
  }
}

function scoreForCompleteness(result: SearchResult): number {
  return [
    result.title,
    result.authors.length,
    result.year,
    result.doi,
    result.venue,
    result.url,
    result.abstract,
    result.oaPdfUrl,
    result.citedByCount
  ].filter(Boolean).length
}

function longerText(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return b.length > a.length ? b : a
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
}

function accessRank(status: SearchResult["accessStatus"]): number {
  if (status === "open_pdf_cache_allowed") return 3
  if (status === "open_pdf") return 2
  if (status === "open_link") return 1
  return 0
}
