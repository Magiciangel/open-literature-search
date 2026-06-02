import { NextResponse } from "next/server"
import { searchLiterature } from "../../../src/search"
import { SEARCH_SOURCES, type LiteratureSort, type SearchSource } from "../../../src/types"

export async function POST(request: Request) {
  try {
    const body = await request.json() as SearchRequestBody
    const query = typeof body.query === "string" ? body.query.trim() : ""
    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 })
    }

    const result = await searchLiterature(query, {
      limit: clamp(Number(body.limit) || 10, 1, 30),
      sources: normalizeSources(body.sources),
      sort: normalizeSort(body.sort),
      yearFrom: normalizeOptionalYear(body.yearFrom),
      yearTo: normalizeOptionalYear(body.yearTo),
      onlyOpenAccess: Boolean(body.onlyOpenAccess),
      enrichWithUnpaywall: body.enrichWithUnpaywall !== false,
      unpaywallEmail: process.env.UNPAYWALL_EMAIL,
      timeoutMs: 12_000
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Search failed."
    }, { status: 500 })
  }
}

interface SearchRequestBody {
  query?: unknown
  limit?: unknown
  sources?: unknown
  sort?: unknown
  yearFrom?: unknown
  yearTo?: unknown
  onlyOpenAccess?: unknown
  enrichWithUnpaywall?: unknown
}

function normalizeSources(value: unknown): SearchSource[] {
  if (!Array.isArray(value)) return [...SEARCH_SOURCES]
  const allowed = new Set<SearchSource>(SEARCH_SOURCES)
  return Array.from(new Set(value.filter((item): item is SearchSource => allowed.has(item as SearchSource))))
}

function normalizeSort(value: unknown): LiteratureSort {
  if (value === "year" || value === "citations" || value === "open-access") return value
  return "relevance"
}

function normalizeOptionalYear(value: unknown): number | undefined {
  const year = Number(value)
  if (!Number.isInteger(year) || year < 1800 || year > 3000) return undefined
  return year
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
