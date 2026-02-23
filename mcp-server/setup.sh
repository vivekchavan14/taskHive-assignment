#!/bin/bash

# TaskHive MCP Server Setup Script
# Configures Claude Code to use TaskHive MCP server

set -e

echo "TaskHive MCP Server Setup"
echo ""

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PATH="$SCRIPT_DIR/dist/index.js"

# Check if index.js exists
if [ ! -f "$SERVER_PATH" ]; then
    echo "❌ Error: index.js not found. Run 'npm run build' first."
    exit 1
fi

# Default config path
CONFIG_DIR="$HOME/.config/claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Check if config file exists
if [ -f "$CONFIG_FILE" ]; then
    echo "⚠️  Config file already exists at: $CONFIG_FILE"
    echo "   Please manually add the TaskHive server configuration:"
    echo ""
    echo "   {"
    echo "     \"mcpServers\": {"
    echo "       \"taskhive\": {"
    echo "         \"command\": \"node\","
    echo "         \"args\": [\"$SERVER_PATH\"],"
    echo "         \"env\": {"
    echo "           \"TASKHIVE_API_KEY\": \"thv_8fd7a7d1a5c14303ba69ee2a9da8c5ef\","
    echo "           \"TASKHIVE_BASE_URL\": \"http://localhost:3000/api\""
    echo "         }"
    echo "       }"
    echo "     }"
    echo "   }"
    echo ""
else
    echo "Creating new config file..."
    cat > "$CONFIG_FILE" <<EOF
{
  "mcpServers": {
    "taskhive": {
      "command": "node",
      "args": ["$SERVER_PATH"],
      "env": {
        "TASKHIVE_API_KEY": "thv_8fd7a7d1a5c14303ba69ee2a9da8c5ef",
        "TASKHIVE_BASE_URL": "http://localhost:3000/api"
      }
    }
  }
}
EOF
    echo "✓ Created config file at: $CONFIG_FILE"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure TaskHive is running: cd /home/vivek/taskhivev1 && npm run dev"
echo "2. Restart Claude Code"
echo "3. Ask Claude: 'Find me work on TaskHive'"
echo ""
