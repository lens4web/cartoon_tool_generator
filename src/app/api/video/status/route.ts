import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
                   req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'xAI API Key не передан' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Параметр requestId обязателен' }, { status: 400 });
    }

    const response = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Ошибка опроса статуса (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || parsed.message || parsed.detail || errText;
      } catch {
        errMsg = errText;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const status = data.status; // 'pending' | 'done' | 'failed' | 'expired'
    const videoUrl = data.video?.url;

    return NextResponse.json({
      status,
      videoUrl: videoUrl || null,
      error: data.error || null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Внутренняя ошибка опроса статуса видео';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
