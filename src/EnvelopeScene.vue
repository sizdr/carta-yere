<template>
  <div class="scene">
    <div class="scene-bg">
      <img
        v-for="s in stickers"
        :key="s.id"
        :src="s.src"
        :class="['sticker', 'sticker--' + s.id, { 'sticker--hidden': s.hidden }]"
        :style="s.style"
        alt=""
        draggable="false"
        @error="s.hidden = true"
      />
    </div>

    <LetterCarousel
      v-if="state === 'carousel'"
      :letters="letters"
      :active-index="activeIndex"
      :has-prev="hasPrev()"
      :has-next="hasNext()"
      @select="handleCenter"
      @open="handleOpenLetter"
      @navigate="handleNavigate"
    />

    <Envelope
      v-if="state === 'opening'"
      centered
      auto-open
      @open="onOpen"
      @done="onDone"
    />

    <component
      :is="activeLetter?.component"
      v-if="state === 'reading'"
      :visible="state === 'reading'"
      :content="letterContent"
      @close="handleClose"
      @letter-finished="handleFinish"
      @music-visible="onMusicVisible"
    />

    <FocusOverlay :visible="state === 'reading' && !musicVisible" />

    <GalleryTransition
      :visible="state === 'transition'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Envelope from './Envelope.vue'
import FocusOverlay from './FocusOverlay.vue'
import LetterCarousel from './components/LetterCarousel.vue'
import GalleryTransition from './components/GalleryTransition.vue'
import { useLetter } from './composables/useLetter'
import { useCarousel } from './composables/useCarousel'

interface Sticker {
  id: string
  src: string
  style: Record<string, string>
  hidden: boolean
}

const stickers = reactive<Sticker[]>([
  {
    id: 's1',
    src: '/stickers/Adobe Express - file (1).png',
    style: {
      width: '26%',
      top: '75%',
      left:'35%',
      transform: 'translateY(-50%) rotate(4deg)',
      opacity: '0.10',
    },
    hidden: false,
  },
  {
    id: 's4',
    src: '/stickers/Untitled - June 24, 2026 at 02.53.12 (1).png',
    style: {
      width: '15%',
      top: '5%',
      left: '40%',
      transform: 'rotate(-5deg)',
      opacity: '1',
    },
    hidden: false,
  },
])

const { state, letterContent, startOpening, finishOpening, startTransition, finishTransition, goToCarousel, reopenLetter, loadLetter } = useLetter()
const { letters, activeIndex, selectLetter, markAsRead, goToNext, hasNext, hasPrev, getActiveLetter } = useCarousel()

const activeLetter = computed(() => getActiveLetter())
const musicVisible = ref(false)

function onMusicVisible(visible: boolean) {
  musicVisible.value = visible
}

let transitionTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  loadActiveLetter()
})

watch(activeIndex, () => {
  loadActiveLetter()
})

function loadActiveLetter() {
  const active = getActiveLetter()
  if (active) {
    loadLetter(active.contentFile)
  }
}

function handleCenter(index: number) {
  selectLetter(index)
}

function handleOpenLetter(index: number) {
  if (!selectLetter(index)) return
  const letter = letters.value[index]
  if (letter.state === 'available') {
    startOpening()
  } else if (letter.state === 'read') {
    reopenLetter()
  }
}

function handleNavigate(index: number) {
  const letter = letters.value[index]
  if (!letter || letter.state === 'locked') return
  selectLetter(index)
}

function onOpen() {
  /* envelope animation started */
}

function onDone() {
  finishOpening()
}

function handleClose() {
  goToCarousel()
}

function handleFinish() {
  startTransition()
  scheduleTransitionEnd()
}

function scheduleTransitionEnd() {
  if (transitionTimer) clearTimeout(transitionTimer)

  transitionTimer = setTimeout(() => {
    markAsRead()
    goToNext()
    finishTransition()
    transitionTimer = null
  }, 5000)
}
</script>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.scene-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.sticker {
  position: absolute;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
  transition: opacity 0.4s ease;
}

.sticker--hidden {
  display: none;
}

@media (max-width: 720px) {
  .sticker--s1 {
    display: none;
  }

  .sticker--s4 {
    width: 25% !important;
    top: 3% !important;
    left: 35% !important;
    opacity: 0.8 !important;
  }
}
</style>
