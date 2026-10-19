import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { extractLastFrame } from '@/lib/ffmpeg';
import { safeFetchMedia } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extract-frame-'));

  try {
    const body = await req.json();
    const { videoUrl } = body;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json({ error: 'Параметр videoUrl обязателен' }, { status: 400 });
    }

    const videoPath = path.join(tempDir, 'source.mp4');

    if (videoUrl.startsWith('data:')) {
      const commaIdx = videoUrl.indexOf(',');
      if (commaIdx === -1) throw new Error('Некорректный data URI');
      const base64 = videoUrl.substring(commaIdx + 1);
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length > 150 * 1024 * 1024) {
        throw new Error('Размер видео превышает допустимый лимит (150 MB)');
      }
      await fs.writeFile(videoPath, buffer);
    } else {
      const { buffer } = await safeFetchMedia(videoUrl, {
        maxSizeBytes: 150 * 1024 * 1024,
        acceptHeader: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      });
      await fs.writeFile(videoPath, buffer);
    }

    const framePath = path.join(tempDir, 'last_frame.jpg');
    await extractLastFrame(videoPath, framePath);

    const frameBytes = await fs.readFile(framePath);
    const dataUri = `data:image/jpeg;base64,${frameBytes.toString('base64')}`;

    return NextResponse.json({
      success: true,
      frameUrl: dataUri,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка извлечения последнего кадра';
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
