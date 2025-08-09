// src/knowledge/docs.ts
// Buyer-focused home buying knowledge base
import { buyerDocs, addInjectedDoc as addBuyerDoc, getAllDocs as getAllBuyerDocs } from './buyer-docs';

export type Doc = { title: string; content: string };

// Use buyer-focused documentation
export const localDocs: Doc[] = buyerDocs;

// Re-export functions from buyer-docs
export const addInjectedDoc = addBuyerDoc;
export const getAllDocs = getAllBuyerDocs;

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
