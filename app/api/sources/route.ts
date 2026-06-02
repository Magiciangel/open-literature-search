import { NextResponse } from "next/server"
import { getPublicSourceConfigs } from "../../../src/config/sources"

export async function GET() {
  return NextResponse.json({
    sources: getPublicSourceConfigs()
  })
}
