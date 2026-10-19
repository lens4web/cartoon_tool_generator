import { NextRequest, NextResponse } from 'next/server';
import { safeFetchMedia } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'Параметр url обязателен' }, { status: 400 });
    }

    const { buffer, contentType } = await safeFetchMedia(videoUrl, {
      allowedHosts: ['x.ai', 'vidgen.x.ai', 'files-cdn.x.ai'],
      acceptHeader: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      maxSizeBytes: 150 * 1024 * 1024, // 150 MB max per clip
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType.startsWith('video/') ? contentType : 'video/mp4',
        'Content-Disposition': 'inline; filename="scene.mp4"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка проксирования видео';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
