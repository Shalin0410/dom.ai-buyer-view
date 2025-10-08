import fs from 'fs';
import path from 'path';

// CLI: node server/notion-backup-builder.js pageId=XXXX title="My Title" out=src/knowledge/docs.ts

function parseArgs() {
  const args = process.argv.slice(2);
  const map = {};
  for (const arg of args) {
    const [k, ...rest] = arg.split('=');
    map[k] = rest.join('=');
  }
  return map;
}

async function fetchRecordMap(pageId) {
  const url = `https://notion-api.splitbee.io/v1/page/${encodeURIComponent(pageId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Notion page ${pageId}: ${res.status}`);
  return res.json();
}

function recordMapToPlainText(recordMap) {
  if (!recordMap || !recordMap.block) return '';
  const blocks = recordMap.block || {};
  const lines = [];
  for (const key of Object.keys(blocks)) {
    const val = blocks[key]?.value;
    if (val?.properties?.title) {
      const titleArr = val.properties.title;
      const text = (titleArr || []).map((p) => (Array.isArray(p) ? p[0] : '')).join('');
      if (text && text.trim().length > 0) lines.push(text);
    }
  }
  return lines.join('\n');
}

function sanitizeKnowledgeText(input) {
  if (!input) return '';
  const personal = [/@\S+/, /\bphone\b/i, /\baddress\b/i, /\bssn\b/i, /\bpassport\b/i, /\bcredit\s*card\b/i, /\bapi\s*key\b/i, /\btoken\b/i];
  const internal = [/database/i, /schema/i, /supabase/i, /sql/i, /table\s+\w+/i, /create\s+table/i, /ddl|dml/i, /server|backend|api|endpoint|webhook/i, /env\b|dotenv|secret/i, /auth|oauth|jwt/i, /mcp/i];
  const external = [/follow\s*up\s*boss|\bfub\b/i, /zillow|mls|gmail|zapier|notion|vercel|aws|gcp|azure/i, /http(s)?:\/\//i];
  const lines = input.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const l = line.trim();
    if (!l) return false;
    if (/^```/.test(l) || /^\|.*\|$/.test(l)) return false;
    const tests = [...personal, ...internal, ...external];
    return !tests.some((re) => re.test(l));
  });
  return filtered.join('\n').replace(/\n{3,}/g, '\n\n');
}

function upsertBackup(outFile, title, content, pageId) {
  const abs = path.resolve(outFile);
  const src = fs.readFileSync(abs, 'utf-8');
  // Target the consolidated array in src/knowledge/docs.ts
  const marker = 'export const notionBackups: Doc[] = [';
  const idx = src.indexOf(marker);
  if (idx < 0) throw new Error('Cannot find notionBackups array in output file');

  // Skip if an entry with the same title already exists
  const arrayStart = idx + marker.length;
  const arrayEnd = src.indexOf('];', arrayStart);
  const currentArray = src.slice(arrayStart, arrayEnd);
  const titleAlreadyPresent = currentArray.includes(`title: ${JSON.stringify(title)}`);
  if (titleAlreadyPresent) {
    console.log(`Skipped: an entry with title '${title}' already exists in notionBackups.`);
    return;
  }

  const insertPos = arrayEnd;
  const entry = `\n  { title: ${JSON.stringify(title)}, content: ${JSON.stringify(sanitizeKnowledgeText(content))} },`;

  const updated = src.slice(0, insertPos) + entry + src.slice(insertPos);
  fs.writeFileSync(abs, updated, 'utf-8');
}

async function main() {
  const { pageId, title, out = 'src/knowledge/docs.ts' } = parseArgs();
  if (!pageId || !title) {
    console.error('Usage: node server/notion-backup-builder.js pageId=XXXX title="My Title" [out=path]');
    process.exit(1);
  }

  const recordMap = await fetchRecordMap(pageId);
  const content = recordMapToPlainText(recordMap);
  const sanitized = sanitizeKnowledgeText(content);
  if (!sanitized || sanitized.trim().length === 0) {
    throw new Error('Parsed content is empty');
  }
  upsertBackup(out, title, sanitized, pageId);
  console.log(`Backed up '${title}' (${pageId}) to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


