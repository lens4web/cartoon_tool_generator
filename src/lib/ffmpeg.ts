import { promisify } from 'util';
import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

// Helper to run ffmpeg/ffprobe
async function runBinary(binary: string, args: string[]) {
  try {
    return await execFileAsync(binary, args, { maxBuffer: 10 * 1024 * 1024, timeout: 600000 });
  } catch (err: unknown) {
    const error = err as Error & { stderr?: string; stdout?: string };
    const msg = error.stderr || error.stdout || error.message;
    throw new Error(`${binary} failed: ${msg}`);
  }
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
  videoCodec?: string;
  audioCodec?: string;
}

export async function probeVideo(filePath: string): Promise<VideoMetadata> {
  const { stdout } = await runBinary('ffprobe', [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    filePath,
  ]);

  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
  const audioStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'audio');

  const duration = Number(videoStream?.duration || data.format?.duration || 0);
  const width = Number(videoStream?.width || 480);
  const height = Number(videoStream?.height || 854);

  return {
    duration,
    width,
    height,
    hasAudio: Boolean(audioStream),
    videoCodec: videoStream?.codec_name,
    audioCodec: audioStream?.codec_name,
  };
}

export interface AudioTrackInput {
  path: string;
  offsetSeconds: number;
}

export interface BackgroundMusicInput {
  path: string;
  volume?: number; // 0.05 - 1.0 (default 0.25)
  loop?: boolean;  // default true
}

export interface SceneTransitionInput {
  fadeIn?: boolean;
  fadeInDuration?: number;
  fadeOut?: boolean;
  fadeOutDuration?: number;
}

/**
 * Extracts the very last frame of a video file as a high quality JPEG.
 */
export async function extractLastFrame(videoPath: string, outputPath: string): Promise<string> {
  try {
    // Seek 0.5s before end to ensure a clean decoded keyframe, take 1 frame
    await runBinary('ffmpeg', [
      '-v', 'error', '-y',
      '-sseof', '-0.5',
      '-i', videoPath,
      '-map', '0:v:0',
      '-an',
      '-frames:v', '1',
      '-q:v', '2',
      outputPath,
    ]);
  } catch {
    // Fallback if video is very short (<0.5s)
    await runBinary('ffmpeg', [
      '-v', 'error', '-y',
      '-i', videoPath,
      '-map', '0:v:0',
      '-an',
      '-update', '1',
      '-q:v', '2',
      outputPath,
    ]);
  }
  return outputPath;
}

/**
 * Overlays one or multiple audio tracks onto a scene video at specific time offsets,
 * and applies optional screen fade-in (from black) and/or fade-out (to black) transitions.
 * Mixes all tracks and existing background video audio smoothly.
 */
export async function muxSceneAudio(
  videoPath: string,
  audioTracks: AudioTrackInput[] | string | null,
  offsetSeconds: number = 0,
  outputPath: string,
  transition?: SceneTransitionInput,
  keepVideoAudio: boolean = true
): Promise<string> {
  const meta = await probeVideo(videoPath);
  const duration = meta.duration > 0 ? meta.duration : 6;
  const hasBackgroundAudio = meta.hasAudio && keepVideoAudio;

  // Normalize audioTracks parameter:
  let tracks: AudioTrackInput[] = [];
  if (Array.isArray(audioTracks)) {
    tracks = audioTracks.filter((t) => Boolean(t.path));
  } else if (typeof audioTracks === 'string' && audioTracks) {
    tracks = [{ path: audioTracks, offsetSeconds }];
  }

  // Build video fade filters if requested
  const vFilters: string[] = [];
  if (transition?.fadeIn) {
    const inDur = Math.max(0.1, Number(transition.fadeInDuration) || 1.0);
    vFilters.push(`fade=t=in:st=0:d=${inDur}`);
  }
  if (transition?.fadeOut) {
    const outDur = Math.max(0.1, Number(transition.fadeOutDuration) || 1.0);
    const startOut = Math.max(0, duration - outDur);
    vFilters.push(`fade=t=out:st=${startOut}:d=${outDur}`);
  }
  const hasVideoFilter = vFilters.length > 0;

  // Case 1: No custom audio tracks and no video transitions -> copy directly
  if (tracks.length === 0 && !hasVideoFilter) {
    if (meta.hasAudio && !keepVideoAudio) {
      await runBinary('ffmpeg', [
        '-v', 'error', '-y',
        '-i', videoPath,
        '-c:v', 'copy',
        '-an',
        outputPath,
      ]);
      return outputPath;
    }
    await fs.copyFile(videoPath, outputPath);
    return outputPath;
  }

  // Case 2: No custom audio tracks, but video transition is requested
  if (tracks.length === 0 && hasVideoFilter) {
    const args = [
      '-v', 'error', '-y',
      '-i', videoPath,
      '-vf', vFilters.join(','),
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
    ];
    if (hasBackgroundAudio) {
      args.push('-c:a', 'copy');
    } else {
      args.push('-an');
    }
    args.push('-t', String(duration), '-movflags', '+faststart', outputPath);
    await runBinary('ffmpeg', args);
    return outputPath;
  }

  // Case 3: Custom audio tracks exist (with or without video transition)
  const args: string[] = ['-v', 'error', '-y', '-i', videoPath];
  tracks.forEach((t) => args.push('-i', t.path));

  const filterParts: string[] = [];

  // Video filter branch if transitions active
  if (hasVideoFilter) {
    filterParts.push(`[0:v]${vFilters.join(',')}[vout]`);
  }

  // Audio filter branches: resample all tracks to 48kHz stereo so they mix seamlessly
  const trackLabels: string[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const inputIdx = i + 1;
    const delayMs = Math.max(0, Math.round(tracks[i].offsetSeconds * 1000));
    filterParts.push(
      `[${inputIdx}:a]adelay=${delayMs}|${delayMs},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.0,apad[t${inputIdx}]`
    );
    trackLabels.push(`[t${inputIdx}]`);
  }

  if (hasBackgroundAudio) {
    // Resample original Grok video audio (sound effects, atmosphere)
    filterParts.push(
      `[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.0[bg_audio]`
    );
    const allLabels = ['[bg_audio]', ...trackLabels].join('');
    // Both Grok video audio AND TTS dialogue overlay together without reducing volume (normalize=0)
    filterParts.push(
      `${allLabels}amix=inputs=${tracks.length + 1}:duration=first:dropout_transition=0:normalize=0[aout]`
    );
  } else {
    if (tracks.length === 1) {
      filterParts.push(`[t1]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[aout]`);
    } else {
      const allLabels = trackLabels.join('');
      filterParts.push(
        `${allLabels}amix=inputs=${tracks.length}:duration=first:dropout_transition=0:normalize=0[aout]`
      );
    }
  }

  args.push(
    '-filter_complex', filterParts.join(';'),
    '-map', hasVideoFilter ? '[vout]' : '0:v:0',
    '-map', '[aout]',
    '-c:v', hasVideoFilter ? 'libx264' : 'copy'
  );

  if (hasVideoFilter) {
    args.push('-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p');
  }

  args.push(
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', String(duration),
    '-movflags', '+faststart',
    outputPath
  );

  await runBinary('ffmpeg', args);
  return outputPath;
}

/**
 * Concatenates multiple scene videos in order into a single final video.
 * Normalizes all clips to identical resolution, framerate (24fps), and audio format to prevent glitches.
 * Optionally overlays background music across the entire final cartoon.
 */
export async function concatenateScenes(
  sceneVideoPaths: string[],
  outputPath: string,
  backgroundMusic?: BackgroundMusicInput
): Promise<string> {
  if (!sceneVideoPaths.length) {
    throw new Error('No scene videos to concatenate');
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cartoon-concat-'));

  try {
    const tempMergedVideo = path.join(workDir, 'temp_merged.mp4');

    if (sceneVideoPaths.length === 1) {
      await fs.copyFile(sceneVideoPaths[0], tempMergedVideo);
    } else {
      // Probe the first scene to determine target geometry
      const firstMeta = await probeVideo(sceneVideoPaths[0]);
      const isPortrait = firstMeta.height >= firstMeta.width;
      const targetW = isPortrait ? 480 : 854;
      const targetH = isPortrait ? 854 : 480;

      const normalizedPaths: string[] = [];

      // Normalize each clip to ensure flawless concatenation
      for (let i = 0; i < sceneVideoPaths.length; i++) {
        const src = sceneVideoPaths[i];
        const meta = await probeVideo(src);
        const targetClip = path.join(workDir, `norm-${i}.mp4`);

        const args = ['-v', 'error', '-y', '-i', src];

        // If clip lacks audio, generate silent audio stream
        if (!meta.hasAudio) {
          args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
        }

        args.push(
          '-map', '0:v:0',
          '-map', meta.hasAudio ? '0:a:0' : '1:a:0',
          '-vf', `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24`,
          '-af', 'aresample=async=1:first_pts=0,apad',
          '-t', String(meta.duration > 0 ? meta.duration : 5),
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '22',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '48000',
          '-ac', '2',
          targetClip
        );

        await runBinary('ffmpeg', args);
        normalizedPaths.push(targetClip);
      }

      // Use concat demuxer
      const listFile = path.join(workDir, 'concat_list.txt');
      const listContent = normalizedPaths
        .map((p) => `file '${p.replaceAll("'", "'\\''")}'`)
        .join('\n');
      await fs.writeFile(listFile, listContent, 'utf-8');

      await runBinary('ffmpeg', [
        '-v', 'error', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-movflags', '+faststart',
        tempMergedVideo,
      ]);
    }

    // Now, if background music is specified, mix it onto the full merged cartoon!
    if (backgroundMusic && backgroundMusic.path) {
      const mergedMeta = await probeVideo(tempMergedVideo);
      const totalDuration = mergedMeta.duration > 0 ? mergedMeta.duration : 10;
      const vol = Math.max(0.01, Math.min(1.0, backgroundMusic.volume ?? 0.25));

      const musicArgs = ['-v', 'error', '-y', '-i', tempMergedVideo];

      if (backgroundMusic.loop !== false) {
        musicArgs.push('-stream_loop', '-1');
      }

      musicArgs.push('-i', backgroundMusic.path);

      const filter = `[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=${vol},apad[bgm];[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a0];[a0][bgm]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`;

      musicArgs.push(
        '-filter_complex', filter,
        '-map', '0:v:0',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', String(totalDuration),
        '-movflags', '+faststart',
        outputPath
      );

      await runBinary('ffmpeg', musicArgs);
    } else {
      await fs.copyFile(tempMergedVideo, outputPath);
    }

    return outputPath;
  } finally {
    // Clean up temporary normalization files
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
