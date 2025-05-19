# @memoer-mcp

A minimal, pluggable memory management library for Node.js, inspired by OpenMemory. Supports local SQLite storage, semantic search (Qdrant), and OpenAI embeddings. No web server, no frontend—just a programmatic API.

## Features (MVP)

- Add, list, update, delete memories
- Semantic search (Qdrant)
- User, app, and category support
- Local SQLite (via Prisma)
- TypeScript-first

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Initialize the database:
   ```sh
   npx prisma migrate dev --name init
   ```
3. Use the library in your project:
   ```ts
   import { MemoerMCP } from "@memoer-mcp";
   // ...
   ```

## Development

- Edit the Prisma schema in `prisma/schema.prisma`
- Run `npx prisma generate` after changes
- Source code in `src/`

---

Work in progress!
