import type { SearchSource } from "../types"

export const SOURCE_METADATA: Record<SearchSource, {
  label: string
  defaultBaseUrl: string
  requiresApiKey: boolean
  apiKeyEnv?: string
  baseUrlEnv: string
  enabledEnv: string
}> = {
  openalex: {
    label: "OpenAlex",
    defaultBaseUrl: "https://api.openalex.org",
    requiresApiKey: false,
    baseUrlEnv: "OPENALEX_BASE_URL",
    enabledEnv: "OPENALEX_ENABLED"
  },
  crossref: {
    label: "Crossref",
    defaultBaseUrl: "https://api.crossref.org",
    requiresApiKey: false,
    baseUrlEnv: "CROSSREF_BASE_URL",
    enabledEnv: "CROSSREF_ENABLED"
  },
  "semantic-scholar": {
    label: "Semantic Scholar",
    defaultBaseUrl: "https://api.semanticscholar.org",
    requiresApiKey: false,
    apiKeyEnv: "SEMANTIC_SCHOLAR_API_KEY",
    baseUrlEnv: "SEMANTIC_SCHOLAR_BASE_URL",
    enabledEnv: "SEMANTIC_SCHOLAR_ENABLED"
  },
  arxiv: {
    label: "arXiv",
    defaultBaseUrl: "https://export.arxiv.org/api",
    requiresApiKey: false,
    baseUrlEnv: "ARXIV_BASE_URL",
    enabledEnv: "ARXIV_ENABLED"
  },
  pubmed: {
    label: "PubMed",
    defaultBaseUrl: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    requiresApiKey: false,
    apiKeyEnv: "PUBMED_API_KEY",
    baseUrlEnv: "PUBMED_BASE_URL",
    enabledEnv: "PUBMED_ENABLED"
  },
  doaj: {
    label: "DOAJ",
    defaultBaseUrl: "https://doaj.org/api",
    requiresApiKey: false,
    baseUrlEnv: "DOAJ_BASE_URL",
    enabledEnv: "DOAJ_ENABLED"
  },
  europepmc: {
    label: "Europe PMC",
    defaultBaseUrl: "https://www.ebi.ac.uk/europepmc/webservices/rest",
    requiresApiKey: false,
    baseUrlEnv: "EUROPEPMC_BASE_URL",
    enabledEnv: "EUROPEPMC_ENABLED"
  },
  core: {
    label: "CORE",
    defaultBaseUrl: "https://api.core.ac.uk/v3/search/works",
    requiresApiKey: true,
    apiKeyEnv: "CORE_API_KEY",
    baseUrlEnv: "CORE_BASE_URL",
    enabledEnv: "CORE_ENABLED"
  }
}
