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
      text,
      voiceId = 'eve',
      speed = 1.0,
      normalizeText = true,
    } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Текст для озвучки обязателен' }, { status: 400 });
    }

    // Default params per requirement:
    // MP3, 24 kHz, 128 kbps, Speech language Russian, Normalize text = true (or passed boolean)
    const payload = {
      text: text.trim(),
      voice_id: voiceId,
      language: 'ru',
      output_format: {
        codec: 'mp3',
        sample_rate: 24000,
        bit_rate: 128000,
      },
      speed: Number(speed) || 1.0,
      text_normalization: Boolean(normalizeText),
    };

    const response = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Ошибка генерации речи (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || parsed.message || parsed.detail || errText;
      } catch {
        errMsg = errText;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'xAI вернул пустой аудиофайл' }, { status: 502 });
    }

    const base64Audio = buffer.toString('base64');
    const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUri,
      mimeType: contentType.split(';')[0] || 'audio/mpeg',
      bytes: buffer.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Внутренняя ошибка генерации аудио TTS';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
