# Contributing

Thanks for helping improve Open Literature Search.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

Before opening a pull request, run:

```bash
npm test
npm run typecheck
npm run build
```

## Adding A Source

1. Add the source ID to `SEARCH_SOURCES` in `src/types.ts`.
2. Add metadata in `src/sources/metadata.ts`.
3. Create an adapter in `src/sources/<source>.ts`.
4. Register the adapter in `src/search.ts`.
5. Add tests for config or result mapping when practical.

Keep adapters small and map everything into the shared `SearchResult` shape.

## Pull Requests

- Keep changes focused.
- Include screenshots for UI changes.
- Mention source API limits or API key needs when adding a source.
- Avoid adding user accounts, payments, databases, AI writing, RAG, or project-library logic to this repository.
