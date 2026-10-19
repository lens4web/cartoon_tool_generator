import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { muxSceneAudio, concatenateScenes, AudioTrackInput, BackgroundMusicInput } from '@/lib/ffmpeg';
import { safeFetchMedia } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MergeSceneTrack {
  audioUrl: string;
  audioOffset: number;
}

interface MergeSceneItem {
  index: number;
  videoUrl: string; // HTTP URL or data URI
  audioUrl?: string | null; // legacy single audio
  audioOffset?: number; // legacy single offset
  audioTracks?: MergeSceneTrack[]; // multi-track audio lines
  keepVideoAudio?: boolean; // whether to keep original video audio
  transition?: {
    fadeIn?: boolean;
    fadeInDuration?: number;
    fadeOut?: boolean;
    fadeOutDuration?: number;
  };
}

interface BackgroundMusicPayload {
  audioUrl: string;
  volume?: number;
  loop?: boolean;
}

async function writeMediaToFile(input: string, targetPath: string): Promise<string> {
  if (input.startsWith('data:')) {
    const commaIdx = input.indexOf(',');
    if (commaIdx === -1) {
      throw new Error('Некорректный base64 data URI');
    }
    const base64Data = input.substring(commaIdx + 1);
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 200 * 1024 * 1024) {
      throw new Error('Размер медиа файла превышает допустимый лимит (200 MB)');
    }
    await fs.writeFile(targetPath, buffer);
    return targetPath;
  } else if (input.startsWith('https://')) {
    const { buffer } = await safeFetchMedia(input, {
      maxSizeBytes: 200 * 1024 * 1024,
    });
    await fs.writeFile(targetPath, buffer);
    return targetPath;
  } else {
    throw new Error('Неподдерживаемый или небезопасный формат медиа ресурса (разрешены только data URI и https)');
  }
}

export async function POST(req: NextRequest) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cartoon-merge-'));

  try {
    const body = await req.json();
    const scenes: MergeSceneItem[] = body.scenes;
    const backgroundMusic: BackgroundMusicPayload | undefined = body.backgroundMusic;

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: 'Список сцен пуст' }, { status: 400 });
    }

    // Sort scenes by index order
    scenes.sort((a, b) => a.index - b.index);

    const preparedSceneVideoPaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.videoUrl) {
        throw new Error(`У сцены #${scene.index + 1} отсутствует видеофайл`);
      }

      const rawVideoPath = path.join(tempDir, `raw-scene-${i}.mp4`);
      await writeMediaToFile(scene.videoUrl, rawVideoPath);

      // Collect all audio tracks for this scene
      const sceneTracks: AudioTrackInput[] = [];

      if (Array.isArray(scene.audioTracks) && scene.audioTracks.length > 0) {
        for (let t = 0; t < scene.audioTracks.length; t++) {
          const trk = scene.audioTracks[t];
          if (trk.audioUrl) {
            const trkPath = path.join(tempDir, `tts-audio-${i}-${t}.mp3`);
            await writeMediaToFile(trk.audioUrl, trkPath);
            sceneTracks.push({ path: trkPath, offsetSeconds: Number(trk.audioOffset) || 0 });
          }
        }
      } else if (scene.audioUrl) {
        const trkPath = path.join(tempDir, `tts-audio-${i}.mp3`);
        await writeMediaToFile(scene.audioUrl, trkPath);
        sceneTracks.push({ path: trkPath, offsetSeconds: Number(scene.audioOffset) || 0 });
      }

      const muxedScenePath = path.join(tempDir, `muxed-scene-${i}.mp4`);
      await muxSceneAudio(
        rawVideoPath,
        sceneTracks,
        0,
        muxedScenePath,
        scene.transition,
        scene.keepVideoAudio !== false
      );
      preparedSceneVideoPaths.push(muxedScenePath);
    }

    // Prepare optional background music
    let bgmInput: BackgroundMusicInput | undefined = undefined;
    if (backgroundMusic && backgroundMusic.audioUrl) {
      const bgmPath = path.join(tempDir, 'bgm_music.mp3');
      await writeMediaToFile(backgroundMusic.audioUrl, bgmPath);
      bgmInput = {
        path: bgmPath,
        volume: backgroundMusic.volume ?? 0.25,
        loop: backgroundMusic.loop ?? true,
      };
    }

    // Concatenate all scenes and mix background music into final cartoon
    const finalOutputPath = path.join(tempDir, 'final_cartoon.mp4');
    await concatenateScenes(preparedSceneVideoPaths, finalOutputPath, bgmInput);

    const finalVideoBuffer = await fs.readFile(finalOutputPath);

    return new NextResponse(new Uint8Array(finalVideoBuffer), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(finalVideoBuffer.length),
        'Content-Disposition': 'inline; filename="cartoon_final.mp4"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка склеивания сцен мультфильма';
    console.error('Merge error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
