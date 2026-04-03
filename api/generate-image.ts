export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt, quality, imageBase64 } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    let response: Response;

    if (imageBase64) {
      // Image Edit API (gpt-image-1)
      // プレフィックス除去（フロントで除去済みでも二重除去は無害）
      const b64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const binary = Buffer.from(b64Clean, 'base64');

      // Node 18+ のネイティブ FormData / Blob を使用
      const form = new FormData();
      form.append('model', 'gpt-image-1');
      form.append('prompt', prompt);
      form.append('size', '1024x1024');
      form.append('n', '1');
      if (quality) form.append('quality', quality);

      const blob = new Blob([binary], { type: 'image/png' });
      form.append('image', blob, 'image.png');

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form as any,
      });
    } else {
      // Image Generation API
      response = await fetch('https://api.openai.com/v1/images/generations', {
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
    }

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
