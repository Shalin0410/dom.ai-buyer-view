// src/knowledge/docs.ts
// Consolidated knowledge base: buyer docs, injected docs (MCP), and sanitized Notion backups

export type Doc = { title: string; content: string };

// Runtime-injectable knowledge (e.g., Notion MCP)
const injectedDocs: Doc[] = [];

export const addInjectedDoc = (title: string, content: string): void => {
  const lower = title.toLowerCase();
  const isAccepted =
    lower.includes('make home buying transparent') ||
    lower.includes('home buying') ||
    lower.includes('buyer') ||
    lower.includes('real estate') ||
    lower.includes('mortgage') ||
    lower.includes('property') ||
    lower.includes('escrow') ||
    lower.includes('timeline') ||
    lower.includes('closing');

  if (isAccepted) {
    injectedDocs.push({ title, content });
    if ((import.meta as any)?.env?.DEV) {
      console.log('[KB] Injected (runtime) doc:', { title, length: content?.length ?? 0 });
    }
  } else if ((import.meta as any)?.env?.DEV) {
    console.warn('[KB] Rejected injected doc (filtered):', title);
  }
};

// Buyer education content (from former buyer-docs.ts)
export const buyerDocs: Doc[] = [
  {
    title: 'Home Buying Process Guide',
    content: `# Complete Home Buying Process Guide
...
`
  }
];

// Sanitized Notion backups (from former notion-backups.ts; title + content only)
export const notionBackups: Doc[] = [
  { title: 'Make home buying transparent', content: `Pain points for home buyers
- Hidden costs and unclear month-to-month affordability create uncertainty
- Dense seller information (disclosures, TIC agreements) is hard to understand
- Information is fragmented across many places, making decisions harder

Pain points for realtors
- Limited time to review documents in detail
- High effort to educate first-time buyers repeatedly

Hypothesis
- Provide a single source of truth for buyers
- Offer summaries of key information and highlight risks
- Support an end-to-end process with clear steps and education` },
  { title: 'Real Estate Tech Tool Development', content: `Overview
For agents, buyer trust depends on clear expectations and timely guidance. Repetitive education and coordination reduce time for higher-value work. A streamlined, buyer-centric experience can improve consistency and confidence.

Core ideas (sanitized)
- Buyer education content and answers focused on process and terminology
- Property journey view that shows stage, dates, and action items
- Matching experience that aligns buyer preferences with inventory and explains why` },
  { title: 'Escrow Timeline', content: `Example escrow timeline steps
- Open escrow; initiate earnest money deposit
- Appraisal (week 1–2)
- Loan approval (week 1–3)
- Closing disclosure & signing (week 3)
- Final walkthrough (1–3 days before close)
- Day before closing: sign and prepare remaining funds
- Closing day: funding, recording, keys delivered` }
];

export const getAllDocs = (): Doc[] => {
  const combined: Doc[] = [...buyerDocs, ...injectedDocs, ...notionBackups];
  const seen = new Set<string>();
  const deduped: Doc[] = [];
  for (const d of combined) {
    const key = d.title.toLowerCase();
    if (!seen.has(key)) {
      deduped.push(d);
      seen.add(key);
    }
  }
  const overviewTitle = 'Home Buying Process Overview';
  if (!seen.has(overviewTitle.toLowerCase())) {
    deduped.push({ title: overviewTitle, content: buyerInfo });
  }
  return deduped;
};

// Re-export addInjectedDoc, but wrap getAllDocs to include Notion backups as fallback
// (Consolidated getAllDocs is defined above)

// Buyer-focused information about the home buying process
export const buyerInfo = `
Home Buying Process Overview

The home buying journey typically involves several key phases:

1. Financial Preparation
   - Getting pre-approved for a mortgage
   - Determining your budget and down payment
   - Understanding all costs involved in buying

2. Finding Your Home
   - Working with a real estate agent
   - Searching properties that meet your criteria
   - Evaluating neighborhoods and market conditions

3. Making an Offer
   - Researching comparable sales
   - Negotiating price and terms
   - Understanding contingencies and timelines

4. Under Contract Process
   - Home inspection and appraisal
   - Finalizing your loan approval
   - Coordinating with all parties involved

5. Closing Process
   - Final walkthrough of the property
   - Signing all legal documents
   - Getting your keys and becoming a homeowner

Each phase has important milestones and decisions that affect your success as a buyer.
`;
