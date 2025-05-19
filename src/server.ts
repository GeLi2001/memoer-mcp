import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { z } from "zod";

const prisma = new PrismaClient();

// Create MCP server instance
const server = new McpServer({
  name: "memoer-mcp",
  version: "1.0.0"
});

await prisma.user.upsert({
  where: { name: "default-user" },
  update: {
    name: "Default User"
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
    content: z.string(),
    appId: z.string()
  },
  async ({ content, appId }: { content: string; appId: string }) => {
    try {
      // Format appId to lowercase with underscores
      const formattedAppId = appId.toLowerCase().replace(/\s+/g, "_");

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
    appId: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().optional()
  },
  async ({
    appId,
    category,
    limit = 10
  }: {
    appId?: string;
    category?: string;
    limit?: number;
  }) => {
    try {
      const memories = await prisma.memory.findMany({
        where: {
          ...(appId && { appId }),
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
