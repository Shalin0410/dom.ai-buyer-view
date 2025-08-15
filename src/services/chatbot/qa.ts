// src/services/chatbot/qa.ts
import { getAllDocs, Doc, buyerInfo, addInjectedDoc } from '@/knowledge/docs';

type QAResult = { answer: string; sources: string[] };

// Lightweight retrieval-based QA system for project-scoped responses
// No external LLM; strictly answers from loaded docs and schema info
export async function answerQuestion(query: string): Promise<QAResult> {
  const normalizedQuery = normalize(query);
  const docs = getAllDocs();
  
  // Add buyer info as a virtual document
  const allDocs = [
    ...docs,
    { title: 'Home Buying Process Overview', content: buyerInfo }
  ];

  // Score documents based on keyword overlap
  const scoredDocs = allDocs
    .map((doc) => ({ doc, score: scoreDoc(doc, normalizedQuery) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // If no relevant docs found, return scope-guarded response
  if (scoredDocs.length === 0 || scoredDocs[0].score < 0.15) {
    return {
      answer: "I can help you with questions about the home buying process, including financial preparation, finding properties, making offers, the escrow process, working with real estate professionals, and understanding timelines. Please ask about specific aspects of buying a home that you'd like to learn more about.",
      sources: [],
    };
  }

  // Extract relevant snippets from top-scoring documents
  const snippets = scoredDocs
    .map(({ doc }) => extractRelevantSnippet(doc, normalizedQuery))
    .filter(Boolean) as string[];

  if (snippets.length === 0) {
    return {
      answer: "I found some relevant information but couldn't extract specific details. Please try rephrasing your question or ask about specific topics like mortgage pre-approval, home inspections, making offers, or working with real estate agents.",
      sources: scoredDocs.map(({ doc }) => doc.title),
    };
  }

  // Synthesize answer from snippets
  const answer = synthesizeAnswer(normalizedQuery, snippets);
  
  return {
    answer,
    sources: scoredDocs.map(({ doc }) => doc.title),
  };
}

// Retrieve top context snippets (title + snippet text) for server synthesis
export async function retrieveContext(
  query: string,
  options?: { maxDocs?: number }
): Promise<Array<{ title: string; snippet: string }>> {
  const normalizedQuery = normalize(query);
  const docs = getAllDocs();
  const allDocs: Doc[] = [
    ...docs,
    { title: 'Home Buying Process Overview', content: buyerInfo },
  ];

  const maxDocs = options?.maxDocs ?? 3;

  const scoredDocs = allDocs
    .map((doc) => ({ doc, score: scoreDoc(doc, normalizedQuery) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs);

  const results: Array<{ title: string; snippet: string }> = [];
  for (const { doc } of scoredDocs) {
    const snippet = extractRelevantSnippet(doc, normalizedQuery);
    if (snippet) {
      results.push({ title: doc.title, snippet });
    }
  }

  return results;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const tokens = normalize(text).split(' ').filter((t) => t.length > 2);
  return Array.from(new Set(tokens)); // Remove duplicates
}

function scoreDoc(doc: Doc, query: string): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(doc.content);
  
  if (docTokens.length === 0 || queryTokens.length === 0) return 0;
  
  // Calculate keyword overlap
  const overlap = queryTokens.filter((token) => docTokens.includes(token)).length;
  
  // Boost score for title matches
  const titleTokens = tokenize(doc.title);
  const titleOverlap = queryTokens.filter((token) => titleTokens.includes(token)).length;
  
  // Normalize by document length and add title boost
  const baseScore = overlap / Math.sqrt(docTokens.length);
  const titleBoost = titleOverlap * 0.3;
  
  return baseScore + titleBoost;
}

function extractRelevantSnippet(doc: Doc, query: string): string | null {
  const lines = doc.content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const queryTokens = tokenize(query);
  
  let bestLineIndex = -1;
  let bestScore = 0;

  // Find the line with the highest keyword overlap
  for (let i = 0; i < lines.length; i++) {
    const line = normalize(lines[i]);
    const hitCount = queryTokens.reduce((acc, token) => {
      return acc + (line.includes(token) ? 1 : 0);
    }, 0);
    
    if (hitCount > bestScore) {
      bestScore = hitCount;
      bestLineIndex = i;
    }
  }

  if (bestLineIndex < 0 || bestScore === 0) return null;

  // Extract context around the best matching line
  const contextSize = 3;
  const start = Math.max(0, bestLineIndex - contextSize);
  const end = Math.min(lines.length, bestLineIndex + contextSize + 1);
  
  return lines.slice(start, end).join('\n').trim();
}

function synthesizeAnswer(query: string, snippets: string[]): string {
  // Simple synthesis: combine snippets with basic filtering
  const combined = snippets.join('\n\n');
  const sentences = combined
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 500)
    .slice(0, 8); // Limit to 8 sentences max

  const queryTokens = tokenize(query);
  
  // Prioritize sentences that contain query keywords
  const scored = sentences.map(sentence => ({
    sentence,
    score: queryTokens.reduce((acc, token) => {
      return acc + (normalize(sentence).includes(token) ? 1 : 0);
    }, 0)
  }));
  
  // Sort by relevance and take top sentences
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.sentence);

  let answer = topSentences.join('. ');
  
  // Ensure answer doesn't exceed reasonable length
  if (answer.length > 1000) {
    answer = answer.substring(0, 1000) + '...';
  }

  return answer.length > 50 ? answer : 'Found relevant information in the documentation, but the details are brief. Please ask for more specific information.';
}

// Function to inject external knowledge (e.g., from Notion MCP)
export function injectKnowledge(title: string, content: string): void {
  addInjectedDoc(title, content);
}
