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
export {};
