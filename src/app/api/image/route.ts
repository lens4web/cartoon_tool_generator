import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
                   req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'xAI API Key не передан' }, { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      characterImage,
      templateImage,
      referenceImages,
      aspectRatio = '9:16',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Требуется текстовая инструкция' }, { status: 400 });
    }

    const images: { type: string; url: string }[] = [];
    if (characterImage) {
      images.push({ type: 'image_url', url: characterImage });
    }
    if (templateImage) {
      images.push({ type: 'image_url', url: templateImage });
    }
    if (Array.isArray(referenceImages)) {
      for (const refImg of referenceImages) {
        if (refImg && typeof refImg === 'string' && images.length < 5) {
          images.push({ type: 'image_url', url: refImg });
        }
      }
    }

    const isEdit = images.length > 0;
    const endpoint = isEdit ? 'https://api.x.ai/v1/images/edits' : 'https://api.x.ai/v1/images/generations';

    const payload: Record<string, unknown> = {
      model: 'grok-imagine-image-2.0',
      prompt,
      aspect_ratio: aspectRatio,
      response_format: 'b64_json',
    };

    if (images.length === 1) {
      payload.image = { url: images[0].url };
    } else if (images.length > 1) {
      payload.images = images.map((img) => ({ url: img.url }));
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Ошибка xAI (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || parsed.message || parsed.detail || errText;
      } catch {
        errMsg = errText;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const item = data.data?.[0];

    if (!item) {
      return NextResponse.json({ error: 'xAI не вернул сгенерированное изображение' }, { status: 502 });
    }

    let resultUrl = '';
    if (item.b64_json) {
      resultUrl = `data:image/jpeg;base64,${item.b64_json}`;
    } else if (item.url) {
      resultUrl = item.url;
    }

    return NextResponse.json({
      success: true,
      url: resultUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Внутренняя ошибка генерации изображения';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
