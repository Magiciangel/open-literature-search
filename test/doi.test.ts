import { describe, expect, it } from "vitest"
import { normalizeDoi } from "../src/utils/doi"

describe("normalizeDoi", () => {
  it("normalizes DOI URLs and prefixes", () => {
    expect(normalizeDoi("https://doi.org/10.1145/1234567.890123")).toBe("10.1145/1234567.890123")
    expect(normalizeDoi("doi: 10.1000/ABC.123.")).toBe("10.1000/abc.123")
  })

  it("returns null for empty or invalid input", () => {
    expect(normalizeDoi("")).toBeNull()
    expect(normalizeDoi("hello")).toBeNull()
  })
})
