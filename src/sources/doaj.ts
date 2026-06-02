import type { SearchResult, SourceSearchContext } from "../types"
import { deriveAccessStatus, normalizeLicense } from "../utils/access"
import { normalizeDoi } from "../utils/doi"

const BASE_URL = "https://doaj.org/api"

export async function searchDoaj(context: SourceSearchContext): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    page: "1",
    pageSize: String(Math.min(context.limit, 50))
  })
  const response = await fetch(`${BASE_URL}/search/articles/${encodeURIComponent(context.query)}?${params.toString()}`, {
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`DOAJ API error: ${response.status}`)

  const data = await response.json() as { results?: DoajResult[] }
  return (data.results || []).map(mapDoajResult).filter((item) => {
    if (!item.title) return false
    if (context.year && item.year !== context.year) return false
    if (context.yearFrom && (!item.year || item.year < context.yearFrom)) return false
    if (context.yearTo && (!item.year || item.year > context.yearTo)) return false
    return true
  })
}

interface DoajResult {
  id?: string
  bibjson?: {
    title?: string
    author?: Array<{ name?: string }>
    year?: string | number
    abstract?: string
    journal?: { title?: string }
    identifier?: Array<{ type?: string, id?: string }>
    link?: Array<{ type?: string, url?: string }>
    license?: Array<{ type?: string }>
  }
}

function mapDoajResult(result: DoajResult): SearchResult {
  const bibjson = result.bibjson || {}
  const identifiers = bibjson.identifier || []
  const links = bibjson.link || []
  const doi = normalizeDoi(identifiers.find((item) => item.type === "doi")?.id)
  const pdfUrl = links.find((item) => /pdf/i.test(`${item.type || ""} ${item.url || ""}`))?.url || null
  const landingPageUrl = links[0]?.url || (doi ? `https://doi.org/${doi}` : null)
  const license = normalizeLicense(bibjson.license?.[0]?.type || null)

  return {
    title: bibjson.title || "",
    authors: (bibjson.author || []).map((author) => author.name || "").filter(Boolean).slice(0, 12),
    year: Number(bibjson.year) || null,
    doi,
    venue: bibjson.journal?.title || null,
    url: landingPageUrl,
    abstract: bibjson.abstract || null,
    source: "doaj",
    externalId: result.id || null,
    accessStatus: deriveAccessStatus({
      isOpenAccess: true,
      oaStatus: "gold",
      license,
      pdfUrl,
      landingPageUrl
    }),
    license,
    oaStatus: "gold",
    oaPdfUrl: pdfUrl,
    landingPageUrl,
    citedByCount: 0,
    raw: result
  }
}
