// Approved Notion pages to load at runtime (latest copy) when accessible.
// Populate this list after confirming with the user.

export type AllowlistedNotionPage = {
  title: string;
  pageId: string; // Notion page ID or URL slug compatible with splitbee API
};

export const allowlistedNotionPages: AllowlistedNotionPage[] = [
  { title: 'Make home buying transparent', pageId: '15ff821f9675800faa69f8d774ab773f' },
  { title: 'Real Estate Tech Tool Development', pageId: '1f0f821f967580edba86c8c6fba56aa2' },
  { title: 'Escrow Timeline', pageId: '230f821f967580d9bb00f9f460e9334e' },
  { title: 'Agent View Epic 1', pageId: '237f821f967580d2ae47f0344be903fd' },
  { title: 'Property data flow', pageId: '247f821f9675803ea2f7f7f7bf3529e826' },
  { title: 'One Stop Dashboard – Priority 1', pageId: '1f8f821f967580f89978deee5a1dc0cb' },
  { title: 'User Stories', pageId: '226f821f9675801cb9f0c7adf1544ccc' },
  { title: 'Buyer Chatbot - Priority 1', pageId: '226f821f967580ea8281def931fb5610' },
  { title: 'FUB Integration', pageId: '211f821f9675804d896ad5593f6bf911' },
  { title: 'Home Matching Engine - Priority 2', pageId: '209f821f967580748511d22523312956' },
  { title: 'FUB Stage Mapping Analysis', pageId: '23af821f96758106b0b1e58702875f9f' },
];