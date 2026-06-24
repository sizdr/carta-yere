<template>
  <div class="letter-overlay" :class="{ 'letter-overlay--visible': visible }">
    <div class="letter-paper" ref="paperEl" @scroll="onScroll">
      <button class="letter__close" @click="emit('close')">&times;</button>
      <div class="letter__content">
        <div v-if="hasMusic" class="music-section" ref="musicSectionRef">
          <span class="music-label">&#9834; mientras lees...</span>
          <div class="spotify-wrapper">
            <slot name="music" />
          </div>
        </div>
        <div
          v-for="(foldParagraphs, index) in folds"
          :key="index"
          :ref="(el: unknown) => updateFoldRefs(el, index)"
          class="fold"
          :class="{ 'fold--first': index === 0, 'fold--last': index === folds.length - 1 }"
          :style="getFoldStyle(index)"
        >
          <p
            v-for="(paragraph, pIndex) in foldParagraphs"
            :key="pIndex"
            class="letter__paragraph"
          >{{ paragraph }}</p>
        </div>
        <div ref="endSentinel" class="letter__sentinel"></div>
        <button
          v-if="showContinue"
          class="letter__continue"
          @click="emit('finish')"
        >Continuar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount, nextTick, useSlots } from 'vue'
import { useFoldEffect } from '../composables/useFoldEffect'

const props = defineProps<{
  visible: boolean
  content: string
}>()

const emit = defineEmits<{
  close: []
  finish: []
  'music-visible': [visible: boolean]
}>()

const slots = useSlots()
const hasMusic = computed(() => !!slots.music?.())

const paperEl = ref<HTMLElement>()
const musicSectionRef = ref<HTMLElement>()
const endSentinel = ref<HTMLElement>()
const showContinue = ref(false)

let endObserver: IntersectionObserver | null = null
let musicObserver: IntersectionObserver | null = null

const paragraphs = computed(() => {
  return props.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
})

const {
  folds,
  updateFoldRefs,
  onScroll,
  getFoldStyle,
  initFolds,
} = useFoldEffect(paragraphs)

onMounted(() => {
  if (paperEl.value) {
    paperEl.value.scrollTop = 0
  }
  showContinue.value = false

  initFolds()

  endObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        showContinue.value = true
        endObserver?.disconnect()
      }
    },
    { root: null, threshold: 0.3 }
  )

  if (endSentinel.value) {
    endObserver.observe(endSentinel.value)
  }

  if (hasMusic.value && musicSectionRef.value) {
    musicObserver = new IntersectionObserver(
      ([entry]) => {
        emit('music-visible', entry.isIntersecting)
      },
      { root: null, threshold: 0.3 }
    )
    musicObserver.observe(musicSectionRef.value)
  }

  nextTick(() => {
    if (paperEl.value) {
      onScroll({ target: paperEl.value } as unknown as Event)
    }
  })
})

onBeforeUnmount(() => {
  endObserver?.disconnect()
  musicObserver?.disconnect()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&display=swap');

.letter-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.letter-overlay--visible {
  opacity: 1;
  pointer-events: auto;
}

.letter-paper {
  position: relative;
  width: 100%;
  max-width: 680px;
  height: auto;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  scroll-behavior: smooth;
  perspective: 1200px;
  font-family: "Cormorant", serif;
  font-optical-sizing: auto;
  font-size: 20px;
  line-height: 28px;
  color: #3a2e1e;
  filter:
    drop-shadow(0 2px 4px rgba(0,0,0,0.08))
    drop-shadow(0 8px 24px rgba(0,0,0,0.12))
    drop-shadow(0 24px 48px rgba(0,0,0,0.15));
}

@media (max-width: 720px) {
  .letter-overlay {
    padding: 16px;
    align-items: center;
  }

  .letter-paper {
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    font-size: 21px;
    line-height: 30px;
  }
}

.letter__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
  background: none;
  border: none;
  font-size: 28px;
  color: #8a7a60;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  line-height: 1;
}

.letter__close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #3a2e1e;
}

.letter__content {
  position: relative;
}

.letter__paragraph {
  margin: 18px 0 0 0;
  text-align: justify;
}

.letter__paragraph:first-child {
  margin-top: 12px;
}


/* --- Fold panels (height-reveal accordion) --- */

.fold {
  position: relative;
  background-color: #fffef0;
  transform-origin: top center;
  backface-visibility: hidden;
  min-height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 56px 6px;
}

.fold--first {
  min-height: auto;
  justify-content: flex-start;
}

.fold--last{
  padding: 0px 56px 32px;
}

@media (max-width: 720px) {
  .fold {
    padding: 32px 24px 0;
  }
}

.fold--first {
  border-radius: 2px 2px 0 0;
}

.fold--last {
  border-radius: 0 0 2px 2px;
}

.fold + .fold {
  border-top: 0.5px solid rgba(150, 120, 80, 0.3);
}

.fold .letter__paragraph:last-child {
  margin-bottom: 0;
}

.letter__sentinel {
  height: 1px;
  width: 100%;
}

.letter__continue {
  display: block;
  margin: 64px auto 0;
  background: rgb(255, 180, 5);
  border: 1px solid #000000;
  color: #000000;
  font-family: 'Caveat', cursive;
  font-size: 22px;
  padding: 8px 28px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  opacity: 0;
  animation: fadeInContinue 0.5s ease 0.2s forwards;
}

.letter__continue:hover {
  background: #c9a96e;
  color: #fff;
}

@keyframes fadeInContinue {
  to { opacity: 1; }
}

/* --- Music section --- */

.music-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(180, 150, 100, 0.3);
}

.music-label {
  font-family: "Cormorant", serif;
  font-size: 0.85rem;
  color: rgba(120, 90, 60, 0.65);
  margin-bottom: 10px;
  display: block;
  font-style: italic;
}

.spotify-wrapper {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.spotify-wrapper :deep(iframe) {
  display: block;
  width: 100%;
  border-radius: 12px;
}
</style>
