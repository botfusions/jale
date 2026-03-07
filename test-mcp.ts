async function test() {
    try {
        console.log('Loading mcporter...');
        const { createRuntime } = await (eval('import("mcporter")') as Promise<typeof import('mcporter')>);
        
        console.log('Discovering MCP servers...');
        const runtime = await createRuntime();
        const servers = runtime.listServers();
        
        console.log(`Found ${servers.length} configured servers:`);
        for (const serverName of servers) {
            console.log(`- ${serverName}`);
            try {
                const tools = await runtime.listTools(serverName);
                console.log(`  Tools: ${tools.map((t: any) => t.name).join(', ')}`);
            } catch (e) {
                console.log(`  (Could not list tools: ${e})`);
            }
        }
    } catch (error) {
        console.error('Error during mcporter discovery:', error);
    }
}

test();
