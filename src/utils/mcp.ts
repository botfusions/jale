/**
 * MCP Utility
 * Uses steipete's mcporter to provide easy access to MCP servers.
 */

let runtime: any = null;

async function getRuntime() {
  if (runtime) return runtime;

  try {
    // Dynamic import to handle mcporter (ESM) in this CommonJS project
    const { createRuntime } = await (eval('import("mcporter")') as Promise<
      typeof import('mcporter')
    >);
    runtime = await createRuntime();
    return runtime;
  } catch (error) {
    console.error('[MCP Utility] Failed to initialize mcporter runtime:', error);
    throw error;
  }
}

/**
 * Lists all configured MCP servers.
 */
export async function listMcpServers(): Promise<string[]> {
  const rt = await getRuntime();
  return rt.listServers();
}

/**
 * Lists tools for a specific MCP server.
 */
export async function listMcpTools(serverName: string) {
  const rt = await getRuntime();
  return rt.listTools(serverName);
}

/**
 * Calls a specific tool on an MCP server.
 */
export async function callMcpTool(
  server: string,
  toolName: string,
  args: Record<string, any> = {}
) {
  const rt = await getRuntime();
  console.log(`[MCP Utility] Calling tool ${toolName} on server ${server}...`);
  return rt.callTool(server, toolName, { args });
}

/**
 * Lists all tools available across ALL configured MCP servers.
 * Useful for providing a comprehensive "tool set" to an agent.
 */
export async function listAllMcpTools() {
  const servers = await listMcpServers();
  const allTools: Array<{ server: string; name: string; description?: string; inputSchema?: any }> =
    [];

  for (const server of servers) {
    try {
      const tools = await listMcpTools(server);
      allTools.push(...tools.map((t: any) => ({ ...t, server })));
    } catch (e) {
      console.warn(`[MCP Utility] Could not list tools for server ${server}:`, e);
    }
  }

  return allTools;
}
