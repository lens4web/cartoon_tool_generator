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
      model = 'grok-imagine-video-1.5-lite',
      prompt,
      startImageUrl,
      lastFrameUrl,
      duration = 5,
      generateAudio = true,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Промпт для видео обязателен' }, { status: 400 });
    }

    if (!startImageUrl) {
      return NextResponse.json({ error: 'Стартовое изображение обязательно для видео' }, { status: 400 });
    }

    const chosenModel = model === 'grok-imagine-video-1.5' ? 'grok-imagine-video-1.5' : 'grok-imagine-video-1.5-lite';

    const payload: Record<string, unknown> = {
      model: chosenModel,
      prompt: prompt.trim(),
      image: { url: startImageUrl },
      duration: Math.max(1, Math.min(15, Math.round(Number(duration)))),
      resolution: '480p',
      generate_audio: Boolean(generateAudio),
    };

    // If using grok-imagine-video-1.5 and a last frame is specified, pass last_frame
    if (chosenModel === 'grok-imagine-video-1.5' && lastFrameUrl) {
      payload.last_frame = { url: lastFrameUrl };
    }

    const response = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Ошибка запуска видео (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || parsed.message || parsed.detail || errText;
      } catch {
        errMsg = errText;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const requestId = data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: 'xAI не вернул request_id задачи видео' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      requestId,
      status: 'pending',
      model: chosenModel,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Внутренняя ошибка запуска генерации видео';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
