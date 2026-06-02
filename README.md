# Open Literature Search

Open Literature Search is an open-source SaaS for natural-language academic literature search across open scholarly sources.

It lets users search OpenAlex, Crossref, Semantic Scholar, arXiv, PubMed, and DOAJ from one web interface. Results are normalized into one structure, merged by DOI/title, ranked by relevance, and enriched with open-access signals from Unpaywall when DOI data is available.

## What It Does

- Natural-language academic literature search
- Multi-source search across open scholarly indexes
- OpenAlex, Crossref, Semantic Scholar, arXiv, PubMed, and DOAJ support
- Optional Unpaywall enrichment for open full-text links
- Unified result structure
- DOI normalization
- DOI/title deduplication
- Relevance, year, citation count, and open-access-first sorting
- JSON and Markdown result views
- MIT-licensed open-source code

## What It Does Not Do

This project intentionally keeps a narrow product boundary. It does not include user accounts, login, Prisma, a database, project libraries, membership, credits, payments, AI writing, RAG, PDF parsing, Word export, admin panels, or commercial workflow logic.

## Local Development

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification

```bash
npm test
npm run typecheck
npm run build
```

## Environment

Unpaywall works without configuration by using a generic contact email, but production deployments should set:

```bash
UNPAYWALL_EMAIL=you@example.com
```

## Project Structure

```txt
app/
  api/search/route.ts   # SaaS search API
  page.tsx              # English web search interface
src/
  search.ts             # Search pipeline
  sources/              # Open scholarly source adapters
  utils/                # DOI, access, dedupe, ranking helpers
test/                   # Core unit tests
```

## Original Author And License

Original author: **Zeke**

This project is released under the MIT License. Anyone can use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the software, as long as they keep the copyright notice and license text with the software.

That means downstream users must preserve:

```txt
Copyright (c) 2026 Zeke
```

See [LICENSE](./LICENSE) for the full license text.
