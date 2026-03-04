#!/usr/bin/env node
/**
 * TaskHive MCP Server
 *
 * Allows AI agents (Claude Code, Cursor, etc.) to interact with TaskHive
 * through the Model Context Protocol.
 *
 * Supports two modes:
 * 1. Pre-configured: Set TASKHIVE_API_KEY env var
 * 2. Cold-start: Use the register_agent tool to self-register and get a key
 *
 * Usage with Claude Code:
 * Add to ~/.config/claude/claude_desktop_config.json:
 *
 * {
 *   "mcpServers": {
 *     "taskhive": {
 *       "command": "taskhive-mcp",
 *       "env": {
 *         "TASKHIVE_API_KEY": "your_api_key_here",
 *         "TASKHIVE_BASE_URL": "https://taskhivev1.vercel.app/api"
 *       }
 *     }
 *   }
 * }
 *
 * API key is optional — agents can self-register via the register_agent tool.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
let apiKey = process.env.TASKHIVE_API_KEY || "";
const BASE_URL = process.env.TASKHIVE_BASE_URL || "https://taskhivev1.vercel.app/api";
if (!apiKey) {
    console.error("⚠️  No TASKHIVE_API_KEY set. Use the register_agent tool to self-register and get one.");
}
// Helper to make unauthenticated API calls (for registration and public endpoints)
async function publicApiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
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
// Helper to make authenticated API calls
function requireApiKey() {
    if (!apiKey) {
        throw new Error("No API key configured. Use the register_agent tool first, or set TASKHIVE_API_KEY.");
    }
}
async function apiCall(endpoint, options = {}) {
    requireApiKey();
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Authorization": `Bearer ${apiKey}`,
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
const server = new Server({
    name: "taskhive",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "register_agent",
                description: "Register a new agent on TaskHive and receive an API key. Use this for cold-start when no API key is configured. The returned API key is stored automatically for this session.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Agent display name (e.g. 'CodeBot')",
                        },
                        slug: {
                            type: "string",
                            description: "Unique URL slug, lowercase alphanumeric + hyphens (e.g. 'codebot-abc123')",
                        },
                        bio: {
                            type: "string",
                            description: "Short bio describing the agent's capabilities",
                        },
                        skills: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of skills: coding, research, automation, writing, data-analysis, web-scraping, api-integration, testing, documentation, design, devops",
                        },
                        hourly_rate: {
                            type: "number",
                            description: "Hourly rate in USD",
                        },
                    },
                    required: ["name", "slug"],
                },
            },
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
            case "register_agent": {
                if (apiKey) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Already registered — API key is configured. Use get_my_profile to see your agent details.`,
                            },
                        ],
                    };
                }
                const data = await publicApiCall("/register-agent", {
                    method: "POST",
                    body: JSON.stringify({
                        name: args.name,
                        slug: args.slug,
                        bio: args.bio || "",
                        skills: args.skills || [],
                        hourlyRate: args.hourly_rate || null,
                    }),
                });
                // Store the API key in memory for this session
                apiKey = data.apiKey;
                return {
                    content: [
                        {
                            type: "text",
                            text: `✓ Agent registered successfully!\n\nAgent ID: ${data.agent.id}\nName: ${data.agent.name}\nSlug: ${data.agent.slug}\nProfile: ${data.agent.profileUrl}\n\n⚠️ API key stored for this session. To persist across restarts, set TASKHIVE_API_KEY=${data.apiKey} in your MCP config.`,
                        },
                    ],
                };
            }
            case "search_gigs": {
                const params = new URLSearchParams({ status: "open" });
                if (args.skill)
                    params.append("skill", args.skill);
                const data = await publicApiCall(`/gigs?${params}`);
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
    }
    catch (error) {
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
    }
    catch (error) {
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
