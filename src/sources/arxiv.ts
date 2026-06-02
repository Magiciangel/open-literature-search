import type { SearchResult, SourceSearchContext } from "../types"
import { normalizeDoi } from "../utils/doi"
import { getAllTags, getFirstTag, getTagBlocks } from "../utils/xml"

export async function searchArxiv(context: SourceSearchContext): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    search_query: `all:"${context.query.replace(/"/g, " ")}"`,
    start: "0",
    max_results: String(Math.min(context.limit, 50)),
    sortBy: "relevance",
    sortOrder: "descending"
  })

  const response = await fetch(`${context.baseUrl.replace(/\/$/, "")}/query?${params.toString()}`, {
    headers: { "User-Agent": "open-literature-search/0.1.0" },
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!response.ok) throw new Error(`arXiv API error: ${response.status}`)

  const xml = await response.text()
  return getTagBlocks(xml, "entry").map(mapArxivEntry).filter((item) => {
    if (!item.title) return false
    if (context.year && item.year !== context.year) return false
    if (context.yearFrom && (!item.year || item.year < context.yearFrom)) return false
    if (context.yearTo && (!item.year || item.year > context.yearTo)) return false
    return true
  })
}

function mapArxivEntry(entry: string): SearchResult {
  const id = getFirstTag(entry, "id")
  const published = getFirstTag(entry, "published")
  const doi = normalizeDoi(getFirstTag(entry, "arxiv:doi"))
  const pdfMatch = entry.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/i)

  return {
    title: getFirstTag(entry, "title") || "",
    authors: getTagBlocks(entry, "author").map((author) => getFirstTag(author, "name") || "").filter(Boolean).slice(0, 12),
    year: published ? Number(published.slice(0, 4)) || null : null,
    doi,
    venue: "arXiv",
    url: id || null,
    abstract: getFirstTag(entry, "summary"),
    source: "arxiv",
    externalId: id?.split("/").pop() || null,
    accessStatus: "open_pdf",
    license: null,
    oaStatus: "green",
    oaPdfUrl: pdfMatch?.[1] || (id ? id.replace("/abs/", "/pdf/") : null),
    landingPageUrl: id || null,
    citedByCount: 0,
    raw: { id, categories: getAllTags(entry, "category") }
  }
}
