// src/hooks/useNotionIntegration.ts
import { useEffect } from 'react';
import { injectKnowledge } from '@/services/chatbot';

// Hook to integrate with Notion MCP for "Make home buying transparent" content
export const useNotionIntegration = () => {
  useEffect(() => {
    // This hook can be used to inject Notion content when available
    // For now, it's a placeholder for external MCP integration
    
    // Example usage:
    // window.injectNotionContent = (title: string, content: string) => {
    //   if (title.toLowerCase().includes('make home buying transparent')) {
    //     injectKnowledge(title, content);
    //   }
    // };

    // Expose the injection function globally for MCP integration
    if (typeof window !== 'undefined') {
      (window as any).injectHomeBuyingKnowledge = (title: string, content: string) => {
        // Only inject content related to home buying education
        if (title.toLowerCase().includes('make home buying transparent') ||
            title.toLowerCase().includes('home buying') ||
            title.toLowerCase().includes('buyer') ||
            title.toLowerCase().includes('real estate') ||
            title.toLowerCase().includes('mortgage') ||
            title.toLowerCase().includes('property')) {
          injectKnowledge(title, content);
          console.log(`Injected home buying knowledge: ${title}`);
        }
      };
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
    injectKnowledge: (title: string, content: string) => {
      if (title.toLowerCase().includes('make home buying transparent') ||
          title.toLowerCase().includes('home buying') ||
          title.toLowerCase().includes('buyer') ||
          title.toLowerCase().includes('real estate') ||
          title.toLowerCase().includes('mortgage') ||
          title.toLowerCase().includes('property')) {
        injectKnowledge(title, content);
      }
    }
  };
};
