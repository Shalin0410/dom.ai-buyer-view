// Remove lines containing personal info, internal tools/systems, external systems, or schema details

const PERSONAL_PATTERNS = [
  /@\S+/, // emails
  /\bphone\b/i,
  /\baddress\b/i,
  /\bssn\b/i,
  /\bpassport\b/i,
  /\bcredit\s*card\b/i,
  /\bapi\s*key\b/i,
  /\btoken\b/i,
];

const INTERNAL_SYSTEM_PATTERNS = [
  /database/i,
  /schema/i,
  /supabase/i,
  /sql/i,
  /table\s+\w+/i,
  /create\s+table/i,
  /ddl|dml/i,
  /server|backend|api|endpoint|webhook/i,
  /env\b|dotenv|secret/i,
  /auth|oauth|jwt/i,
  /mcp/i,
];

const EXTERNAL_SYSTEM_PATTERNS = [
  /follow\s*up\s*boss|\bfub\b/i,
  /zillow|mls|gmail|zapier|notion|vercel|aws|gcp|azure/i,
  /http(s)?:\/\//i,
];

export function sanitizeKnowledgeText(input: string): string {
  if (!input) return '';
  const lines = input.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const l = line.trim();
    if (!l) return false; // drop empties
    // drop markdown tables/code fences
    if (/^```/.test(l) || /^\|.*\|$/.test(l)) return false;
    const tests = [...PERSONAL_PATTERNS, ...INTERNAL_SYSTEM_PATTERNS, ...EXTERNAL_SYSTEM_PATTERNS];
    return !tests.some((re) => re.test(l));
  });
  // collapse excessive blank lines
  return filtered.join('\n').replace(/\n{3,}/g, '\n\n');
}




