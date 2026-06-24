<template>
  <div class="carousel">
    <div class="carousel__inner">
      <div
        v-for="(letter, index) in letters"
        :key="letter.id"
        class="carousel__item"
        :class="{
          'carousel__item--active': index === activeIndex,
          'carousel__item--locked': letter.state === 'locked',
          'carousel__item--read': letter.state === 'read',
          'carousel__item--clickable': letter.state !== 'locked',
        }"
        :style="getItemStyle(index)"
        @click="handleSelect(index)"
      >
        <Envelope
          :locked="letter.state === 'locked'"
          :centered="false"
        />
        <div class="carousel__label">{{ letter.title }}</div>
      </div>
    </div>

    <button
      v-if="hasPrev"
      class="carousel__arrow carousel__arrow--left"
      @click="emit('navigate', activeIndex - 1)"
      aria-label="Carta anterior"
    >&#8249;</button>
    <button
      v-if="hasNext"
      class="carousel__arrow carousel__arrow--right"
      @click="emit('navigate', activeIndex + 1)"
      aria-label="Carta siguiente"
    >&#8250;</button>
  </div>
</template>

<script setup lang="ts">
import type { LetterCard } from '../composables/useCarousel'
import Envelope from '../Envelope.vue'

const props = defineProps<{
  letters: readonly LetterCard[]
  activeIndex: number
  hasPrev: boolean
  hasNext: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
  open: [index: number]
  navigate: [index: number]
}>()

function handleSelect(index: number) {
  const letter = props.letters[index]
  if (letter.state === 'locked') return
  if (index === props.activeIndex) {
    emit('open', index)
  } else {
    emit('select', index)
  }
}

function getItemStyle(index: number) {
  const diff = index - props.activeIndex
  const isMobile = window.innerWidth <= 720
  const step = isMobile ? 160 : 280
  const farStep = isMobile ? 280 : 480

  let translateX = 0
  let scale = 1
  let opacity = 1
  let zIndex = 10 - Math.abs(diff)

  if (diff === 0) {
    translateX = 0
    scale = 1
    opacity = 1
    zIndex = 10
  } else if (diff === 1) {
    translateX = step
    scale = 0.75
    opacity = 0.5
    zIndex = 5
  } else if (diff === 2) {
    translateX = farStep
    scale = 0.6
    opacity = 0.3
    zIndex = 3
  } else if (diff === -1) {
    translateX = -step
    scale = 0.75
    opacity = 0.4
    zIndex = 5
  } else if (diff === -2) {
    translateX = -farStep
    scale = 0.6
    opacity = 0.2
    zIndex = 3
  }

  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    opacity,
    zIndex,
  }
}
</script>

<style scoped>
.carousel {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
  z-index: 5;
}

.carousel__inner {
  position: relative;
  width: 340px;
  height: 240px;
}

.carousel__item {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease;
  transform-origin: center center;
}

.carousel__item--locked {
  cursor: default;
}

.carousel__item--clickable {
  cursor: pointer;
}

.carousel__item--read {
  filter: saturate(0.4);
}

.carousel__item--active.carousel__item--read {
  filter: none;
}

.carousel__label {
  text-align: center;
  margin-top: 12px;
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: #c9a96e;
  opacity: 0.8;
}

.carousel__item--active .carousel__label {
  color: #e8d5b0;
  opacity: 1;
}

.carousel__arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(200, 180, 140, 0.3);
  background: rgba(44, 24, 16, 0.7);
  color: #c9a96e;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  z-index: 15;
  padding: 0;
}

.carousel__arrow:hover {
  background: rgba(44, 24, 16, 0.95);
  border-color: #c9a96e;
  color: #e8d5b0;
}

.carousel__arrow--left {
  left: 24px;
}

.carousel__arrow--right {
  right: 24px;
}

@media (max-width: 720px) {
  .carousel__inner {
    width: 240px;
    height: 170px;
  }

  .carousel__arrow {
    width: 40px;
    height: 40px;
    font-size: 26px;
  }

  .carousel__arrow--left {
    left: 8px;
  }

  .carousel__arrow--right {
    right: 8px;
  }

  .carousel__label {
    font-size: 16px;
    margin-top: 8px;
  }
}
</style>
