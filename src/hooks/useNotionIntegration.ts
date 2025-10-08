// src/hooks/useNotionIntegration.ts
import { useEffect } from 'react';
import { injectKnowledge } from '@/services/chatbot';
import { allowlistedNotionPages } from '@/knowledge/notion-allowlist';

// Hook to integrate with Notion MCP for "Make home buying transparent" content
export const useNotionIntegration = () => {
  useEffect(() => {
    // Expose the injection function globally for MCP integration
    if (typeof window !== 'undefined') {
      // Keep a debug buffer of injected docs for inspection in DevTools
      (window as any).__homeBuyingKnowledgeDocs = (window as any).__homeBuyingKnowledgeDocs || [];
      // Provide a friendly alias without leading underscores
      (window as any).homeBuyingKnowledgeDocs = (window as any).__homeBuyingKnowledgeDocs;

      (window as any).injectHomeBuyingKnowledge = (title: string, content: string, url?: string) => {
        const lower = title.toLowerCase();
        const isAccepted = lower.includes('make home buying transparent') ||
          lower.includes('home buying') ||
          lower.includes('buyer') ||
          lower.includes('real estate') ||
          lower.includes('mortgage') ||
          lower.includes('property');

        if (isAccepted) {
          injectKnowledge(title, content, url);

          const payload = {
            title,
            length: content?.length ?? 0,
            injectedAt: new Date().toISOString(),
            url,
          };
          try {
            (window as any).__homeBuyingKnowledgeDocs.push({ ...payload, content });
            // Keep alias in sync (same reference already, but ensure it's present)
            (window as any).homeBuyingKnowledgeDocs = (window as any).__homeBuyingKnowledgeDocs;
          } catch (e) {
            console.error('[MCP] Error adding to window array:', e);
          }

          if ((import.meta as any)?.env?.DEV) {
            // High-signal console output in dev only
            console.log('[MCP] Injected home buying knowledge', payload);
            if (content) {
              console.debug('[MCP] Content preview:', content.slice(0, 400));
            }
          }
        } else {
          console.warn('[MCP] Rejected knowledge (filtered out):', title);
        }
      };

      // Initialize MCP integration
      (async () => {
        try {
          console.log('[Notion] Initializing MCP integration...');
          
          // Log the allowlisted pages for reference
          console.log('[Notion] Allowlisted pages for MCP:', allowlistedNotionPages.map(p => p.title));
          console.log('[Notion] MCP integration ready. Pages will be injected via MCP server.');
          console.log('[Notion] To inject content, use: window.injectHomeBuyingKnowledge(title, content)');
          
          // Note: The actual Notion page fetching should happen via MCP server
          // The local knowledge base serves as fallback
          
        } catch (e) {
          console.warn('[Notion] MCP initialization warning:', e);
          // This is expected - MCP integration happens externally
        }
      })();
    }

    return () => {
      // Cleanup
      if (typeof window !== 'undefined') {
        delete (window as any).injectHomeBuyingKnowledge;
      }
    };
  }, []);

  return {
    // Helper function to manually inject knowledge if needed
    injectKnowledgeManually: (title: string, content: string, url?: string) => {
      const lower = title.toLowerCase();
      const isAccepted = lower.includes('make home buying transparent') ||
        lower.includes('home buying') ||
        lower.includes('buyer') ||
        lower.includes('real estate') ||
        lower.includes('mortgage') ||
        lower.includes('property');
      if (isAccepted) {
        injectKnowledge(title, content, url);
        try {
          (window as any).__homeBuyingKnowledgeDocs = (window as any).__homeBuyingKnowledgeDocs || [];
          (window as any).__homeBuyingKnowledgeDocs.push({
            title,
            length: content?.length ?? 0,
            injectedAt: new Date().toISOString(),
            content,
            url,
          });
        } catch {}
        if ((import.meta as any)?.env?.DEV) {
          console.log('[MCP] Manually injected knowledge:', title, `(length: ${content?.length ?? 0})`, url ? `(url: ${url})` : '');
        }
      }
    }
  };
};
