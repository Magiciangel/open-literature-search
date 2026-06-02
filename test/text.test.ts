import { describe, expect, it } from "vitest"
import { cleanText } from "../src/utils/text"

describe("cleanText", () => {
  it("removes source HTML markup and decodes common entities", () => {
    expect(cleanText("AI video <i>vs.</i> written feedback &amp; assessment")).toBe("AI video vs. written feedback & assessment")
  })
})
