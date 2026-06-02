export const SEARCH_SOURCES = [
  "openalex",
  "crossref",
  "semantic-scholar",
  "arxiv",
  "pubmed",
  "doaj"
] as const

export type SearchSource = typeof SEARCH_SOURCES[number]

export type LiteratureSort = "relevance" | "year" | "citations" | "open-access"

export type AccessStatus = "metadata_only" | "open_link" | "open_pdf" | "open_pdf_cache_allowed"

export interface LiteratureSearchOptions {
  limit?: number
  sources?: SearchSource[]
  year?: number
  yearFrom?: number
  yearTo?: number
  onlyOpenAccess?: boolean
  sort?: LiteratureSort
  timeoutMs?: number
  enrichWithUnpaywall?: boolean
  unpaywallEmail?: string
}

export interface SourceStatus {
  source: SearchSource
  status: "ok" | "failed"
  count: number
  error?: string
}

export interface SearchResult {
  title: string
  authors: string[]
  year: number | null
  doi: string | null
  venue: string | null
  url: string | null
  abstract: string | null
  source: SearchSource
  externalId: string | null
  accessStatus: AccessStatus
  license: string | null
  oaStatus: string | null
  oaPdfUrl: string | null
  landingPageUrl: string | null
  citedByCount: number
  relevanceScore?: number
  raw?: unknown
}

export interface LiteratureSearchResult {
  query: string
  results: SearchResult[]
  sources: SourceStatus[]
}

export interface SourceSearchContext {
  query: string
  limit: number
  year?: number
  yearFrom?: number
  yearTo?: number
  onlyOpenAccess?: boolean
  timeoutMs: number
}

export type SourceSearch = (context: SourceSearchContext) => Promise<SearchResult[]>
