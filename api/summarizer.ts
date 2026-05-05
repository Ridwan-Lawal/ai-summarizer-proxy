import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Handle CORS Preflight request (Browsers send an OPTIONS request before POST)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Reject anything that isn't a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'No content provided for summarization.' });
  }

  try {
    // 3. Make the secure server-to-server call to Gemini
    // Using process.env.GEMINI_API_KEY ensures the key is hidden from the public
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Summarize the following article in a structured format with a short summary, key bullet points, and an estimated reading time. Do not include markdown formatting like \`\`\`json.\n\nArticle: ${content}` }]
        }]
      })
    });

    const data = await response.json();

    // Handle Gemini API errors (e.g., quota exceeded)
    if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    // 4. Extract the exact text from the Gemini response structure
    const summaryText = data.candidates[0].content.parts[0].text;

    // 5. Send it back to your Chrome Extension
    return res.status(200).json({ summary: summaryText });

  } catch (error: any) {
    console.error('AI Proxy Error:', error.message);
    return res.status(500).json({ error: 'AI processing failed on the server.' });
  }
}