import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, Globe, List, ExternalLink } from 'lucide-react';

interface Source {
  id?: string;
  title: string;
  url: string;
  snippet?: string;
}

interface PerplexityResponseProps {
  content: string;
  sources?: Source[];
  webSearch?: {
    triggered: boolean;
    query?: string;
    sourcesCount?: number;
  };
}

// Function to ensure sources have IDs
const ensureSourceIds = (sources: Source[] = []): Source[] => {
  return sources.map((source, index) => ({
    ...source,
    id: source.id || `source${index + 1}`
  }));
};

// Function to parse content and create structured response
const parseStructuredContent = (content: string, sources: Source[] = []) => {
  // First, try to split by double newlines to get paragraphs
  let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  
  // If no double newlines found, try to split by single newlines with bold headings
  if (paragraphs.length === 1) {
    paragraphs = content.split(/\n(?=\*\*[A-Z][^*]*\*\*:)/).filter(p => p.trim());
  }
  
  // If still no good splits, try to split by bold headings even without newlines
  if (paragraphs.length === 1) {
    paragraphs = content.split(/(?=\*\*[A-Z][^*]*\*\*:)/).filter(p => p.trim());
  }
  
  // Handle bulleted list format (like "## Recent Developments in San Jose Housing Market: - [item1] - [item2]")
  if (paragraphs.length === 1 && content.includes('##')) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for section headers (## Title:)
      if (trimmedLine.match(/^##\s+.+:$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'section',
          heading: trimmedLine.replace(/^##\s+/, '').replace(':', ''),
          content: ''
        };
      }
      // Check for standalone ## headings (without colon)
      else if (trimmedLine.match(/^##\s+.+$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'section',
          heading: trimmedLine.replace(/^##\s+/, ''),
          content: ''
        };
      }
      // Check for bullet points (- [item])
      else if (trimmedLine.startsWith('- [')) {
        if (currentSection) {
          currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
        }
      }
      // Regular content
      else if (trimmedLine) {
        if (currentSection) {
          currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
        } else {
          sections.push({
            type: 'paragraph',
            content: trimmedLine
          });
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  const structuredSections = paragraphs.map(paragraph => {
    const lines = paragraph.trim().split('\n');
    const firstLine = lines[0];
    
    // Check if this is a markdown heading (## Title)
    if (firstLine.match(/^##\s+.+$/)) {
      const heading = firstLine.replace(/^##\s+/, '');
      const content = lines.slice(1).join('\n').trim();
      
      return {
        type: 'section',
        heading,
        content
      };
    }
    
    // Check if this is a bold heading (like "Short-term Cost:", "Recommendation:")
    if (firstLine.match(/^\*\*[A-Z][^*]*\*\*:/)) {
      const heading = firstLine.replace(/^\*\*|\*\*:$/g, '');
      const content = lines.slice(1).join('\n').trim();
      
      return {
        type: 'section',
        heading,
        content
      };
    }
    
    return {
      type: 'paragraph',
      content: paragraph.trim()
    };
  });
  
  return structuredSections;
};

// Function to parse markdown and inline citations
const parseMarkdownWithCitations = (text: string, sources: Source[] = []) => {
  // Extract citation markers ^CITE:sourceId^ and replace with placeholders (legacy support)
  const citationRegex = /\^CITE:([^^]+)\^/g;
  const citationMatches: Array<string> = [];
  let citationIndex = 0;

  let textWithPlaceholders = text.replace(citationRegex, (match, sourceId) => {
    citationMatches.push(sourceId);
    return `__CITATION_${citationIndex++}__`;
  });

  // Handle markdown-style citations like ([source_name](URL)) - legacy support
  const markdownCitationRegex = /\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)/g;
  const markdownCitations: Array<{ text: string; url: string }> = [];

  textWithPlaceholders = textWithPlaceholders.replace(markdownCitationRegex, (match, linkText, linkUrl) => {
    markdownCitations.push({ text: linkText, url: linkUrl });
    return `__MARKDOWN_CITATION_${markdownCitations.length - 1}__`;
  });

  // Handle markdown links in bullet points like - [text](url) or just [text](url)
  const bulletLinkRegex = /(?:-\s*)?\[([^\]]+)\]\(([^)]+)\)/g;
  const bulletLinks: Array<{ text: string; url: string }> = [];

  textWithPlaceholders = textWithPlaceholders.replace(bulletLinkRegex, (match, linkText, linkUrl) => {
    bulletLinks.push({ text: linkText, url: linkUrl });
    return `__BULLET_LINK_${bulletLinks.length - 1}__`;
  });

  // Handle badge-style citations like (source_name) - this is the main format now
  const badgeCitationRegex = /\(\s*([a-zA-Z0-9.-]+)\s*\)/g;
  const badgeCitations: Array<string> = [];

  textWithPlaceholders = textWithPlaceholders.replace(badgeCitationRegex, (match, sourceName) => {
    badgeCitations.push(sourceName);
    return `__BADGE_CITATION_${badgeCitations.length - 1}__`;
  });

  // Split text into parts
  const parts = textWithPlaceholders.split(/(\*\*.*?\*\*|__CITATION_\d+__|__MARKDOWN_CITATION_\d+__|__BADGE_CITATION_\d+__|__BULLET_LINK_\d+__)/g);

  return parts.map((part, index) => {
    // Check if this part is a markdown citation placeholder
    const markdownCitationMatch = part.match(/__MARKDOWN_CITATION_(\d+)__/);
    if (markdownCitationMatch) {
      const citationIdx = parseInt(markdownCitationMatch[1]);
      const citation = markdownCitations[citationIdx];

      if (citation) {
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center cursor-pointer ml-1">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 h-4 min-w-[1rem] rounded-md transition-colors duration-150 border border-gray-200 text-center leading-none font-normal"
                >
                  {citation.text}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{citation.text.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 truncate">{citation.text}</p>
                </div>
                <a 
                  href={citation.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {citation.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }
      return null;
    }

    // Check if this part is a bullet link placeholder
    const bulletLinkMatch = part.match(/__BULLET_LINK_(\d+)__/);
    if (bulletLinkMatch) {
      const linkIdx = parseInt(bulletLinkMatch[1]);
      const link = bulletLinks[linkIdx];

      if (link) {
        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {link.text}
          </a>
        );
      }
      return null;
    }

    // Check if this part is a badge citation placeholder
    const badgeCitationMatch = part.match(/__BADGE_CITATION_(\d+)__/);
    if (badgeCitationMatch) {
      const citationIdx = parseInt(badgeCitationMatch[1]);
      const sourceName = badgeCitations[citationIdx];

      if (sourceName) {
        // Try to find the source in the sources array
        const source = sources.find(s => s.id === sourceName);
        
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center cursor-pointer ml-1">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 h-4 min-w-[1rem] rounded-md transition-colors duration-150 border border-gray-200 text-center leading-none font-normal"
                >
                  {sourceName}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{sourceName.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {source?.title || sourceName}
                  </p>
                </div>
                {source?.snippet && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {source.snippet.length > 120 ? source.snippet.substring(0, 120) + '...' : source.snippet}
                  </p>
                )}
                {source?.url && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {source.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }
      return null;
    }

    // Check if this part is a citation placeholder
    const citationMatch = part.match(/__CITATION_(\d+)__/);
    if (citationMatch) {
      const citationIdx = parseInt(citationMatch[1]);
      const sourceId = citationMatches[citationIdx];

      // Try to find source in sources array, or create a minimal source for legacy citations
      let source = sources.find(s => s.id === sourceId);
      if (!source) {
        // Create a minimal source object for legacy domain citations
        source = {
          id: sourceId,
          title: sourceId + '.com',
          url: `https://${sourceId}.com`,
          snippet: undefined
        };
      }

      if (source) {
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center cursor-pointer ml-1">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 h-4 min-w-[1rem] rounded-md transition-colors duration-150 border border-gray-200 text-center leading-none font-normal"
                >
                  {source.id}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{source.id.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 truncate">{source.title}</p>
                </div>
                {source.snippet && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {source.snippet.length > 120 ? source.snippet.substring(0, 120) + '...' : source.snippet}
                  </p>
                )}
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {source.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }
      return null;
    }
    
    // Check if this part is bold text (wrapped in **)
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <span key={index} className="font-semibold text-gray-900">
          {boldText}
        </span>
      );
    }
    
    // Regular text
    return <span key={index}>{part}</span>;
  });
};

const PerplexityResponse: React.FC<PerplexityResponseProps> = ({ 
  content, 
  sources = [], 
  webSearch 
}) => {
  const [activeTab, setActiveTab] = useState<'answer' | 'sources'>('answer');
  
  const sourcesWithIds = ensureSourceIds(sources);
  const structuredContent = parseStructuredContent(content, sourcesWithIds);
  const hasSources = sourcesWithIds && sourcesWithIds.length > 0;
  const hasWebSearch = webSearch?.triggered;

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto">
        {/* Tab Navigation */}
        {hasSources && (
          <div className="flex items-center gap-6 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('answer')}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'answer'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              Answer
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'sources'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Sources
              {sourcesWithIds.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                  {sourcesWithIds.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'answer' && (
            <div className="space-y-4">

              {/* Structured Content */}
              <div className="space-y-4">
                {structuredContent.map((section, index) => {
                  if (section.type === 'section') {
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-700 min-w-[20px]">•</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-2">
                              {section.heading}:
                            </div>
                            <div className="text-gray-700 leading-relaxed">
                              {section.content.includes('[') && section.content.includes('](') ? (
                                <div className="space-y-2">
                                  {section.content.split('\n').map((line, lineIndex) => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith('- [')) {
                                      return (
                                        <div key={lineIndex} className="flex gap-2">
                                          <span className="text-gray-700 min-w-[20px]">•</span>
                                          <span className="text-gray-700 leading-relaxed">
                                            {parseMarkdownWithCitations(trimmedLine.substring(2), sourcesWithIds)}
                                          </span>
                                        </div>
                                      );
                                    } else if (trimmedLine.startsWith('[')) {
                                      return (
                                        <div key={lineIndex} className="flex gap-2">
                                          <span className="text-gray-700 min-w-[20px]">•</span>
                                          <span className="text-gray-700 leading-relaxed">
                                            {parseMarkdownWithCitations(trimmedLine, sourcesWithIds)}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return trimmedLine ? (
                                      <div key={lineIndex} className="text-gray-700 leading-relaxed">
                                        {parseMarkdownWithCitations(trimmedLine, sourcesWithIds)}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                parseMarkdownWithCitations(section.content, sourcesWithIds)
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="text-gray-700 leading-relaxed">
                        {parseMarkdownWithCitations(section.content, sourcesWithIds)}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {activeTab === 'sources' && hasSources && (
            <div className="space-y-3">
              {sourcesWithIds.map((source, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">
                        {source.id.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                      >
                        {source.title}
                      </a>
                      {source.snippet && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                          {source.snippet}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {source.url}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
};

export default PerplexityResponse;
