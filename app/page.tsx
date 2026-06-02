"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SEARCH_SOURCES, type LiteratureSearchResult, type LiteratureSort, type SearchSource } from "../src/types"
import { SOURCE_METADATA } from "../src/sources/metadata"

const SOURCE_LABELS = Object.fromEntries(
  SEARCH_SOURCES.map((source) => [source, SOURCE_METADATA[source].label])
) as Record<SearchSource, string>

const SAMPLE_QUERIES = [
  "AI feedback in academic writing",
  "retrieval augmented generation in education",
  "open access publishing incentives"
]

export default function HomePage() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0])
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState<LiteratureSort>("relevance")
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(["openalex", "crossref", "semantic-scholar", "arxiv"])
  const [onlyOpenAccess, setOnlyOpenAccess] = useState(false)
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const [result, setResult] = useState<LiteratureSearchResult | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [outputMode, setOutputMode] = useState<"results" | "markdown" | "json">("results")

  const markdown = useMemo(() => result ? formatMarkdown(result) : "", [result])

  async function submitSearch(event?: React.FormEvent) {
    event?.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit,
          sort,
          sources: selectedSources,
          onlyOpenAccess,
          yearFrom: yearFrom || undefined,
          yearTo: yearTo || undefined
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Search failed.")
      setResult(data)
      setOutputMode("results")
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed.")
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSource(source: SearchSource) {
    setSelectedSources((current) => {
      if (current.includes(source)) {
        return current.length === 1 ? current : current.filter((item) => item !== source)
      }
      return [...current, source]
    })
  }

  async function copyOutput() {
    if (!result) return
    const value = outputMode === "json" ? JSON.stringify(result, null, 2) : markdown
    await navigator.clipboard.writeText(value)
  }

  return (
    <main className="shell">
      <section className="searchPanel">
        <div className="brandRow">
          <div className="brandMark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">Open-source academic search SaaS</p>
            <h1>Open Literature Search</h1>
            <Link className="settingsLink" href="/settings/sources">Source settings</Link>
          </div>
        </div>

        <form onSubmit={submitSearch} className="searchForm">
          <label htmlFor="query">Natural-language query</label>
          <div className="queryRow">
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search open scholarly sources..."
            />
            <button type="submit" disabled={isLoading}>{isLoading ? "Searching" : "Search"}</button>
          </div>
        </form>

        <div className="samples" aria-label="Sample searches">
          {SAMPLE_QUERIES.map((sample) => (
            <button key={sample} type="button" onClick={() => setQuery(sample)}>{sample}</button>
          ))}
        </div>

        <div className="controls">
          <fieldset>
            <legend>Sources</legend>
            <div className="sourceGrid">
              {SEARCH_SOURCES.map((source) => (
                <label key={source} className="checkPill">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source)}
                    onChange={() => toggleSource(source)}
                  />
                  <span>{SOURCE_LABELS[source]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="controlGrid">
            <label>
              Sort
              <select value={sort} onChange={(event) => setSort(event.target.value as LiteratureSort)}>
                <option value="relevance">Relevance</option>
                <option value="year">Newest year</option>
                <option value="citations">Most cited</option>
                <option value="open-access">Open access first</option>
              </select>
            </label>
            <label>
              Limit
              <input type="number" min="1" max="30" value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
            </label>
            <label>
              From year
              <input inputMode="numeric" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} placeholder="Any" />
            </label>
            <label>
              To year
              <input inputMode="numeric" value={yearTo} onChange={(event) => setYearTo(event.target.value)} placeholder="Any" />
            </label>
          </div>

          <label className="toggleLine">
            <input type="checkbox" checked={onlyOpenAccess} onChange={(event) => setOnlyOpenAccess(event.target.checked)} />
            Open access results only
          </label>
        </div>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <div>
            <p className="eyebrow">Unified results</p>
            <h2>{result ? `${result.results.length} papers found` : "Ready to search"}</h2>
          </div>
          <div className="segmented">
            <button className={outputMode === "results" ? "active" : ""} onClick={() => setOutputMode("results")}>Results</button>
            <button className={outputMode === "markdown" ? "active" : ""} onClick={() => setOutputMode("markdown")} disabled={!result}>Markdown</button>
            <button className={outputMode === "json" ? "active" : ""} onClick={() => setOutputMode("json")} disabled={!result}>JSON</button>
          </div>
        </div>

        {error ? <p className="errorBox">{error}</p> : null}

        {!result && !error ? (
          <div className="emptyState">
            <div className="sourceMap" aria-hidden="true">
              {SEARCH_SOURCES.map((source) => <span key={source}>{SOURCE_LABELS[source]}</span>)}
            </div>
            <p>Search once and the app will merge DOI/title duplicates, rank the papers, and mark open-access links.</p>
          </div>
        ) : null}

        {result && outputMode === "results" ? (
          <>
            <div className="statusRow">
              {result.sources.map((source) => (
                <span key={source.source} className={source.status === "ok" ? "ok" : "failed"}>
                  {SOURCE_LABELS[source.source]} · {source.count}
                </span>
              ))}
            </div>
            <div className="resultList">
              {result.results.map((paper, index) => (
                <article key={`${paper.source}-${paper.externalId || paper.doi || index}`} className="resultCard">
                  <div className="resultTop">
                    <span>{paper.source}</span>
                    <span>{paper.year || "n.d."}</span>
                    <span>{paper.citedByCount} citations</span>
                    {paper.oaPdfUrl ? <span className="openBadge">PDF</span> : null}
                  </div>
                  <h3>{paper.title}</h3>
                  <p className="authors">{paper.authors.length ? paper.authors.join(", ") : "Unknown authors"}</p>
                  <p className="abstract">{paper.abstract || "No abstract available."}</p>
                  <div className="links">
                    {paper.doi ? <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">DOI</a> : null}
                    {paper.url ? <a href={paper.url} target="_blank" rel="noreferrer">Landing page</a> : null}
                    {paper.oaPdfUrl ? <a href={paper.oaPdfUrl} target="_blank" rel="noreferrer">Open PDF</a> : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {result && outputMode !== "results" ? (
          <div className="outputBlock">
            <button type="button" onClick={copyOutput}>Copy</button>
            <pre>{outputMode === "json" ? JSON.stringify(result, null, 2) : markdown}</pre>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function formatMarkdown(result: LiteratureSearchResult): string {
  if (!result.results.length) return "No results found."
  return result.results.map((paper, index) => {
    const meta = [paper.year, paper.venue, paper.source].filter(Boolean).join(" · ")
    const links = [
      paper.doi ? `DOI: https://doi.org/${paper.doi}` : null,
      paper.url ? `URL: ${paper.url}` : null,
      paper.oaPdfUrl ? `Open PDF: ${paper.oaPdfUrl}` : null
    ].filter(Boolean)
    return [
      `### ${index + 1}. ${paper.title}`,
      paper.authors.join(", ") || "Unknown authors",
      meta,
      `Citations: ${paper.citedByCount}`,
      ...links
    ].filter(Boolean).join("\n")
  }).join("\n\n")
}
