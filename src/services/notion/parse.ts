// Minimal parser to extract plain text from a Notion recordMap

type Block = {
  value?: {
    type?: string;
    properties?: Record<string, any>;
    content?: string[];
  };
};

export function recordMapToPlainText(recordMap: any): string {
  if (!recordMap || !recordMap.block) return '';
  const blocks: Record<string, Block> = recordMap.block;

  const lines: string[] = [];

  for (const [, block] of Object.entries(blocks)) {
    const val = (block as Block)?.value;
    if (!val) continue;

    // Title or text-like blocks
    if (val.properties && val.properties.title) {
      const textParts = val.properties.title as any[];
      const text = textParts.map((part) => (Array.isArray(part) ? part[0] : '')).join('');
      if (text.trim().length > 0) lines.push(text);
    }
  }

  return lines.join('\n');
}




