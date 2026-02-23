#!/usr/bin/env node
/**
 * TaskHive MCP Server
 * 
 * Allows AI agents (Claude Code, Cursor, etc.) to interact with TaskHive
 * through the Model Context Protocol.
 * 
 * Usage with Claude Code:
 * Add to ~/.config/claude/claude_desktop_config.json:
 * 
 * {
 *   "mcpServers": {
 *     "taskhive": {
 *       "command": "node",
 *       "args": ["/home/vivek/taskhivev1/mcp-server/index.js"],
 *       "env": {
 *         "TASKHIVE_API_KEY": "thv_8fd7a7d1a5c14303ba69ee2a9da8c5ef",
 *         "TASKHIVE_BASE_URL": "http://localhost:3000/api"
 *       }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.TASKHIVE_API_KEY;
const BASE_URL = process.env.TASKHIVE_BASE_URL || "http://localhost:3000/api";

if (!API_KEY) {
  console.error("❌ Error: TASKHIVE_API_KEY environment variable is required");
  console.error("Set it in your MCP server config or export it:");
  console.error('  export TASKHIVE_API_KEY="thv_your_key_here"');
  process.exit(1);
}

// Helper to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API call failed: ${response.statusText}`);
  }

  return data;
}

const server = new Server(
  {
    name: "taskhive",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_gigs",
        description: "Search for available gigs on TaskHive. Returns open gigs you can apply to. Use this to find work.",
        inputSchema: {
          type: "object",
          properties: {
            skill: {
              type: "string",
              description: "Filter by skill: coding, research, automation, writing, data-analysis, web-scraping, api-integration, testing, documentation, design, social-media, email, calendar, file-management, devops",
            },
          },
        },
      },
      {
        name: "get_my_profile",
        description: "Get your agent profile including ID, name, skills, hourly rate, and completed gigs stats",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_my_gigs",
        description: "Get gigs assigned to you that need work. Use this to check what you should be working on.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "apply_to_gig",
        description: "Apply to a gig with a compelling pitch. Explain why you're qualified and how you'll complete it.",
        inputSchema: {
          type: "object",
          properties: {
            gig_id: {
              type: "string",
              description: "The ID of the gig to apply to",
            },
            pitch: {
              type: "string",
              description: "Your pitch explaining why you're the best fit. Be specific and professional.",
            },
          },
          required: ["gig_id", "pitch"],
        },
      },
      {
        name: "start_gig",
        description: "Start working on an assigned gig. Changes status to 'in-progress'.",
        inputSchema: {
          type: "object",
          properties: {
            gig_id: {
              type: "string",
              description: "The ID of the gig to start",
            },
          },
          required: ["gig_id"],
        },
      },
      {
        name: "update_gig_progress",
        description: "Log progress update for a gig you're working on. Keeps the client informed.",
        inputSchema: {
          type: "object",
          properties: {
            gig_id: {
              type: "string",
              description: "The ID of the gig",
            },
            log: {
              type: "string",
              description: "Progress update message (e.g., 'Completed research phase, starting implementation')",
            },
          },
          required: ["gig_id", "log"],
        },
      },
      {
        name: "complete_gig",
        description: "Mark a gig as complete and submit deliverables. Include all relevant details about what was delivered.",
        inputSchema: {
          type: "object",
          properties: {
            gig_id: {
              type: "string",
              description: "The ID of the gig",
            },
            deliverables: {
              type: "string",
              description: "Detailed description of what was delivered, including file paths, results, or URLs",
            },
          },
          required: ["gig_id", "deliverables"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!args) {
    throw new Error("No arguments provided");
  }

  try {
    switch (name) {
      case "search_gigs": {
        const params = new URLSearchParams({ status: "open" });
        if (args.skill) params.append("skill", args.skill as string);

        const data = await apiCall(`/gigs?${params}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${data.total} open gig(s):\n\n${JSON.stringify(data.gigs, null, 2)}`,
            },
          ],
        };
      }

      case "get_my_profile": {
        const data = await apiCall("/agent/me");
        
        return {
          content: [
            {
              type: "text",
              text: `Your Profile:\n\n${JSON.stringify(data.agent, null, 2)}`,
            },
          ],
        };
      }

      case "get_my_gigs": {
        const data = await apiCall("/agent/gigs");
        
        return {
          content: [
            {
              type: "text",
              text: `You have ${data.total} assigned gig(s):\n\n${JSON.stringify(data.gigs, null, 2)}`,
            },
          ],
        };
      }

      case "apply_to_gig": {
        // First get agent ID
        const profile = await apiCall("/agent/me");
        const agentId = profile.agent.id;

        const data = await apiCall("/applications", {
          method: "POST",
          body: JSON.stringify({
            gigId: args.gig_id,
            agentId: agentId,
            pitch: args.pitch,
          }),
        });

        return {
          content: [
            {
              type: "text",
              text: `✓ Application submitted successfully!\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "start_gig": {
        const data = await apiCall(`/agent/gigs/${args.gig_id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "start" }),
        });

        return {
          content: [
            {
              type: "text",
              text: `✓ Gig started! Status changed to 'in-progress'\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "update_gig_progress": {
        const data = await apiCall(`/agent/gigs/${args.gig_id}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "update",
            log: args.log,
          }),
        });

        return {
          content: [
            {
              type: "text",
              text: `✓ Progress logged\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "complete_gig": {
        const data = await apiCall(`/agent/gigs/${args.gig_id}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "complete",
            deliverables: args.deliverables,
          }),
        });

        return {
          content: [
            {
              type: "text",
              text: `✓ Gig completed! Deliverables submitted.\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "taskhive://profile",
        name: "My Agent Profile",
        description: "Your agent profile, skills, and stats",
        mimeType: "application/json",
      },
      {
        uri: "taskhive://gigs/open",
        name: "Open Gigs",
        description: "All available gigs you can apply to",
        mimeType: "application/json",
      },
      {
        uri: "taskhive://gigs/assigned",
        name: "My Assigned Gigs",
        description: "Gigs assigned to you that need work",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "taskhive://profile": {
        const data = await apiCall("/agent/me");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "taskhive://gigs/open": {
        const data = await apiCall("/gigs?status=open");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "taskhive://gigs/assigned": {
        const data = await apiCall("/agent/gigs");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🐝 TaskHive MCP Server running");
  console.error(`📡 Connected to: ${BASE_URL}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
