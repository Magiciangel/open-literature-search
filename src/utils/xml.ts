export function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export function getTagBlocks(xml: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tagName}>`, "gi")
  return xml.match(pattern) || []
}

export function getFirstTag(xml: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i")
  const match = xml.match(pattern)
  return match ? decodeXml(match[1]) : null
}

export function getAllTags(xml: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "gi")
  return Array.from(xml.matchAll(pattern)).map((match) => decodeXml(match[1]))
}
