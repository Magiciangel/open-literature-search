import type { SearchResult, SourceSearchContext } from "../types"
import { normalizeDoi } from "../utils/doi"

export async function searchSemanticScholar(context: SourceSearchContext): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    query: context.query,
    limit: String(Math.min(context.limit, 100)),
    fields: "title,authors,year,venue,abstract,externalIds,url,citationCount,openAccessPdf"
  })
  if (context.year) params.set("year", String(context.year))
  if (!context.year && (context.yearFrom || context.yearTo)) {
    params.set("year", `${context.yearFrom || ""}-${context.yearTo || ""}`)
  }

  const response = await fetch(`${context.baseUrl.replace(/\/$/, "")}/graph/v1/paper/search?${params.toString()}`, {
    headers: context.apiKey ? { "x-api-key": context.apiKey } : undefined,
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`Semantic Scholar API error: ${response.status}`)

  const data = await response.json() as { data?: SemanticScholarPaper[] }
  return (data.data || []).map(mapSemanticScholarPaper).filter((item) => item.title)
}

interface SemanticScholarPaper {
  paperId?: string
  title?: string
  authors?: Array<{ name?: string }>
  year?: number
  venue?: string
  abstract?: string
  externalIds?: { DOI?: string }
  url?: string
  citationCount?: number
  openAccessPdf?: { url?: string | null } | null
}

function mapSemanticScholarPaper(paper: SemanticScholarPaper): SearchResult {
  const doi = normalizeDoi(paper.externalIds?.DOI)
  const pdfUrl = paper.openAccessPdf?.url || null

  return {
    title: paper.title || "",
    authors: (paper.authors || []).map((author) => author.name || "").filter(Boolean).slice(0, 12),
    year: paper.year || null,
    doi,
    venue: paper.venue || null,
    url: paper.url || (doi ? `https://doi.org/${doi}` : null),
    abstract: paper.abstract || null,
    source: "semantic-scholar",
    externalId: paper.paperId || null,
    accessStatus: pdfUrl ? "open_pdf" : "metadata_only",
    license: null,
    oaStatus: pdfUrl ? "open" : null,
    oaPdfUrl: pdfUrl,
    landingPageUrl: paper.url || null,
    citedByCount: paper.citationCount || 0,
    raw: paper
  }
}
