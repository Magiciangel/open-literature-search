import { searchArxiv } from "./sources/arxiv"
import { searchCrossref } from "./sources/crossref"
import { searchDoaj } from "./sources/doaj"
import { searchCore } from "./sources/core"
import { searchEuropePmc } from "./sources/europepmc"
import { searchOpenAlex } from "./sources/openalex"
import { searchPubMed } from "./sources/pubmed"
import { searchSemanticScholar } from "./sources/semantic-scholar"
import { enrichWithUnpaywall } from "./sources/unpaywall"
import { getSourceConfigs } from "./config/sources"
import { type LiteratureSearchOptions, type LiteratureSearchResult, type SearchResult, type SearchSource, type SourceRuntimeConfig, type SourceSearch, type SourceStatus } from "./types"
import { hasOpenAccessSignal } from "./utils/access"
import { dedupeResults } from "./utils/dedupe"
import { rankResults } from "./utils/rank"
import { cleanSearchResult } from "./utils/text"

const SOURCE_SEARCHERS: Record<SearchSource, SourceSearch> = {
  openalex: searchOpenAlex,
  crossref: searchCrossref,
  "semantic-scholar": searchSemanticScholar,
  arxiv: searchArxiv,
  pubmed: searchPubMed,
  doaj: searchDoaj,
  europepmc: searchEuropePmc,
  core: searchCore
}

export async function searchLiterature(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureSearchResult> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim()
  if (!normalizedQuery) throw new Error("Search query is required.")

  const limit = clamp(options.limit || 10, 1, 50)
  const timeoutMs = options.timeoutMs || 12_000
  const sourceConfigs = normalizeSourceConfigs(options.sourceConfigs || getSourceConfigs(), options.sources)
  const providerLimit = Math.min(50, Math.max(limit * 2, 20))

  const sourceRuns = await Promise.allSettled(sourceConfigs.map(async (config) => {
    const results = await SOURCE_SEARCHERS[config.source]({
      query: normalizedQuery,
      limit: providerLimit,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      year: options.year,
      yearFrom: options.yearFrom,
      yearTo: options.yearTo,
      onlyOpenAccess: options.onlyOpenAccess,
      timeoutMs
    })
    return { source: config.source, results }
  }))

  const statuses: SourceStatus[] = sourceRuns.map((run, index) => {
    const source = sourceConfigs[index].source
    if (run.status === "fulfilled") return { source, status: "ok", count: run.value.results.length }
    return { source, status: "failed", count: 0, error: run.reason instanceof Error ? run.reason.message : String(run.reason) }
  })

  const combined = sourceRuns
    .flatMap((run) => run.status === "fulfilled" ? run.value.results : [])
    .map(cleanSearchResult)
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

function normalizeSourceConfigs(configs: SourceRuntimeConfig[], sources?: SearchSource[]): SourceRuntimeConfig[] {
  const selected = sources?.length ? new Set(sources) : null
  const available = configs.filter((config) => {
    if (!config.enabled) return false
    if (config.requiresApiKey && !config.apiKey) return false
    return selected ? selected.has(config.source) : true
  })
  return available.length ? available : configs.filter((config) => config.enabled && !config.requiresApiKey)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
