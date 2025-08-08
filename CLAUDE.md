# Claude Code Project Configuration

## MCP Servers Configuration

### Configured MCP Servers:
- **cipher**: Memory-powered coding assistant
  - Command: `C:\mcp\cipher-mcp-server\start-cipher.bat`
  - Status: Should show ✓ Connected
  
- **serena**: Semantic coding agent toolkit
  - Command: `C:\mcp\start_serena_mcp.bat`
  - Status: Should show ✓ Connected

### Verification Commands:
```bash
# Check MCP server status
claude mcp list

# Test MCP servers
/ListMcpResourcesTool
/mcp__cipher__ask_cipher "Hello"
/mcp__serena__initial_instructions
```

### Troubleshooting:
If MCP servers show as disconnected:
1. Check if uv is installed and in PATH
2. Restart Claude Code session
3. Check server logs in C:\mcp\ directory