import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
/**
 * Resolves and sets DATABASE_URL for Prisma, then ensures DB is initialized.
 * @param userDbPath Optional user-defined path to the SQLite file.
 * @returns The absolute resolved .db file path
 */
export function setupPrismaDatabase(userDbPath?: string): string {
  // Priority: user param > DATABASE_URL > fallback
  const rawPath =
    userDbPath ||
    (process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/^file:/, "")
      : undefined) ||
    "./memoer.db";

  const absPath = path.resolve(rawPath); // Get absolute path
  process.env.DATABASE_URL = `file:${absPath}`; // Prisma expects "file:/..."

  console.error(`[MCP] Using DATABASE_URL: ${process.env.DATABASE_URL}`);

  // Create DB and schema if missing
  execSync(`npx prisma db push --schema=${schemaPath}`, { stdio: "inherit" });

  return absPath;
}

// Set up the database using the new function
setupPrismaDatabase();

const prisma = new PrismaClient();

// Create MCP server instance
const server = new McpServer({
  name: "memoer-mcp",
  version: "1.0.0"
});

await prisma.user.upsert({
  where: { name: "default-user" },
  update: {
    name: "default-user"
  },
  create: {
    id: randomUUID(),
    name: "default-user"
  }
});

// Define tool for creating a new memory
server.tool(
  "createMemory",
  {
    content: z
      .string()
      .describe("the content/memory to store into memoer-mcp local storage"),
    appName: z.string().describe("the name of the app/agent you are")
  },
  async ({ content, appName }: { content: string; appName: string }) => {
    try {
      // Format appId to lowercase with underscores
      const formattedAppId = appName.toLowerCase().replace(/\s+/g, "_");

      // Check if appId exists, if not create it
      await prisma.app.upsert({
        where: { name: formattedAppId },
        update: {},
        create: {
          name: formattedAppId,
          owner: {
            connectOrCreate: {
              where: { name: "default-user" },
              create: {
                id: randomUUID(),
                name: "default-user"
              }
            }
          }
        }
      });

      // Create memory with categories if provided
      const memory = await prisma.memory.create({
        data: {
          content,
          app: {
            connect: {
              name: formattedAppId
            }
          },
          user: {
            connect: {
              name: "default-user" // For MVP, we're using a single user
            }
          }
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `Memory created successfully with ID: ${memory.id}`
          }
        ]
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error creating memory: ${JSON.stringify(
              error,
              Object.getOwnPropertyNames(error),
              2
            )}, message: ${errorMessage}`
          }
        ]
      };
    }
  }
);

// Define tool for retrieving memories
server.tool(
  "getMemories",
  {
    appName: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().optional()
  },
  async ({
    appName,
    category,
    limit = 10
  }: {
    appName?: string;
    category?: string;
    limit?: number;
  }) => {
    try {
      const memories = await prisma.memory.findMany({
        where: {
          ...(appName && { appName }),
          ...(category && {
            categories: {
              some: {
                category: {
                  name: category
                }
              }
            }
          })
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        },
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memories, null, 2)
          }
        ]
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving memories: ${errorMessage}`
          }
        ]
      };
    }
  }
);

// Connect server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
