export type CharacterView = 'front' | 'back';

export interface MainCharacter {
  frontImage: string | null; // data URI or URL
  backImage: string | null;  // data URI or URL
  name: string;
}

export type VideoModelId = 'grok-imagine-video-1.5-lite' | 'grok-imagine-video-1.5';

export type StartImageMode =
  | 'character_ref'
  | 'custom_generate'
  | 'prev_scene_last_frame'
  | 'custom_upload';

export type TemplateSourceType = 'none' | 'upload' | 'prev_scene_last_frame';

export type LastFrameMode = 'none' | 'character_ref' | 'custom_upload' | 'custom_generate';

export interface BackgroundMusicConfig {
  enabled: boolean;
  audioUrl: string | null;
  fileName?: string;
  volume: number; // 0.05 to 1.0 (default: 0.25)
  loop: boolean;  // default: true
}

export interface SceneAudioTrack {
  id: string;
  phrase: string;              // Dialogue replica text
  voiceId: string;             // Voice identifier (eve, ara, leo, etc.)
  speed: number;               // Speech rate (0.7 - 1.5, default: 1.0)
  normalizeText: boolean;      // Text normalization (numbers to words)
  audioOffset: number;         // Start offset in seconds within the scene video
  ttsAudioUrl?: string | null; // Generated speech audio file URL
}

export interface SceneAudioConfig {
  useTts: boolean;              // Enable or disable grok-tts
  tracks: SceneAudioTrack[];    // Array of dialogue replicas with independent voices and timings
  // Backward compatibility:
  voiceId?: string;
  speed?: number;
  phrase?: string;
  normalizeText?: boolean;
  audioOffset?: number;
}

export interface SceneVideoConfig {
  model: VideoModelId;          // Video generation model: 1.5-lite or 1.5
  generateVideo: boolean;       // Enable/disable AI video generation
  readyVideoUrl?: string | null;// Pre-rendered / uploaded custom video
  duration: number;             // Scene duration in seconds
  resolution: '480p';           // Fixed 480p resolution
  videoPrompt: string;          // Scene action prompt
  generateAudio: boolean;       // AI video model audio generation
  
  // Start Frame configuration
  startImageMode: StartImageMode;
  customStartImage?: string | null;
  templateSource?: TemplateSourceType; // Template source ('upload', 'prev_scene_last_frame' or 'none')
  usePrevSceneLastFrame?: boolean;     // Use previous scene's last frame as reference
  templateImage?: string | null;       // Template image data URL
  startImageReferences?: string[];     // Custom reference photos (up to 5 items)
  characterView: CharacterView | 'none';  // Character angle: front, back, or none
  imageInstruction?: string;           // Start frame generation prompt instruction

  // Last Frame configuration (for grok-imagine-video-1.5)
  lastFrameMode?: LastFrameMode;
  lastFrameCharacterView?: CharacterView | 'none'; // Character angle for last frame (front, back, or none)
  lastFrameImage?: string | null;
  lastFrameInstruction?: string;
  lastFrameReferences?: string[]; // Extra reference photos for last frame generation

  // Seamless screen transitions (fade from black / fade to black)
  transition?: SceneTransitionConfig;
}

export interface SceneTransitionConfig {
  fadeIn: boolean;          // Smooth fade in from black at the beginning of scene
  fadeInDuration: number;   // Fade in duration in seconds (default: 1.0)
  fadeOut: boolean;         // Smooth fade out to black at the end of scene
  fadeOutDuration: number;  // Fade out duration in seconds (default: 1.0)
}

export type SceneStageStatus =
  | 'idle'
  | 'queued'
  | 'waiting_dependency'
  | 'extracting_frame'
  | 'generating_image'
  | 'generating_last_frame'
  | 'generating_video'
  | 'generating_audio'
  | 'muxing_scene'
  | 'completed'
  | 'error';

export interface SceneState {
  id: string;
  order: number;
  title: string;
  enabled?: boolean; // Whether the scene is included in cartoon generation (default: true)
  video: SceneVideoConfig;
  audio: SceneAudioConfig;
  
  // Runtime generation status
  status: SceneStageStatus;
  statusText?: string;
  error?: string | null;
  
  // Generated intermediate & final artifacts
  generatedStartImageUrl?: string | null;
  extractedLastFrameUrl?: string | null;
  generatedLastFrameUrl?: string | null;
  rawVideoUrl?: string | null;
  ttsAudioUrl?: string | null;
  finalSceneVideoUrl?: string | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  sceneIndex?: number;
  sceneTitle?: string;
  stage:
    | 'START'
    | 'START_IMAGE'
    | 'LAST_FRAME'
    | 'EXTRACT_FRAME'
    | 'VIDEO'
    | 'TTS_AUDIO'
    | 'SCENE_MUX'
    | 'FINAL_CONCAT'
    | 'SYSTEM'
    | 'ERROR';
  stageLabel: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
}

export interface ProjectData {
  version: string;
  title: string;
  character: MainCharacter;
  backgroundMusic?: BackgroundMusicConfig;
  scenes: SceneState[];
  updatedAt: string;
}

export const XAI_VOICES = [
  { id: 'eve', name: 'Eve', gender: 'Female', desc: 'Warm, expressive' },
  { id: 'ara', name: 'Ara', gender: 'Female', desc: 'Soft, fairy-tale' },
  { id: 'leo', name: 'Leo', gender: 'Male', desc: 'Friendly, energetic' },
  { id: 'rex', name: 'Rex', gender: 'Male', desc: 'Confident, bold' },
  { id: 'sal', name: 'Sal', gender: 'Neutral', desc: 'Calm, neutral' },
  { id: 'altair', name: 'Altair', gender: 'Male', desc: 'Deep, announcer' },
  { id: 'aurora', name: 'Aurora', gender: 'Female', desc: 'Gentle, melodic' },
  { id: 'celeste', name: 'Celeste', gender: 'Female', desc: 'Bright, emotional' },
  { id: 'cosmo', name: 'Cosmo', gender: 'Male', desc: 'Playful, young' },
  { id: 'helios', name: 'Helios', gender: 'Male', desc: 'Sunny, vibrant' },
  { id: 'iris', name: 'Iris', gender: 'Female', desc: 'Pleasant, clean' },
  { id: 'luna', name: 'Luna', gender: 'Female', desc: 'Serene, magical' },
  { id: 'orion', name: 'Orion', gender: 'Male', desc: 'Heroic' },
  { id: 'sirius', name: 'Sirius', gender: 'Male', desc: 'Solemn' },
  { id: 'zenith', name: 'Zenith', gender: 'Neutral', desc: 'Crisp, modern' },
] as const;

export const PRICING = {
  // xAI video pricing per second (480p):
  videoPerSecond: {
    'grok-imagine-video-1.5-lite': 0.02, // $0.02 / sec
    'grok-imagine-video-1.5': 0.08,      // $0.08 / sec
  },
  videoInputImage: 0.01,                // $0.01 per video model input image (start frame / last frame)
  imageOutput: 0.04,                    // $0.04 per generated image (grok-imagine-image-2.0, 1K low)
  imageInputRef: 0.01,                  // $0.01 per input reference image (character, scene frame, photo)
  ttsPerChar: 0.000015,                 // $15 per 1,000,000 speech characters
  usdToRub: 97,                         // Average USD to RUB exchange rate for estimation
};

export interface EstimatedCostResult {
  totalUsd: number;
  totalRub: number;
  videoCost: number;
  imageCost: number;
  inputImagesCost: number;
  ttsCost: number;
  totalDurationSeconds: number;
  enabledScenesCount: number;
  totalScenesCount: number;
  generatedImagesCount: number;
  inputImagesCount: number;
  totalCharactersCount: number;
}

/**
 * Calculates estimated generation cost in USD and RUB taking into account:
 * - Only enabled scenes (scene.enabled !== false)
 * - Exact scene duration (seconds) * model per-second rate
 * - Video model input image fees ($0.01 per starting/ending frame)
 * - Grok Imagine Image 2.0 output generations ($0.04 each)
 * - Grok Imagine Image 2.0 input reference images ($0.01 each: character, prev frame, custom photos)
 * - Character count of all speech replicas ($15 / 1M chars)
 */
export function calculateEstimatedCost(
  scenes: SceneState[],
  character?: MainCharacter
): EstimatedCostResult {
  let videoCost = 0;
  let imageCost = 0;
  let inputImagesCost = 0;
  let ttsCost = 0;
  let totalDurationSeconds = 0;
  let generatedImagesCount = 0;
  let inputImagesCount = 0;
  let totalCharactersCount = 0;

  const enabledScenes = scenes.filter((s) => s.enabled !== false);

  for (let idx = 0; idx < enabledScenes.length; idx++) {
    const scene = enabledScenes[idx];
    const duration = Math.max(1, Math.round(Number(scene.video.duration) || 5));
    totalDurationSeconds += duration;

    // 1. Video model generation & video input images
    if (scene.video.generateVideo) {
      const model = scene.video.model || 'grok-imagine-video-1.5-lite';
      const perSecRate = PRICING.videoPerSecond[model] || 0.02;
      videoCost += perSecRate * duration;

      // Video model consumes the start frame as an input image ($0.01)
      inputImagesCount += 1;
      videoCost += PRICING.videoInputImage;
      inputImagesCost += PRICING.videoInputImage;

      // If model 1.5 uses a last frame, it consumes a second input image ($0.01)
      if (
        model === 'grok-imagine-video-1.5' &&
        scene.video.lastFrameMode &&
        scene.video.lastFrameMode !== 'none'
      ) {
        inputImagesCount += 1;
        videoCost += PRICING.videoInputImage;
        inputImagesCost += PRICING.videoInputImage;
      }
    }

    // 2. Start Image generation with grok-imagine-image-2.0
    if (scene.video.generateVideo && scene.video.startImageMode === 'custom_generate') {
      // 1 generated output image ($0.04)
      imageCost += PRICING.imageOutput;
      generatedImagesCount += 1;

      // Count input reference images for image edit ($0.01 each)
      let startImageInputs = 0;
      // a) Character reference image
      if (scene.video.characterView !== 'none') {
        const hasChar =
          scene.video.characterView === 'back'
            ? Boolean(character?.backImage || character?.frontImage)
            : Boolean(character?.frontImage || character?.backImage);
        if (hasChar || !character) {
          startImageInputs += 1;
        }
      }
      // b) Previous scene's last frame
      const usesPrev =
        idx > 0 &&
        Boolean(
          scene.video.usePrevSceneLastFrame ||
            scene.video.templateSource === 'prev_scene_last_frame'
        );
      if (usesPrev) {
        startImageInputs += 1;
      }
      // c) Custom reference images
      const customRefs = [
        ...(scene.video.startImageReferences || []),
        ...(scene.video.templateImage ? [scene.video.templateImage] : []),
      ];
      startImageInputs += customRefs.length;

      // xAI charges $0.01 per input reference image
      const startInputCost = startImageInputs * PRICING.imageInputRef;
      imageCost += startInputCost;
      inputImagesCost += startInputCost;
      inputImagesCount += startImageInputs;
    }

    // 3. Last Frame generation with grok-imagine-image-2.0
    if (
      scene.video.generateVideo &&
      scene.video.model === 'grok-imagine-video-1.5' &&
      scene.video.lastFrameMode === 'custom_generate'
    ) {
      // 1 generated output image ($0.04)
      imageCost += PRICING.imageOutput;
      generatedImagesCount += 1;

      // Count input reference images for last frame ($0.01 each)
      let lastImageInputs = 0;
      // a) Character reference image
      if (scene.video.lastFrameCharacterView !== 'none') {
        const hasChar =
          scene.video.lastFrameCharacterView === 'back'
            ? Boolean(character?.backImage || character?.frontImage)
            : Boolean(character?.frontImage || character?.backImage);
        if (hasChar || !character) {
          lastImageInputs += 1;
        }
      }
      // b) Custom photo references
      const lastRefs = scene.video.lastFrameReferences || [];
      lastImageInputs += lastRefs.length;

      const lastInputCost = lastImageInputs * PRICING.imageInputRef;
      imageCost += lastInputCost;
      inputImagesCost += lastInputCost;
      inputImagesCount += lastImageInputs;
    }

    // 4. TTS Tracks ($0.000015 per char)
    if (scene.audio.useTts && scene.audio.tracks) {
      for (const track of scene.audio.tracks) {
        if (track.phrase && track.phrase.trim()) {
          const chars = track.phrase.trim().length;
          totalCharactersCount += chars;
          ttsCost += chars * PRICING.ttsPerChar;
        }
      }
    }
  }

  const totalUsd = videoCost + imageCost + ttsCost;
  const totalRub = totalUsd * PRICING.usdToRub;

  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    totalRub: Math.round(totalRub),
    videoCost: Math.round(videoCost * 100) / 100,
    imageCost: Math.round(imageCost * 100) / 100,
    inputImagesCost: Math.round(inputImagesCost * 100) / 100,
    ttsCost: Math.round(ttsCost * 1000) / 1000,
    totalDurationSeconds,
    enabledScenesCount: enabledScenes.length,
    totalScenesCount: scenes.length,
    generatedImagesCount,
    inputImagesCount,
    totalCharactersCount,
  };
}
