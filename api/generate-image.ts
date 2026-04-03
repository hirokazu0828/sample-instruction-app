export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt, quality } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        quality: quality || 'medium',
        n: 1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[generate-image] OpenAI error ${response.status}:`, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e: any) {
    console.error('[generate-image] Exception:', e);
    return res.status(500).json({ error: e.message });
  }
}
