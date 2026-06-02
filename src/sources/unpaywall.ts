import type { SearchResult } from "../types"
import { deriveAccessStatus, normalizeLicense } from "../utils/access"
import { normalizeDoi } from "../utils/doi"

export interface UnpaywallResult {
  doi: string
  title: string
  oaStatus: string | null
  pdfUrl: string | null
  bestOALocation: {
    url: string
    urlForPdf: string | null
    license: string | null
    version: string | null
  } | null
  isOpenAccess: boolean
}

export async function searchUnpaywall(doi: string, email?: string, timeoutMs = 10_000): Promise<UnpaywallResult | null> {
  const normalized = normalizeDoi(doi)
  if (!normalized) return null

  const contactEmail = email || process.env.UNPAYWALL_EMAIL || "open-literature-search@example.com"
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(normalized)}?email=${encodeURIComponent(contactEmail)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Unpaywall API error: ${response.status}`)
  }

  const data = await response.json() as UnpaywallApiResponse
  const bestOALocation = data.best_oa_location || null

  return {
    doi: data.DOI || normalized,
    title: data.title || "",
    oaStatus: data.oa_status || null,
    pdfUrl: bestOALocation?.url_for_pdf || null,
    bestOALocation: bestOALocation ? {
      url: bestOALocation.url || "",
      urlForPdf: bestOALocation.url_for_pdf || null,
      license: bestOALocation.license || null,
      version: bestOALocation.version || null
    } : null,
    isOpenAccess: Boolean(data.is_oa)
  }
}

export async function enrichWithUnpaywall(result: SearchResult, email?: string, timeoutMs = 10_000): Promise<SearchResult> {
  const doi = normalizeDoi(result.doi)
  if (!doi) return result

  try {
    const openAccess = await searchUnpaywall(doi, email, timeoutMs)
    if (!openAccess) return { ...result, doi }

    const license = normalizeLicense(openAccess.bestOALocation?.license || result.license)
    const oaPdfUrl = openAccess.pdfUrl || result.oaPdfUrl
    const landingPageUrl = openAccess.bestOALocation?.url || result.landingPageUrl || result.url

    return {
      ...result,
      doi,
      url: result.url || landingPageUrl,
      license,
      oaStatus: openAccess.oaStatus || result.oaStatus,
      oaPdfUrl,
      landingPageUrl,
      accessStatus: deriveAccessStatus({
        isOpenAccess: openAccess.isOpenAccess,
        oaStatus: openAccess.oaStatus,
        license,
        pdfUrl: oaPdfUrl,
        landingPageUrl
      }),
      raw: {
        source: result.raw,
        unpaywall: openAccess
      }
    }
  } catch {
    return { ...result, doi }
  }
}

interface UnpaywallApiResponse {
  DOI?: string
  title?: string
  oa_status?: string
  is_oa?: boolean
  best_oa_location?: {
    url?: string
    url_for_pdf?: string | null
    license?: string | null
    version?: string | null
  } | null
}
