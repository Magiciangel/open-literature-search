import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Open Literature Search",
  description: "An open-source SaaS for natural-language academic literature search across open scholarly sources."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
