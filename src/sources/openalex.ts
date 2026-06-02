import type { SearchResult, SourceSearchContext } from "../types"
import { deriveAccessStatus, normalizeLicense } from "../utils/access"
import { normalizeDoi } from "../utils/doi"

export async function searchOpenAlex(context: SourceSearchContext): Promise<SearchResult[]> {
  const select = [
    "id",
    "doi",
    "title",
    "authorships",
    "publication_year",
    "primary_location",
    "best_oa_location",
    "open_access",
    "cited_by_count",
    "abstract_inverted_index"
  ].join(",")

  const filters = [
    context.year ? `publication_year:${context.year}` : null,
    context.yearFrom ? `from_publication_date:${context.yearFrom}-01-01` : null,
    context.yearTo ? `to_publication_date:${context.yearTo}-12-31` : null,
    context.onlyOpenAccess ? "is_oa:true" : null
  ].filter(Boolean).join(",")

  const params = new URLSearchParams({
    search: context.query,
    per_page: String(Math.min(context.limit, 50)),
    select
  })
  if (filters) params.set("filter", filters)

  const response = await fetch(`${context.baseUrl.replace(/\/$/, "")}/works?${params.toString()}`, {
    headers: { "User-Agent": "open-literature-search/0.1.0" },
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`OpenAlex API error: ${response.status}`)

  const data = await response.json() as { results?: OpenAlexWork[] }
  return (data.results || []).map(mapOpenAlexWork).filter((item) => item.title)
}

interface OpenAlexWork {
  id?: string
  doi?: string | null
  title?: string
  authorships?: Array<{ author?: { display_name?: string } }>
  publication_year?: number
  primary_location?: OpenAlexLocation | null
  best_oa_location?: OpenAlexLocation | null
  open_access?: { is_oa?: boolean, oa_status?: string | null }
  cited_by_count?: number
  abstract_inverted_index?: Record<string, number[]>
}

interface OpenAlexLocation {
  pdf_url?: string | null
  landing_page_url?: string | null
  license?: string | null
  source?: { display_name?: string | null } | null
}

function mapOpenAlexWork(work: OpenAlexWork): SearchResult {
  const bestLocation = work.best_oa_location || work.primary_location || null
  const pdfUrl = bestLocation?.pdf_url || null
  const doi = normalizeDoi(work.doi)
  const landingPageUrl = bestLocation?.landing_page_url || work.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : work.id || null)
  const license = normalizeLicense(bestLocation?.license || work.primary_location?.license || null)
  const oaStatus = work.open_access?.oa_status || null

  return {
    title: work.title || "",
    authors: (work.authorships || []).slice(0, 12).map((item) => item.author?.display_name || "").filter(Boolean),
    year: work.publication_year || null,
    doi,
    venue: work.primary_location?.source?.display_name || null,
    url: doi ? `https://doi.org/${doi}` : landingPageUrl,
    abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : null,
    source: "openalex",
    externalId: work.id || null,
    accessStatus: deriveAccessStatus({
      isOpenAccess: work.open_access?.is_oa || false,
      oaStatus,
      license,
      pdfUrl,
      landingPageUrl
    }),
    license,
    oaStatus,
    oaPdfUrl: pdfUrl,
    landingPageUrl,
    citedByCount: work.cited_by_count || 0,
    raw: work
  }
}

function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words = new Map<number, string>()
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) words.set(position, word)
  }
  return Array.from(words.entries())
    .sort(([a], [b]) => a - b)
    .map(([, word]) => word)
    .join(" ")
}
