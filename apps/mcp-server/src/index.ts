#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// SupplyForge MCP Server — Logistics Tools for Claude AI
// Protocol: Model Context Protocol (MCP) via stdio
// ══════════════════════════════════════════════════════════════════

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { apiClient } from './api-client.js';
import { tools } from './tools/index.js';
import { resources } from './resources/index.js';

const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'supplyforge-logistics',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// ── Tool Handlers ──────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.values(tools).map((t) => t.definition),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = tools[name];

  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.execute(args || {}, apiClient);
    return {
      content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Resource Handlers ──────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: Object.values(resources).map((r) => r.definition),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const resourceType = uri.split('://')[0];
  const resource = resources[resourceType];

  if (!resource) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  const content = await resource.read(uri, apiClient);
  return {
    contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(content, null, 2) }],
  };
});

// ── Start ──────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('SupplyForge MCP server running on stdio\n');
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err.message}\n`);
  process.exit(1);
});
