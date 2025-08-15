// Fetch Notion page content using MCP (Managed Content Platform)
// This replaces the local API proxy approach

export async function fetchNotionRecordMap(pageId: string): Promise<any> {
  try {
    // Since we have access to Notion MCP, we should use that instead of a local API
    // For now, we'll return null to indicate that MCP should be used
    // The actual MCP integration happens in useNotionIntegration.ts
    console.log(`[Notion] Attempting to fetch page ${pageId} via MCP`);
    
    // Return null to indicate that the page should be fetched via MCP
    // The useNotionIntegration hook will handle the actual MCP calls
    return null;
  } catch (error) {
    console.error(`[Notion] Error fetching page ${pageId}:`, error);
    throw error;
  }
}

// Alternative: If you want to use the public Notion API proxy
export async function fetchNotionRecordMapViaProxy(pageId: string): Promise<any> {
  try {
    // Use the public Notion API proxy
    const endpoint = `https://notion-api.splitbee.io/v1/page/${encodeURIComponent(pageId)}`;
    const res = await fetch(endpoint);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch Notion page ${pageId}: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error(`[Notion] Error fetching page ${pageId} via proxy:`, error);
    throw error;
  }
}




