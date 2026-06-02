import type { SearchResult, SourceSearchContext } from "../types"
import { deriveAccessStatus } from "../utils/access"
import { normalizeDoi } from "../utils/doi"

export async function searchCore(context: SourceSearchContext): Promise<SearchResult[]> {
  if (!context.apiKey) throw new Error("CORE_API_KEY is required for CORE searches.")

  const params = new URLSearchParams({
    q: context.query,
    limit: String(Math.min(context.limit, 50))
  })
  if (context.yearFrom) params.set("yearFrom", String(context.yearFrom))
  if (context.yearTo) params.set("yearTo", String(context.yearTo))
  if (context.year) {
    params.set("yearFrom", String(context.year))
    params.set("yearTo", String(context.year))
  }

  const response = await fetch(`${context.baseUrl.replace(/\/$/, "")}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${context.apiKey}` },
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`CORE API error: ${response.status}`)

  const data = await response.json() as { results?: CoreWork[] }
  return (data.results || []).map(mapCoreWork).filter((item) => item.title)
}

interface CoreWork {
  id?: string | number
  title?: string
  authors?: Array<{ name?: string } | string>
  yearPublished?: number
  publishedDate?: string
  publisher?: string
  journals?: Array<{ title?: string }>
  doi?: string
  downloadUrl?: string
  fullTextIdentifier?: string
  abstract?: string
  abstractText?: string
  links?: Array<{ type?: string, url?: string }>
  citationCount?: number
}

function mapCoreWork(work: CoreWork): SearchResult {
  const doi = normalizeDoi(work.doi)
  const landingPageUrl = firstUrl(work)
  const pdfUrl = pdfUrlFromWork(work)

  return {
    title: work.title || "",
    authors: parseAuthors(work.authors),
    year: parseYear(work),
    doi,
    venue: work.journals?.[0]?.title || work.publisher || null,
    url: landingPageUrl || (doi ? `https://doi.org/${doi}` : null),
    abstract: work.abstract || work.abstractText || null,
    source: "core",
    externalId: work.id ? String(work.id) : landingPageUrl,
    accessStatus: deriveAccessStatus({
      isOpenAccess: Boolean(pdfUrl || landingPageUrl),
      oaStatus: pdfUrl ? "open" : null,
      pdfUrl,
      landingPageUrl
    }),
    license: null,
    oaStatus: pdfUrl ? "open" : null,
    oaPdfUrl: pdfUrl,
    landingPageUrl,
    citedByCount: work.citationCount || 0,
    raw: work
  }
}

function parseYear(work: CoreWork): number | null {
  if (typeof work.yearPublished === "number") return work.yearPublished
  const match = String(work.publishedDate || "").match(/\b(19|20)\d{2}\b/)
  return match ? Number(match[0]) : null
}

function parseAuthors(authors?: CoreWork["authors"]): string[] {
  if (!Array.isArray(authors)) return []
  return authors
    .map((author) => typeof author === "string" ? author : author.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 12)
}

function firstUrl(work: CoreWork): string | null {
  return work.links?.find((link) => link.url)?.url || work.fullTextIdentifier || work.downloadUrl || null
}

function pdfUrlFromWork(work: CoreWork): string | null {
  const link = work.links?.find((item) => item.url && /pdf/i.test(`${item.type || ""} ${item.url}`))
  return link?.url || (work.downloadUrl && /\.pdf($|\?)/i.test(work.downloadUrl) ? work.downloadUrl : null)
}
