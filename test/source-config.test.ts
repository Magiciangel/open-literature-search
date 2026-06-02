import { describe, expect, it } from "vitest"
import { getSourceConfigs, getPublicSourceConfigs } from "../src/config/sources"

describe("source configuration", () => {
  it("enables public sources by default and keeps API-only CORE disabled without a key", () => {
    const configs = getSourceConfigs({})
    expect(configs.find((item) => item.source === "openalex")?.enabled).toBe(true)
    expect(configs.find((item) => item.source === "europepmc")?.enabled).toBe(true)
    expect(configs.find((item) => item.source === "core")?.enabled).toBe(false)
  })

  it("reads source API keys and base URL overrides from env", () => {
    const configs = getPublicSourceConfigs({
      CORE_API_KEY: "secret",
      CORE_ENABLED: "true",
      CORE_BASE_URL: "https://example.com/core"
    })
    const core = configs.find((item) => item.source === "core")

    expect(core?.enabled).toBe(true)
    expect(core?.hasApiKey).toBe(true)
    expect(core?.baseUrl).toBe("https://example.com/core")
  })
})
