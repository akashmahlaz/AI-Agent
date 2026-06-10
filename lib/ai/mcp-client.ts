import { tool } from "ai";
import type { Tool } from "ai";
import { z } from "zod";
import sql from "@/lib/pg";
import { appendLog } from "@/lib/services/logs";

export interface McpServer {
  id: string;
  userId: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface McpServerRow {
  id: string;
  userId: string;
  name: string;
  config: { url?: string; enabled?: boolean } | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: McpServerRow): McpServer {
  const config = row.config ?? {};
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    url: config.url ?? "",
    enabled: config.enabled !== false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMcpServers(userId: string): Promise<McpServer[]> {
  const rows = await sql<McpServerRow[]>`
    select id, user_id, name, config, created_at, updated_at
    from mcp_servers
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows.map(fromRow);
}

export async function upsertMcpServer(
  userId: string,
  server: { id?: string; name: string; url: string; enabled?: boolean },
) {
  const id = server.id ?? crypto.randomUUID();
  const config = {
    url: server.url.trim(),
    enabled: server.enabled !== false,
  };

  const [row] = await sql<McpServerRow[]>`
    insert into mcp_servers (id, user_id, name, config)
    values (${id}, ${userId}, ${server.name.trim()}, ${sql.json(config)})
    on conflict (id) do update set
      name       = excluded.name,
      config     = excluded.config,
      updated_at = now()
    returning id, user_id, name, config, created_at, updated_at
  `;
  return fromRow(row);
}

export async function deleteMcpServer(userId: string, id: string) {
  await sql`delete from mcp_servers where user_id = ${userId} and id = ${id}`;
}

// MCP JSON-RPC 2.0 over HTTP (streamable HTTP transport)

interface McpRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: number;
}

interface McpRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: { code: number; message: string };
  id: number;
}

async function mcpRpc<T>(url: string, method: string, params?: unknown): Promise<T> {
  const body: McpRpcRequest = { jsonrpc: "2.0", method, params: params ?? {}, id: 1 };
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`MCP server returned HTTP ${response.status}`);
  const data = (await response.json()) as McpRpcResponse<T>;
  if (data.error) throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
  return data.result as T;
}

interface McpToolDef {
  name: string;
  description?: string;
}

/** Build AI SDK tool objects for all enabled MCP servers. Silently skips unreachable servers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMcpTools(userId: string): Promise<Record<string, Tool<any, any>>> {
  const servers = await listMcpServers(userId).catch(() => [] as McpServer[]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, Tool<any, any>> = {};

  for (const server of servers.filter((s) => s.enabled)) {
    try {
      const data = await mcpRpc<{ tools?: McpToolDef[] }>(server.url, "tools/list");
      const toolList = data?.tools ?? [];
      for (const toolDef of toolList) {
        const toolName = `mcp_${server.name.toLowerCase().replace(/\W+/g, "_")}_${toolDef.name}`;
        const serverUrl = server.url;
        const toolDefName = toolDef.name;

        result[toolName] = tool({
          description: toolDef.description ?? toolDef.name,
          inputSchema: z.record(z.string(), z.unknown()),
          execute: async (args: Record<string, unknown>) => {
            await appendLog({
              userId,
              level: "info",
              source: "mcp",
              message: `MCP tool called: ${toolDefName}`,
              metadata: { server: server.name, tool: toolDefName },
            });
            return mcpRpc(serverUrl, "tools/call", { name: toolDefName, arguments: args });
          },
        });
      }
    } catch (error) {
      await appendLog({
        userId,
        level: "warn",
        source: "mcp",
        message: `MCP server unreachable: ${server.name}`,
        metadata: {
          url: server.url,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return result;
}
