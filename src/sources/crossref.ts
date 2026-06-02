import type { SearchResult, SourceSearchContext } from "../types"
import { normalizeDoi } from "../utils/doi"

const BASE_URL = "https://api.crossref.org"

export async function searchCrossref(context: SourceSearchContext): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    query: context.query,
    rows: String(Math.min(context.limit, 50))
  })

  const filters = [
    context.year ? `from-pub-date:${context.year}-01-01,until-pub-date:${context.year}-12-31` : null,
    !context.year && context.yearFrom ? `from-pub-date:${context.yearFrom}-01-01` : null,
    !context.year && context.yearTo ? `until-pub-date:${context.yearTo}-12-31` : null
  ].filter(Boolean).join(",")
  if (filters) params.set("filter", filters)

  const response = await fetch(`${BASE_URL}/works?${params.toString()}`, {
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`Crossref API error: ${response.status}`)

  const data = await response.json() as { message?: { items?: CrossrefWork[] } }
  return (data.message?.items || []).map(mapCrossrefWork).filter((item) => item.title)
}

interface CrossrefWork {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string, family?: string }>
  published?: { "date-parts"?: number[][] }
  created?: { "date-parts"?: number[][] }
  "container-title"?: string[]
  URL?: string
  abstract?: string
  "is-referenced-by-count"?: number
}

function mapCrossrefWork(work: CrossrefWork): SearchResult {
  const doi = normalizeDoi(work.DOI)
  const doiUrl = doi ? `https://doi.org/${doi}` : null

  return {
    title: Array.isArray(work.title) ? work.title[0] || "" : "",
    authors: (work.author || []).map((author) => `${author.given || ""} ${author.family || ""}`.trim()).filter(Boolean).slice(0, 12),
    year: work.published?.["date-parts"]?.[0]?.[0] || work.created?.["date-parts"]?.[0]?.[0] || null,
    doi,
    venue: work["container-title"]?.[0] || null,
    url: doiUrl || work.URL || null,
    abstract: stripHtml(work.abstract || null),
    source: "crossref",
    externalId: work.DOI || null,
    accessStatus: "metadata_only",
    license: null,
    oaStatus: null,
    oaPdfUrl: null,
    landingPageUrl: work.URL || doiUrl,
    citedByCount: work["is-referenced-by-count"] || 0,
    raw: work
  }
}

function stripHtml(value: string | null): string | null {
  return value ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : null
}
