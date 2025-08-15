// Proxies a Notion page's recordMap using the public splitbee Notion API.
// This works for public Notion pages without requiring an API key.
// If your page is private, consider using your MCP to inject content
// or a secured server-side integration.

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { pageId } = req.query as { pageId?: string };
    if (!pageId) {
      res.status(400).json({ error: 'Missing pageId' });
      return;
    }

    const url = `https://notion-api.splitbee.io/v1/page/${encodeURIComponent(pageId)}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Failed to fetch Notion page' });
      return;
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Unexpected error fetching Notion content' });
  }
}

export const config = { maxDuration: 30 };



