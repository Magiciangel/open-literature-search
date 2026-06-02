import { searchArxiv } from "./sources/arxiv"
import { searchCrossref } from "./sources/crossref"
import { searchDoaj } from "./sources/doaj"
import { searchOpenAlex } from "./sources/openalex"
import { searchPubMed } from "./sources/pubmed"
import { searchSemanticScholar } from "./sources/semantic-scholar"
import { enrichWithUnpaywall } from "./sources/unpaywall"
import { SEARCH_SOURCES, type LiteratureSearchOptions, type LiteratureSearchResult, type SearchResult, type SearchSource, type SourceSearch, type SourceStatus } from "./types"
import { hasOpenAccessSignal } from "./utils/access"
import { dedupeResults } from "./utils/dedupe"
import { rankResults } from "./utils/rank"

const SOURCE_SEARCHERS: Record<SearchSource, SourceSearch> = {
  openalex: searchOpenAlex,
  crossref: searchCrossref,
  "semantic-scholar": searchSemanticScholar,
  arxiv: searchArxiv,
  pubmed: searchPubMed,
  doaj: searchDoaj
}

export async function searchLiterature(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureSearchResult> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim()
  if (!normalizedQuery) throw new Error("Search query is required.")

  const limit = clamp(options.limit || 10, 1, 50)
  const timeoutMs = options.timeoutMs || 12_000
  const sources = normalizeSources(options.sources)
  const providerLimit = Math.min(50, Math.max(limit * 2, 20))

  const sourceRuns = await Promise.allSettled(sources.map(async (source) => {
    const results = await SOURCE_SEARCHERS[source]({
      query: normalizedQuery,
      limit: providerLimit,
      year: options.year,
      yearFrom: options.yearFrom,
      yearTo: options.yearTo,
      onlyOpenAccess: options.onlyOpenAccess,
      timeoutMs
    })
    return { source, results }
  }))

  const statuses: SourceStatus[] = sourceRuns.map((run, index) => {
    const source = sources[index]
    if (run.status === "fulfilled") return { source, status: "ok", count: run.value.results.length }
    return { source, status: "failed", count: 0, error: run.reason instanceof Error ? run.reason.message : String(run.reason) }
  })

  const combined = sourceRuns.flatMap((run) => run.status === "fulfilled" ? run.value.results : [])
  const deduped = dedupeResults(combined)
  const filtered = options.onlyOpenAccess ? deduped.filter(hasOpenAccessSignal) : deduped
  const enriched = options.enrichWithUnpaywall === false
    ? filtered
    : await enrichResults(filtered, options.unpaywallEmail, Math.min(timeoutMs, 10_000))
  const ranked = rankResults(enriched, normalizedQuery, options.sort).slice(0, limit)

  return {
    query: normalizedQuery,
    results: ranked,
    sources: statuses
  }
}

async function enrichResults(results: SearchResult[], email?: string, timeoutMs?: number): Promise<SearchResult[]> {
  return Promise.all(results.map((result) => enrichWithUnpaywall(result, email, timeoutMs)))
}

function normalizeSources(sources?: SearchSource[]): SearchSource[] {
  if (!sources?.length) return [...SEARCH_SOURCES]
  const allowed = new Set<SearchSource>(SEARCH_SOURCES)
  return Array.from(new Set(sources)).filter((source) => allowed.has(source))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
