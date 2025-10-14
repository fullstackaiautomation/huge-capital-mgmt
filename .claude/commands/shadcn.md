# Shadcn UI MCP Server

Run the shadcn-ui MCP server to access shadcn/ui component documentation and code.

## Basic Usage (60 requests/hour)
```bash
npx @jpisnice/shadcn-ui-mcp-server
```

## With GitHub Token (5000 requests/hour) - Recommended
```bash
npx @jpisnice/shadcn-ui-mcp-server --github-api-key ghp_your_token_here
```

## Switch Frameworks
```bash
# Svelte
npx @jpisnice/shadcn-ui-mcp-server --framework svelte

# Vue
npx @jpisnice/shadcn-ui-mcp-server --framework vue

# React Native
npx @jpisnice/shadcn-ui-mcp-server --framework react-native
```

## What This Does
- Provides access to shadcn/ui component documentation
- Fetches component code snippets from the official shadcn/ui repository
- Default: React framework (shadcn-ui/ui v4)
- Uses GitHub API (rate limited without token)

## Getting a GitHub Token (Optional)
1. Go to: https://github.com/settings/tokens/new
2. Create a token (no special permissions needed)
3. Use with --github-api-key flag

## Server Info
- **Repository**: shadcn-ui/ui
- **File extension**: .tsx (React)
- **Transport**: stdio
- **Default framework**: react
