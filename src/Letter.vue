<template>
  <div class="letter-overlay" :class="{ 'letter-overlay--visible': visible }">
    <div class="letter-paper" ref="paperEl">
      <button class="letter__close" @click="emit('close')">&times;</button>
      <div class="letter__content">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          class="letter__paragraph"
        >{{ paragraph }}</p>
        <div ref="endSentinel" class="letter__sentinel"></div>
        <button
          v-if="showContinue"
          class="letter__continue"
          @click="emit('finish')"
        >Continuar &rarr;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'

const props = defineProps<{
  visible: boolean
  content: string
}>()

const emit = defineEmits<{
  close: []
  finish: []
}>()

const paperEl = ref<HTMLElement>()
const endSentinel = ref<HTMLElement>()
const showContinue = ref(false)

let observer: IntersectionObserver | null = null

const paragraphs = computed(() => {
  return props.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
})

onMounted(() => {
  if (paperEl.value) {
    paperEl.value.scrollTop = 0
  }
  showContinue.value = false

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        showContinue.value = true
        observer?.disconnect()
      }
    },
    { root: null, threshold: 0.3 }
  )

  if (endSentinel.value) {
    observer.observe(endSentinel.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
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
  aspect-ratio: 216 / 279;
  max-height: calc(100vh - 80px);
  background-color: #fffef0;
  overflow-y: auto;
  scroll-behavior: smooth;

  font-family: "Cormorant", serif;
  font-optical-sizing: auto;



  font-size: 20px;
  line-height: 28px;
  color: #3a2e1e;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.08),
    0 8px 24px rgba(0,0,0,0.12),
    0 24px 48px rgba(0,0,0,0.15);
  border-radius: 2px;
}

@media (max-width: 720px) {
  .letter-overlay {
    padding: 16px;
    align-items: center;
  }

  .letter-paper {
    max-width: calc(100vw - 64px);
    max-height: calc(100vh - 64px);
    font-size: 18px;
    line-height: 30px;
  }
}

.letter__close {
  position: sticky;
  top: 16px;
  float: right;
  margin-right: 16px;
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
  padding: 56px 56px 80px 56px;
  position: relative;
}

@media (max-width: 720px) {
  .letter__content {
    padding: 40px 24px 56px 24px;
  }
}

.letter__paragraph {
  margin-bottom: 24px;
  text-align: justify;
}

.letter__sentinel {
  height: 1px;
  margin: 10px 1px;
  width: 100%;
}

.letter__continue {
  display: block;
  margin: 8px auto 0;
  background: none;
  border: 1px solid #c9a96e;
  color: #8a7a50;
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
</style>
