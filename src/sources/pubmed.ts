import type { SearchResult, SourceSearchContext } from "../types"
import { normalizeDoi } from "../utils/doi"
import { getAllTags, getFirstTag, getTagBlocks } from "../utils/xml"

const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

export async function searchPubMed(context: SourceSearchContext): Promise<SearchResult[]> {
  const term = buildPubMedTerm(context)
  if (!term) return []

  const searchParams = new URLSearchParams({
    db: "pubmed",
    term,
    retmode: "json",
    retmax: String(Math.min(context.limit, 50))
  })
  const searchResponse = await fetch(`${BASE_URL}/esearch.fcgi?${searchParams.toString()}`, {
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!searchResponse.ok) throw new Error(`PubMed esearch error: ${searchResponse.status}`)

  const searchData = await searchResponse.json() as { esearchresult?: { idlist?: string[] } }
  const ids = searchData.esearchresult?.idlist || []
  if (!ids.length) return []

  const fetchParams = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml"
  })
  const fetchResponse = await fetch(`${BASE_URL}/efetch.fcgi?${fetchParams.toString()}`, {
    signal: AbortSignal.timeout(context.timeoutMs)
  })
  if (!fetchResponse.ok) throw new Error(`PubMed efetch error: ${fetchResponse.status}`)

  const xml = await fetchResponse.text()
  return getTagBlocks(xml, "PubmedArticle").map(mapPubMedArticle).filter((item) => item.title)
}

function buildPubMedTerm(context: SourceSearchContext): string {
  const parts = [context.query]
  const yearClause = context.year
    ? `${context.year}[PDAT]`
    : context.yearFrom || context.yearTo
      ? `${context.yearFrom || "1900"}:${context.yearTo || "3000"}[PDAT]`
      : null
  if (yearClause) parts.push(yearClause)
  return parts.filter(Boolean).join(" AND ")
}

function mapPubMedArticle(article: string): SearchResult {
  const pmid = getFirstTag(article, "PMID")
  const title = getFirstTag(article, "ArticleTitle") || ""
  const journal = getFirstTag(article, "Title") || getFirstTag(article, "ISOAbbreviation")
  const year = Number(getFirstTag(article, "Year")) || null
  const doi = normalizeDoi(getArticleId(article, "doi"))

  return {
    title,
    authors: getTagBlocks(article, "Author").map(formatPubMedAuthor).filter(Boolean).slice(0, 12),
    year,
    doi,
    venue: journal || null,
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
    abstract: getAllTags(article, "AbstractText").join(" ") || null,
    source: "pubmed",
    externalId: pmid || null,
    accessStatus: "metadata_only",
    license: null,
    oaStatus: null,
    oaPdfUrl: null,
    landingPageUrl: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
    citedByCount: 0,
    raw: { pmid, doi }
  }
}

function formatPubMedAuthor(authorBlock: string): string {
  const collectiveName = getFirstTag(authorBlock, "CollectiveName")
  if (collectiveName) return collectiveName
  return [getFirstTag(authorBlock, "ForeName"), getFirstTag(authorBlock, "LastName")].filter(Boolean).join(" ")
}

function getArticleId(article: string, idType: string): string | null {
  const match = article.match(new RegExp(`<ArticleId\\s+IdType="${idType}">([\\s\\S]*?)<\\/ArticleId>`, "i"))
  return match?.[1] || null
}
