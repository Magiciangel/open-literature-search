import type { SearchResult, SourceSearchContext } from "../types"
import { deriveAccessStatus } from "../utils/access"
import { normalizeDoi } from "../utils/doi"

export async function searchEuropePmc(context: SourceSearchContext): Promise<SearchResult[]> {
  const queryParts = [context.query]
  if (context.year) queryParts.push(`PUB_YEAR:${context.year}`)
  if (!context.year && (context.yearFrom || context.yearTo)) {
    queryParts.push(`FIRST_PDATE:[${context.yearFrom || 1800}-01-01 TO ${context.yearTo || 3000}-12-31]`)
  }

  const params = new URLSearchParams({
    query: queryParts.join(" "),
    format: "json",
    pageSize: String(Math.min(context.limit, 50)),
    resultType: "core"
  })

  const response = await fetch(`${context.baseUrl.replace(/\/$/, "")}/search?${params.toString()}`, {
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`Europe PMC API error: ${response.status}`)

  const data = await response.json() as { resultList?: { result?: EuropePmcWork[] } }
  return (data.resultList?.result || []).map(mapEuropePmcWork).filter((item) => item.title)
}

interface EuropePmcWork {
  id?: string
  source?: string
  title?: string
  authorString?: string
  pubYear?: string
  journalTitle?: string
  doi?: string
  abstractText?: string
  citedByCount?: number
  isOpenAccess?: "Y" | "N"
  fullTextUrlList?: {
    fullTextUrl?: Array<{ url?: string, documentStyle?: string, availability?: string }>
  }
}

function mapEuropePmcWork(work: EuropePmcWork): SearchResult {
  const doi = normalizeDoi(work.doi)
  const fullTextUrls = work.fullTextUrlList?.fullTextUrl || []
  const pdfUrl = fullTextUrls.find((item) => /pdf/i.test(`${item.documentStyle || ""} ${item.url || ""}`))?.url || null
  const landingPageUrl = doi ? `https://doi.org/${doi}` : work.id ? `https://europepmc.org/article/${work.source || "MED"}/${work.id}` : null
  const isOpenAccess = work.isOpenAccess === "Y"

  return {
    title: work.title || "",
    authors: work.authorString ? work.authorString.split(",").map((author) => author.trim()).filter(Boolean).slice(0, 12) : [],
    year: Number(work.pubYear) || null,
    doi,
    venue: work.journalTitle || null,
    url: landingPageUrl,
    abstract: work.abstractText || null,
    source: "europepmc",
    externalId: work.id || null,
    accessStatus: deriveAccessStatus({
      isOpenAccess,
      oaStatus: isOpenAccess ? "open" : null,
      pdfUrl,
      landingPageUrl
    }),
    license: null,
    oaStatus: isOpenAccess ? "open" : null,
    oaPdfUrl: pdfUrl,
    landingPageUrl,
    citedByCount: work.citedByCount || 0,
    raw: work
  }
}
