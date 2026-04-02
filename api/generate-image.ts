export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt, quality } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  try {
    let response;
    
    if (req.body.imageBase64) {
      // 編集生成（Edits API）
      // 不要なプレフィックスがある場合は除去する安全策
      const b64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const binary = Buffer.from(b64Data, 'base64');
      const { FormData } = await import('undici');
      const { Blob } = await import('buffer');
      const form = new FormData();
      form.append('model', 'gpt-image-1');
      form.append('prompt', prompt);
      form.append('size', '1024x1024');
      if (quality) form.append('quality', quality);
      form.append('n', '1');
      const blob = new Blob([binary], { type: 'image/png' });
      form.append('image', blob, 'cover.png');
      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form as any,
      });
    } else {
      // 通常生成（Generations API）
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

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
