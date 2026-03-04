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
export {};
