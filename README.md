# @memoer-mcp

A minimal, pluggable memory management library for Node.js, inspired by OpenMemory. Supports local SQLite storage, semantic search (Qdrant), and OpenAI embeddings. No web server, no frontend—just a programmatic API.

## Features

- Add, list, update, delete memories
- Semantic search (Qdrant)
- User, app, and category support
- Local SQLite (via Prisma)
- TypeScript-first

## Getting Started

1. **Install dependencies**:

   ```sh
   npm install
   ```

2. **Initialize the database**:

   ```sh
   npx prisma migrate dev --name init
   ```

3. **Configure the MCP**: Create or update your MCP configuration file (e.g., `mcp_config.json`) as follows:

   ```json
   {
     "memoer-mcp": {
       "command": "npx",
       "args": ["memoer-mcp@latest"],
       "env": {
         "DATABASE_URL": "file:/Users/{your_username}/{any_folder_path}/memoer.db" //macOS example
       }
     }
   }
   ```

4. **Use the library in your project**:

   ```typescript
   import { MemoerMCP } from "@memoer-mcp";

   const memoer = new MemoerMCP();

   // Example: Adding a memory
   await memoer.addMemory({
     title: "My First Memory",
     content: "This is the content of my first memory.",
     category: "Personal"
   });

   // Example: Listing memories
   const memories = await memoer.listMemories();
   console.log(memories);
   ```

## Development

- Edit the Prisma schema in `prisma/schema.prisma`
- Run `npx prisma generate` after changes
- Source code in `src/`

---

This library is now fully functional and ready for use in your projects!

````

### MCP Configuration Example

In your `mcp_config.json`, you can configure the `memoer-mcp` command as follows:

```json
{
  "memoer-mcp": {
    "command": "npx",
    "args": ["memoer-mcp@latest"],
    "env": {
      "DATABASE_URL": "file:/Users/{your_username}/{any_folder_path}/memoer.db" //macOS example
    }
  }
}
````

### Explanation of Configuration

- **command**: This specifies the command to run, which in this case is `npx` to execute the `memoer-mcp` package.
- **args**: This is an array of arguments passed to the command. Here, it specifies the package to run.
- **env**: This section allows you to set environment variables needed for your application. The `DATABASE_URL` points to your SQLite database file.

### Usage

With this setup, you can now run `memoer-mcp` from your command line or integrate it into your application as shown in the examples. This configuration allows you to manage memories effectively using the `memoer-mcp` library.

If you have any further questions or need additional examples, feel free to ask!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
