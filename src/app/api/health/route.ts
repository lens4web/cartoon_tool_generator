import { NextResponse } from 'next/server';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export async function GET() {
  let ffmpegInstalled = false;
  let ffmpegVersion = '';

  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version']);
    ffmpegInstalled = true;
    ffmpegVersion = stdout.split('\n')[0] || '';
  } catch {
    ffmpegInstalled = false;
  }

  return NextResponse.json({
    status: 'ok',
    ffmpeg: {
      available: ffmpegInstalled,
      version: ffmpegVersion,
    },
  });
}
