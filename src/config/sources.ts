import { SEARCH_SOURCES, type SourcePublicConfig, type SourceRuntimeConfig } from "../types"
import { SOURCE_METADATA } from "../sources/metadata"

type SourceEnv = Record<string, string | undefined>

export function getSourceConfigs(env: SourceEnv = process.env): SourceRuntimeConfig[] {
  return SEARCH_SOURCES.map((source) => {
    const metadata = SOURCE_METADATA[source]
    const apiKey = metadata.apiKeyEnv ? env[metadata.apiKeyEnv]?.trim() : undefined
    const explicitlyEnabled = parseEnabled(env[metadata.enabledEnv])
    const enabled = explicitlyEnabled ?? !metadata.requiresApiKey

    return {
      source,
      label: metadata.label,
      enabled,
      baseUrl: env[metadata.baseUrlEnv]?.trim() || metadata.defaultBaseUrl,
      requiresApiKey: metadata.requiresApiKey,
      apiKey,
      apiKeyEnv: metadata.apiKeyEnv,
      baseUrlEnv: metadata.baseUrlEnv,
      enabledEnv: metadata.enabledEnv
    }
  })
}

export function getPublicSourceConfigs(env: SourceEnv = process.env): SourcePublicConfig[] {
  return getSourceConfigs(env).map((config) => ({
    source: config.source,
    label: config.label,
    enabled: config.enabled,
    baseUrl: config.baseUrl,
    requiresApiKey: config.requiresApiKey,
    hasApiKey: Boolean(config.apiKey),
    apiKeyEnv: config.apiKeyEnv,
    baseUrlEnv: config.baseUrlEnv,
    enabledEnv: config.enabledEnv
  }))
}

function parseEnabled(value?: string): boolean | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return null
}
