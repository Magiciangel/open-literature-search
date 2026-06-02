import Link from "next/link"
import { getPublicSourceConfigs } from "../../../src/config/sources"

export default function SourceSettingsPage() {
  const sources = getPublicSourceConfigs()

  return (
    <main className="settingsShell">
      <header className="settingsHeader">
        <div>
          <p className="eyebrow">Source settings</p>
          <h1>Configure scholarly sources</h1>
          <p>Use environment variables to enable sources, set API keys, or override base URLs without exposing secrets in the browser.</p>
        </div>
        <Link href="/">Back to search</Link>
      </header>

      <section className="settingsIntro">
        <h2>How to edit sources</h2>
        <pre>{`# .env.local
SEMANTIC_SCHOLAR_API_KEY=your_key
CORE_API_KEY=your_key
UNPAYWALL_EMAIL=you@example.com

# Optional source switches
CORE_ENABLED=true
SEMANTIC_SCHOLAR_ENABLED=true

# Optional base URL overrides
OPENALEX_BASE_URL=https://api.openalex.org`}</pre>
      </section>

      <section className="sourceSettingsGrid">
        {sources.map((source) => (
          <article key={source.source} className="sourceSettingsCard">
            <div className="sourceSettingsTop">
              <h2>{source.label}</h2>
              <span className={source.enabled ? "enabledBadge" : "disabledBadge"}>{source.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <dl>
              <div>
                <dt>Source ID</dt>
                <dd>{source.source}</dd>
              </div>
              <div>
                <dt>Base URL</dt>
                <dd>{source.baseUrl}</dd>
              </div>
              <div>
                <dt>Base URL env</dt>
                <dd>{source.baseUrlEnv}</dd>
              </div>
              <div>
                <dt>Enabled env</dt>
                <dd>{source.enabledEnv}</dd>
              </div>
              <div>
                <dt>API key</dt>
                <dd>{source.apiKeyEnv ? `${source.apiKeyEnv} · ${source.hasApiKey ? "set" : "not set"}` : "Not required"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  )
}
