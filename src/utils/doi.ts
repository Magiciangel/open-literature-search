export function normalizeDoi(doi?: string | null): string | null {
  if (!doi) return null

  const trimmed = doi
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^https?:\/\/doi\.org\//i, "")

  const match = trimmed.match(/10\.\d{4,9}\/\S+/i)
  if (!match) return null

  return match[0]
    .replace(/[)\].,;]+$/g, "")
    .toLowerCase()
}
