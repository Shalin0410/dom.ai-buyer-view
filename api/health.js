export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      environment: process.env.NODE_ENV || 'unknown',
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      envVarsCount: Object.keys(process.env).length,
      gmailRelatedVars: Object.keys(process.env).filter(key =>
        key.toLowerCase().includes('gmail') ||
        key.toLowerCase().includes('mail') ||
        key.toLowerCase().includes('password')
      ).map(key => ({ key, hasValue: !!process.env[key] }))
    };

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}