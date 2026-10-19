<div align="center">

# 🎬 Grok Cartoon Studio

**Next-Generation AI Cartoon & Cinematic Animation Studio powered by xAI Grok and FFmpeg**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-v7-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![xAI Grok](https://img.shields.io/badge/xAI_Grok-Imagine_&_TTS-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Security: Audited](https://img.shields.io/badge/Security-SSRF_Hardened-emerald.svg?style=for-the-badge)](src/lib/security.ts)

<br />

[Features](#-key-features) •
[Architecture](#-system-architecture) •
[Security Model](#-security--privacy-architecture) •
[Quick Start](#-quick-start) •
[Docker Deployment](#-docker-deployment) •
[Subpath Hosting](#-subpath-hosting--reverse-proxy) •
[Scenario JSON Spec](#-scenario-json-automation-spec) •
[License](#-license)

</div>

---

## 📖 Overview

**Grok Cartoon Studio** is an open-source, full-stack animation production suite designed to assemble multi-scene cartoons and cinematic clips using **xAI Grok** generative intelligence.

Traditional generative video models struggle with character morphing, sudden camera angle jumps, audio drift, and disconnected narrative flow. Grok Cartoon Studio eliminates these obstacles by combining:
- **`grok-imagine-video-1.5`** & **`grok-imagine-video-1.5-lite`** for video generation with initial and final frame constraints.
- **`grok-imagine-image-2.0`** with multi-reference fusion (front/back character turnarounds, environment props, and prior keyframes).
- **`grok-tts`** for multitrack voice acting and speech synthesis with timeline offsets and text normalization.
- **Server-Side FFmpeg Engine** providing exact frame extraction, resolution/framerate normalization, audio cross-layering, cinematic fades, and master soundtrack mixing.

---

## 🌟 Key Features

### 1. Zero-Jump Scene Continuity (Automated Keyframe Chaining)
- **Automatic Final-Frame Extraction**: When generating consecutive scenes, select **"Previous Scene Last Frame"** as the starter image.
- The pipeline uses FFmpeg to accurately sample the final decoded frame of the preceding video and injects it as the starting condition for the next scene, ensuring seamless narrative and visual continuity without character or background morphing.
- Supports dual-frame constraint rendering (`start_frame` + `last_frame`) using the flagship `grok-imagine-video-1.5` model.

### 2. Multi-Reference Start Frame Fusion (`grok-imagine-image-2.0`)
- Define comprehensive character reference sheets (Front View & Back View).
- Ingest up to 5 supplemental reference images (secondary characters, props, background art, lighting styles).
- Grok Imagine Image 2.0 synthesizes references into an exact 9:16 or 16:9 master keyframe before passing it to the video generation engine.

### 3. Multitrack Dialogue & Voice Acting (`grok-tts`)
- Attach **unlimited speech lines** per scene.
- Independent voice selection from **28 xAI persona voices** (e.g., *Eve*, *Leo*, *Ara*, *Rex*, *Aurora*, *Altair*).
- Fine-grained controls:
  - Custom speech rate (0.7x – 1.5x).
  - Millisecond timeline offset (`audioOffset`) to position lines exactly where dialogue should occur.
  - Automated text normalization for spoken dates, numbers, and currency.
- **Layered Audio Architecture**: Generative ambient video sound effects from the Grok video models and synthesized character voices play concurrently without ducking distortion or muting.

### 4. Cinematic Transitions (Fade In / Fade Out)
- Per-scene transition controls executed via FFmpeg filter graphs:
  - **Fade In from Black**: Configurable duration (0.1s – 3.0s).
  - **Fade Out to Black**: Smooth end-of-scene fade (0.1s – 3.0s).

### 5. Master Background Music Track
- Upload custom background scores (`.mp3`, `.wav`, `.aac`, `.m4a`).
- Real-time volume balancing (0.01 – 1.0) to ensure character dialogue remains articulate.
- Infinite audio loop mode seamlessly wraps the track across the entire film timeline.

### 6. Dynamic Cost & Runtime Calculator
- Embedded live pricing engine right on the primary build button.
- Displays both **USD ($0.00)** and estimated **RUB (₽)** in real-time.
- Factorization includes:
  - Video model runtime tariffs (`$0.02/s` for Lite, `$0.08/s` for Flagship).
  - Input image ingestion costs (`$0.01` per frame).
  - Image generations (`$0.04`) and multi-image references (`$0.01` each).
  - Grok-TTS character counts (`$15.00` per 1M characters).
- Calculates total movie duration down to exact minutes and seconds.

### 7. Per-Scene Generation Toggles
- Temporarily disable or enable individual scenes without deleting configured prompts, audio tracks, or references.
- Disabled scenes are automatically bypassed during the merge sequence and subtracted from cost and duration calculations.

### 8. Scenario JSON Automation for Bots & CI/CD
- **Export Scenario JSON**: One-click export into a standardized `grok_cartoon_scenario_v2` document.
  - Enables Telegram bots, Discord bots, and automated microservices to trigger cartoon jobs programmatically.
- **Import Scenario JSON**: Instantly restore projects, character turnarounds, prompts, and scene settings in any browser.

### 9. Internationalization & Modern Theming
- **Dual Language Support**: Full English (EN) and Russian (RU) interfaces.
- **Locale Auto-Detection**: Detects system language via `navigator.language` on first launch.
- **Adaptive Light/Dark Theme**: Built with Tailwind CSS v4, automatically mirroring the user's OS color scheme with manual override toggle.

---

## 🔒 Security & Privacy Architecture

This codebase is specifically audited and hardened for public open-source deployment:

```
[ User Browser ]
      │
      ├─► Client-side Key Storage (localStorage)
      │   (Never written to server disk or logs)
      │
      ▼
[ Next.js API Gateway ]
      │
      ├─► SSRF Defense Layer (src/lib/security.ts)
      │   ├─ Reject private/loopback/link-local IPs (RFC 1918, RFC 3927, CGNAT)
      │   ├─ Block cloud metadata endpoints (169.254.169.254, AWS/GCP metadata)
      │   ├─ Resolve DNS before fetch (prevents DNS rebinding)
      │   └─ Strict CDN domain whitelisting (*.x.ai)
      │
      ├─► Shell-Free Process Execution (src/lib/ffmpeg.ts)
      │   ├─ child_process.execFile (No shell invocation, immune to command injection)
      │   └─ Strictly typed numeric bounds & sanitized file paths
      │
      ▼
[ Ephemeral Media Sandbox ]
      │
      └─► Isolated temp directories (fs.mkdtemp) with automated cleanup
```

### Key Security Safeguards
1. **Client-Managed API Keys**: Users supply their personal xAI API keys directly from their browser. Keys are sent per-request via the `x-api-key` header and are never stored in databases, environment files, or server configurations.
2. **SSRF & DNS Rebinding Protection**:
   - All server-side fetches validate destination hostnames and resolve DNS records prior to connection.
   - Comprehensive IP blacklists block access to local interfaces (`127.0.0.0/8`, `::1`), private intranets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Carrier-Grade NAT (`100.64.0.0/10`), and cloud provider metadata services (`169.254.169.254`).
   - Downloads from xAI CDNs are strictly restricted to verified subdomains (`vidgen.x.ai`, `files-cdn.x.ai`, `x.ai`).
3. **Command Injection Prevention**:
   - Media operations invoke `ffmpeg` and `ffprobe` binaries via `child_process.execFile` with argument arrays rather than executing shell command strings.
   - Transition parameters and offsets are mathematically constrained via `Math.max` and `Math.min`.
4. **Isolated Workspaces & Safe Housekeeping**:
   - Temporary frames and audio tracks are isolated in ephemeral directories created via `fs.mkdtemp`.
   - Guaranteed cleanup routines in `finally` blocks delete all temporary media buffers after processing or upon unexpected failures.
5. **Modern Security Headers**:
   - Pre-configured headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 🏗️ System Architecture

```
cartoon_tool/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts            # System readiness & FFmpeg verification
│   │   │   ├── image/route.ts             # Grok Imagine Image 2.0 reference synthesis
│   │   │   ├── video/
│   │   │   │   ├── generate/route.ts      # Video dispatch (1.5 Lite / 1.5 Flagship)
│   │   │   │   ├── status/route.ts        # Asynchronous task polling proxy
│   │   │   │   ├── download/route.ts      # SSRF-hardened video streaming
│   │   │   │   └── extract-frame/route.ts # FFmpeg last-frame extraction
│   │   │   ├── tts/route.ts               # Grok-TTS speech synthesis
│   │   │   └── merge/route.ts             # Multitrack audio muxing & video concatenation
│   │   ├── globals.css                    # Tailwind CSS v4 design tokens
│   │   ├── layout.tsx                     # Root layout with ThemeLanguageProvider
│   │   └── page.tsx                       # Main Studio interface
│   ├── components/
│   │   ├── Header.tsx                     # Studio header, theme/lang controls, cost engine
│   │   ├── ApiKeyModal.tsx                # Secure local API key configuration dialog
│   │   ├── CharacterSection.tsx           # Character turnarounds (front & back references)
│   │   ├── BackgroundMusicSection.tsx     # Master music track uploader & volume mixer
│   │   ├── SceneCard.tsx                  # Scene builder (keyframes, transitions, TTS replicas)
│   │   └── ConsolePanel.tsx               # Real-time build feed & final video player
│   ├── context/
│   │   └── ThemeLanguageContext.tsx       # System-aware theme and i18n React Context
│   ├── lib/
│   │   ├── ffmpeg.ts                      # Server-side FFmpeg pipeline & probe utilities
│   │   ├── i18n.ts                        # English & Russian localization dictionaries
│   │   ├── orchestrator.ts                # Client-side parallel pipeline orchestrator
│   │   └── security.ts                    # SSRF defense, IP filtering & safe fetch helper
│   └── types/
│       └── cartoon.ts                     # TypeScript schemas, models & pricing tariffs
├── Dockerfile                             # Multi-stage non-root container with FFmpeg
├── docker-compose.yml                     # Single-command container deployment
├── next.config.ts                         # Subpath routing & HTTP security headers
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.x or higher
- **FFmpeg & FFprobe**: Version 5.x or higher
- **xAI API Key**: Obtainable from [console.x.ai](https://console.x.ai)

### 1. Install FFmpeg

```bash
# macOS (via Homebrew)
brew install ffmpeg

# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg

# Windows (via Chocolatey or Scoop)
choco install ffmpeg
```

### 2. Clone & Install Dependencies

```bash
git clone git@github.com:lens4web/cartoon_tool_generator.git
cd cartoon_tool_generator
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser, enter your xAI API key, and begin composing your cartoon.

### 4. Production Build

```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

The repository includes a production-ready, multi-stage Dockerfile that bundles Alpine Linux, Node.js, and pre-compiled FFmpeg running under a non-root security context (`nextjs`).

### Run via Docker Compose

```bash
docker compose up -d --build
```

Access the studio at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Subpath Hosting & Reverse Proxy

Grok Cartoon Studio supports deployment under subpaths (such as `https://lens4web.com/projects/grok-cartoon-builder/`) via Next.js `basePath`.

### Build with Custom Base Path

```bash
# Build for subpath
NEXT_PUBLIC_BASE_PATH="/projects/grok-cartoon-builder" npm run build

# Or build for root domain
NEXT_PUBLIC_BASE_PATH="" npm run build
```

### Reverse Proxy Configuration

#### Next.js Root Website Rewrite (`lens4web.com/next.config.js`):
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/projects/grok-cartoon-builder/:path*',
        destination: 'http://127.0.0.1:3001/projects/grok-cartoon-builder/:path*',
      },
    ];
  },
};
```

#### Nginx Reverse Proxy Configuration:
```nginx
location /projects/grok-cartoon-builder/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 150M;
}
```

---

## 🤖 Scenario JSON Automation Spec

Grok Cartoon Studio supports exporting and importing full cartoon project configurations. This schema can be generated programmatically by Telegram bots, Discord bots, or autonomous AI agents:

```json
{
  "version": "grok_cartoon_scenario_v2",
  "name": "The Cybernetic Forest",
  "aspectRatio": "9:16",
  "character": {
    "name": "Kael",
    "frontImage": "data:image/jpeg;base64,...",
    "backImage": "data:image/jpeg;base64,..."
  },
  "backgroundMusic": {
    "audioUrl": "data:audio/mpeg;base64,...",
    "volume": 0.25,
    "loop": true
  },
  "scenes": [
    {
      "id": "scene-1",
      "order": 0,
      "title": "Arrival at the Canopy",
      "enabled": true,
      "video": {
        "model": "grok-imagine-video-1.5",
        "prompt": "Cinematic shot of Kael walking towards the neon luminescent tree",
        "duration": 5,
        "startImageMode": "custom_generate",
        "startImagePrompt": "Kael standing at the edge of the futuristic forest, detailed 3D Pixar render style",
        "generateAudio": true
      },
      "transition": {
        "fadeIn": true,
        "fadeInDuration": 1.0,
        "fadeOut": false,
        "fadeOutDuration": 0.5
      },
      "audioTracks": [
        {
          "id": "track-1",
          "text": "We made it. The energy core is just beyond those gates.",
          "voiceId": "eve",
          "speed": 1.0,
          "audioOffset": 0.5,
          "normalizeText": true
        }
      ]
    },
    {
      "id": "scene-2",
      "order": 1,
      "title": "Activating the Core",
      "enabled": true,
      "video": {
        "model": "grok-imagine-video-1.5-lite",
        "prompt": "Kael touches the glowing crystal, sending waves of blue light through the branches",
        "duration": 5,
        "startImageMode": "prev_scene_last_frame",
        "generateAudio": true
      },
      "transition": {
        "fadeIn": false,
        "fadeInDuration": 0.5,
        "fadeOut": true,
        "fadeOutDuration": 1.2
      },
      "audioTracks": [
        {
          "id": "track-2",
          "text": "System restored! The whole forest is coming alive!",
          "voiceId": "leo",
          "speed": 1.05,
          "audioOffset": 0.8,
          "normalizeText": true
        }
      ]
    }
  ]
}
```

---

## 🤝 Contributing

Contributions and feature suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'feat: Add NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
