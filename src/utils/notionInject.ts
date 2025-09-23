// Utility to inject Notion content from MCP server into chatbot knowledge base
import { addInjectedDoc } from '@/knowledge/docs';
import { allowlistedNotionPages } from '@/knowledge/notion-allowlist';

// Function to inject content from Notion using the global function
export function injectNotionContentFromMCP(title: string, content: string, url?: string): void {
  if (typeof window !== 'undefined' && (window as any).injectHomeBuyingKnowledge) {
    (window as any).injectHomeBuyingKnowledge(title, content, url);
  } else {
    // Fallback: inject directly if window function not available
    addInjectedDoc(title, content, url);
  }
}

// Function to manually inject allowlisted Notion pages (for testing/development)
export function injectAllowlistedContent(pages: Array<{title: string, content: string, url?: string}>): void {
  console.log('[Notion] Injecting allowlisted content:', pages.length, 'pages');

  pages.forEach(page => {
    injectNotionContentFromMCP(page.title, page.content, page.url);
  });

  console.log('[Notion] Finished injecting allowlisted content');
}

// Helper to get allowlisted page IDs for MCP fetching
export function getAllowlistedPageIds(): Array<{title: string, pageId: string}> {
  return allowlistedNotionPages;
}

// Development helper to inject sample content for testing
export function injectSampleNotionContent(): void {
  const sampleContent = `
## Home Buying Made Transparent

### Key Pain Points We Address:
1. **Hidden Costs**: Buyers never know what additional closing costs will come up
2. **Complex Information**: Disclosures and TIC agreements are hard to understand
3. **Fragmented Process**: Information scattered across multiple tools

### Our Solution:
- Single source of truth for the entire home buying journey
- AI-powered document summaries that highlight important information
- Real-time cost calculators for monthly expenses
- Chat-based guidance through every step of the process

### Benefits for Buyers:
- Clear understanding of all costs upfront
- Simplified explanations of complex documents
- Guidance through the entire process
- Reduced stress and uncertainty

### Benefits for Agents:
- Less time spent on repetitive buyer education
- Tools to help buyers understand complex documents
- Better buyer confidence and trust
- Streamlined communication and transparency
  `;

  injectNotionContentFromMCP(
    'Make home buying transparent - Full Content',
    sampleContent,
    'https://www.notion.so/15ff821f9675800faa69f8d774ab773f'
  );

  console.log('[Notion] Sample content injected for testing');
}