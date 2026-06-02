import type { AccessStatus } from "../types"

const CACHE_ALLOWED_LICENSES = new Set([
  "cc0",
  "cc-by",
  "cc-by-sa",
  "cc-by-nc",
  "cc-by-nc-sa",
  "public-domain"
])

export function normalizeLicense(license?: string | null): string | null {
  if (!license) return null

  const lower = license.toLowerCase().trim()
  if (lower.startsWith("http")) {
    const creativeCommons = lower.match(/creativecommons\.org\/licenses\/([^/]+)/)
    if (creativeCommons?.[1]) return `cc-${creativeCommons[1]}`
    if (lower.includes("publicdomain")) return "public-domain"
  }

  return lower.replace(/_/g, "-")
}

export function deriveAccessStatus(input: {
  isOpenAccess?: boolean | null
  oaStatus?: string | null
  license?: string | null
  pdfUrl?: string | null
  landingPageUrl?: string | null
}): AccessStatus {
  const license = normalizeLicense(input.license)

  if (input.pdfUrl && license && CACHE_ALLOWED_LICENSES.has(license)) {
    return "open_pdf_cache_allowed"
  }

  if (input.pdfUrl) return "open_pdf"
  if (input.isOpenAccess || input.oaStatus || input.landingPageUrl) return "open_link"

  return "metadata_only"
}

export function hasOpenAccessSignal(result: {
  accessStatus?: string
  oaPdfUrl?: string | null
  oaStatus?: string | null
}) {
  return Boolean(
    result.oaPdfUrl ||
    result.oaStatus ||
    result.accessStatus === "open_link" ||
    result.accessStatus === "open_pdf" ||
    result.accessStatus === "open_pdf_cache_allowed"
  )
}
