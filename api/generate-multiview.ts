export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { imageBase64 } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN not set' });
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });
  
  try {
    // Replicateにリクエスト送信
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'c69c6559a29011b576f1ff0371b3bc1add2856480c60520c7e9ce0b40a6e9052',
        input: {
          image: `data:image/png;base64,${imageBase64}`,
          scale: 4,
          num_inference_steps: 75,
        }
      }),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Replicate API Error: ${errorText}`);
    }

    const prediction = await response.json();
    
    // ポーリングで完了を待つ
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!poll.ok) throw new Error('Failed to parse replicate polling request');
      result = await poll.json();
    }
    
    if (result.status === 'failed') {
        throw new Error(`Replicate Processing failed: ${result.error}`);
    }

    return res.json({ imageUrl: result.output });
  } catch(e: any) {
    console.error("Multiview error:", e);
    return res.status(500).json({ error: e.message || 'Error occurred generating multiview' });
  }
}
