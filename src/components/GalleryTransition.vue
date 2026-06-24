<template>
  <div id="gallery-scene" :class="{ 'gallery--visible': visible }">
    <div
      id="gallery-track"
      :style="{
        transform: `translateX(${-currentOffsetX}px)`,
        width: trackWidth + 'px',
      }"
    >
      <div
        v-for="(cfg, i) in imageConfigs"
        :key="i"
        :ref="(el: unknown) => setImageRef(el, i)"
        class="photo-card"
        :style="getPhotoStyle(i, cfg)"
      >
        <div class="photo-polaroid">
          <div class="photo-frame" :style="{ background: cfg.fallbackColor }">
            <img
              :src="cfg.src"
              :alt="'Imagen ' + (i + 1)"
              class="photo-img"
              @error="onImgError($event, i)"
            />
            <div class="photo-fallback" :class="{ 'photo-fallback--hidden': !imgErrors[i] }">
              <span class="photo-emoji">&#128248;</span>
              <span class="photo-label">Imagen {{ i + 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <img
        v-for="(s, i) in miniStickers"
        :key="s.id"
        :ref="(el: unknown) => setStickerRef(el, i)"
        :src="s.src"
        class="mini-sticker"
        :style="getStickerStyle(i)"
        alt=""
        draggable="false"
        @error="s.hidden = true"
        :class="{ 'mini-sticker--hidden': s.hidden }"
      />
    </div>

    <div
      v-for="(dot, i) in trailPositions"
      :key="i"
      class="trail-dot"
      :style="getTrailStyle(dot, i)"
    ></div>

    <div id="light-sweep" :style="{ left: sweepX + 'px', top: sweepY + 'px' }">
      <div class="sweep-halo"></div>
      <div class="sweep-core"></div>
      <div class="sweep-point"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onBeforeUnmount } from 'vue'

interface ImageConfig {
  widthMult: number
  heightMult: number
  yOffset: number
  rotation: number
  src: string
  fallbackColor: string
}

interface TrailDot {
  x: number
  y: number
}

interface MiniSticker {
  id: number
  src: string
  atIndex: number   // photo index to align near
  side: 'above' | 'below'
  offset: number     // fractional offset within gap (0-1)
  widthPx: number
  rotation: number
  hidden: boolean
}

const base = import.meta.env.BASE_URL

const props = defineProps<{ visible: boolean }>()

const INFLUENCE_RADIUS = 300
const IMG_WIDTH_BASE = 260
const GAP = 120
const TRACK_PADDING = 300
const AMPLITUDE = 130
const FREQUENCY = 1.0
const CENTELLA_SPEED = 1   // px/ms – qué tan rápido viaja la centella
const CAMERA_SPEED = 1     // px/ms – qué tan rápido se desplaza la cámara
const SWEEP_DURATION = 1500  // ms – duración fija de cada barrido
const TRAIL_LENGTH = 10

const n = 6
const trackWidth = TRACK_PADDING * 2 + n * IMG_WIDTH_BASE + (n - 1) * GAP
const SWEEP_DISTANCE = trackWidth + 300

const imageConfigs: ImageConfig[] = [
  { widthMult: 1.0,  heightMult: 0.7,  yOffset:   0, rotation: -3, src: `${base}img/img_1.jpeg`, fallbackColor: '#c4a882' },
  { widthMult: 0.85, heightMult: 1.0,  yOffset:  60, rotation:  5, src: `${base}img/img_2.jpeg`, fallbackColor: '#d4b896' },
  { widthMult: 1.1,  heightMult: 0.9,  yOffset: -30, rotation: -2, src: `${base}img/img_3.jpeg`, fallbackColor: '#b89870' },
  { widthMult: 0.9,  heightMult: 1.2,  yOffset:  40, rotation:  6, src: `${base}img/img_4.jpeg`, fallbackColor: '#e0c8a0' },
  { widthMult: 1.05, heightMult: 1.0,  yOffset: -20, rotation: -4, src: `${base}img/img_5.jpeg`, fallbackColor: '#c8b088' },
  { widthMult: 0.95, heightMult: 1.15, yOffset:  30, rotation:  3, src: `${base}img/img_6.jpeg`, fallbackColor: '#d0b890' },
]

const miniStickers = reactive<MiniSticker[]>([
  { id: 0, src: `${base}stickers/download (2).jpeg`,                           atIndex: 0, side: 'below', offset: 0.3,  widthPx: 160, rotation: -10, hidden: false },
  { id: 1, src: `${base}stickers/download (3).jpeg`,                           atIndex: 1, side: 'above', offset: 0.7,  widthPx: 140, rotation:  15, hidden: false },
  { id: 2, src: `${base}stickers/Love You Like No Otter (19 Images).jpeg`,     atIndex: 3, side: 'below', offset: 1.2,  widthPx: 180, rotation:  -6, hidden: false },
  { id: 3, src: `${base}stickers/??.jpeg`,                                     atIndex: 4, side: 'above', offset: 0.6,  widthPx: 150, rotation:  20, hidden: false },
  { id: 4, src: `${base}stickers/Adobe Express - file (2).png`,                atIndex: 2, side: 'above', offset: 0.7,  widthPx: 130, rotation:  -8, hidden: false },
  { id: 5, src: `${base}stickers/Untitled - June 24, 2026 at 02.48.04.png`,   atIndex: 5, side: 'below', offset: 1,  widthPx: 170, rotation:   6, hidden: false },
  { id: 6, src: `${base}stickers/Untitled - June 24, 2026 at 02.53.12.png`,   atIndex: 2, side: 'below', offset: 0.5,  widthPx: 160, rotation:  10, hidden: false },
])

const imageRefs = ref<(HTMLElement | undefined)[]>([])
const stickerRefs = ref<(HTMLElement | undefined)[]>([])
const imgErrors = ref<boolean[]>(Array(6).fill(false))
const sweepX = ref(-160)
const sweepY = ref(0)
const currentOffsetX = ref(0)
const trailPositions = ref<TrailDot[]>([])
const rafId = ref(0)

let timeouts: ReturnType<typeof setTimeout>[] = []
let isCancelled = false

function onImgError(_e: Event, index: number) {
  imgErrors.value[index] = true
}

function setImageRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) {
    imageRefs.value[index] = el
  }
}

function setStickerRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) {
    stickerRefs.value[index] = el
  }
}

function getPhotoStyle(index: number, cfg: ImageConfig) {
  const w = IMG_WIDTH_BASE * cfg.widthMult
  const h = w * 1.35 * cfg.heightMult
  const x = TRACK_PADDING + index * (IMG_WIDTH_BASE + GAP)
  return {
    left: x + 'px',
    width: w + 'px',
    height: h + 'px',
    top: `calc(50% - ${h / 2}px + ${cfg.yOffset}px)`,
    '--rot': cfg.rotation + 'deg',
  } as Record<string, string>
}

function getStickerStyle(index: number): Record<string, string> {
  const s = miniStickers[index]
  if (!s) return {}
  const photoW = IMG_WIDTH_BASE
  const gap = GAP
  const x = TRACK_PADDING + s.atIndex * (photoW + gap) + s.offset * (photoW + gap)
  const h = s.widthPx * 1.35
  const yOffset = s.side === 'above' ? -h * 0.7 : h * 0.5
  return {
    position: 'absolute',
    left: x + 'px',
    width: s.widthPx + 'px',
    height: 'auto',
    top: `calc(50% + ${yOffset}px)`,
    transform: `rotate(${s.rotation}deg)`,
    opacity: '0.25',
    zIndex: '0',
  } as Record<string, string>
}

function getTrailStyle(dot: TrailDot, index: number) {
  const t = 1 - index / TRAIL_LENGTH
  const size = (t * 0.7 + 0.1) * 8
  return {
    left: dot.x + 'px',
    top: dot.y + 'px',
    width: size + 'px',
    height: size + 'px',
    opacity: t * 0.35,
    transform: 'translate(-50%, -50%)',
  }
}

function applySweepEffect() {
  const sx = sweepX.value
  const sy = sweepY.value
  const nImages = imageRefs.value.length

  for (let i = 0; i < nImages + stickerRefs.value.length; i++) {
    const el = i < nImages ? imageRefs.value[i] : stickerRefs.value[i - nImages]
    if (!el) continue
    const isSticker = i >= nImages
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = sx - cx
    const dy = sy - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < INFLUENCE_RADIUS) {
      const t = 1 - dist / INFLUENCE_RADIUS
      const ease = t * t * (3 - 2 * t)
      el.style.transition = 'none'
      if (isSticker) {
        el.style.filter = `brightness(${0.7 + 0.5 * ease}) saturate(${0.8 + 0.6 * ease})`
        el.style.boxShadow = `0 0 ${ease * 30}px ${ease * 10}px rgba(255, 210, 100, ${ease * 0.5})`
      } else {
        el.style.filter = `brightness(${0.25 + 1.1 * ease}) saturate(${0.3 + 1.4 * ease})`
        el.style.boxShadow = `0 0 ${ease * 40}px ${ease * 15}px rgba(255, 210, 100, ${ease * 0.35})`
      }
    } else {
      el.style.transition = 'filter 0.4s ease, box-shadow 0.4s ease'
      if (isSticker) {
        el.style.filter = `brightness(0.7) saturate(0.8)`
        el.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.4)'
      } else {
        el.style.filter = ''
        el.style.boxShadow = ''
      }
    }
  }
}

function resetScene() {
  const nImages = imageRefs.value.length
  for (let i = 0; i < nImages + stickerRefs.value.length; i++) {
    const el = i < nImages ? imageRefs.value[i] : stickerRefs.value[i - nImages]
    if (!el) continue
    el.style.transition = ''
    el.style.filter = i < nImages ? '' : 'brightness(0.7) saturate(0.8)'
    el.style.boxShadow = i < nImages ? '' : '0 2px 12px rgba(0, 0, 0, 0.4)'
  }
  currentOffsetX.value = 0
  trailPositions.value = []
}

function runSweep(duration: number, onDone: () => void) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let startTime: number | null = null
  let prevTime: number | null = null

  function animate(ts: number) {
    if (isCancelled) return
    if (!startTime) startTime = ts
    if (!prevTime) prevTime = ts
    const dt = ts - prevTime
    prevTime = ts
    const elapsed = ts - startTime
    const progress = Math.min(elapsed / duration, 1)

    const sx = Math.min(-150 + elapsed * CENTELLA_SPEED, SWEEP_DISTANCE - 150)
    const sy = vh / 2 + Math.sin(progress * Math.PI * 2 * FREQUENCY) * AMPLITUDE

    sweepX.value = sx
    sweepY.value = sy

    const target = sx - vw / 2
    const diff = target - currentOffsetX.value
    const step = CAMERA_SPEED * dt
    if (Math.abs(diff) <= step) {
      currentOffsetX.value = target
    } else {
      currentOffsetX.value += Math.sign(diff) * step
    }
    currentOffsetX.value = Math.max(0, Math.min(currentOffsetX.value, trackWidth - vw))

    trailPositions.value.push({ x: sx, y: sy })
    if (trailPositions.value.length > TRAIL_LENGTH) {
      trailPositions.value = trailPositions.value.slice(-TRAIL_LENGTH)
    }

    applySweepEffect()

    if (progress < 1) {
      rafId.value = requestAnimationFrame(animate)
    } else {
      onDone()
    }
  }

  rafId.value = requestAnimationFrame(animate)
}

function startSequence() {
  resetScene()
  isCancelled = false
  const vh = window.innerHeight
  sweepX.value = -160
  sweepY.value = vh / 2

  const t1 = setTimeout(() => {
    if (isCancelled) return

    runSweep(SWEEP_DURATION, () => {
      if (isCancelled) return

      sweepX.value = trackWidth + 160

      const t3 = setTimeout(() => {
        /* done — parent handles the rest */
      }, 600)
      timeouts.push(t3)
    })
  }, 400)
  timeouts.push(t1)
}

function cancelAll() {
  isCancelled = true
  cancelAnimationFrame(rafId.value)
  for (const t of timeouts) clearTimeout(t)
  timeouts = []
}

watch(() => props.visible, (val) => {
  if (val) startSequence()
  else cancelAll()
})

onBeforeUnmount(() => cancelAll())
</script>

<style scoped>
#gallery-scene {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #081a0f;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  overflow: hidden;
}

#gallery-scene.gallery--visible {
  opacity: 1;
  pointer-events: auto;
}

#gallery-track {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  will-change: transform;
}

.photo-card {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transform: scale(1) rotate(var(--rot, 0deg));
  filter: brightness(0.25) saturate(0.3);
  transition: opacity 0.3s ease, filter 0.4s ease, box-shadow 0.4s ease;
}

#gallery-scene.gallery--visible .photo-card {
  opacity: 1;
}

.photo-polaroid {
  width: 100%;
  height: 100%;
  padding: 12px 12px 40px 12px;
  background: #f5f0e8;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.photo-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 1px;
  overflow: hidden;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 1px;
}

.photo-fallback--hidden {
  display: none;
}

.photo-emoji {
  font-size: 32px;
  margin-bottom: 6px;
}

.photo-label {
  font-family: 'Caveat', cursive;
  font-size: 16px;
  color: #5a4a3a;
}

.trail-dot {
  position: fixed;
  border-radius: 50%;
  background: rgba(255, 220, 120, 1);
  filter: blur(1.5px);
  pointer-events: none;
  z-index: 4;
}

#light-sweep {
  position: fixed;
  z-index: 5;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.sweep-halo {
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(ellipse,
    rgba(255, 220, 150, 0.35) 0%,
    rgba(255, 200, 130, 0.12) 40%,
    transparent 70%);
  filter: blur(12px);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.sweep-core {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(ellipse,
    rgba(255, 245, 210, 0.95) 0%,
    rgba(255, 235, 180, 0.6) 45%,
    transparent 100%);
  filter: blur(3px);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.sweep-point {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 240, 1);
  box-shadow:
    0 0 14px 6px rgba(255, 240, 180, 0.85),
    0 0 40px 16px rgba(255, 210, 100, 0.4),
    0 0 80px 30px rgba(255, 190, 80, 0.15);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.mini-sticker {
  object-fit: contain;
  border-radius: 6px;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  transition: opacity 0.4s ease;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.mini-sticker--hidden {
  display: none;
}

@media (max-width: 720px) {
  .sweep-halo {
    width: 200px;
    height: 200px;
    background: radial-gradient(ellipse,
      rgba(255, 220, 150, 0.50) 0%,
      rgba(255, 200, 130, 0.20) 40%,
      transparent 70%);
    filter: blur(8px);
  }

  .sweep-core {
    width: 60px;
    height: 60px;
    background: radial-gradient(ellipse,
      rgba(255, 245, 210, 1) 0%,
      rgba(255, 235, 180, 0.8) 45%,
      transparent 100%);
    filter: blur(2px);
  }

  .sweep-point {
    width: 8px;
    height: 8px;
  }

  .mini-sticker {
    display: none;
  }
}
</style>
