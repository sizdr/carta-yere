<template>
  <div
    class="envelope-wrapper"
    :class="{
      'envelope-wrapper--centered': centered,
      'envelope-wrapper--exiting': exiting,
      'envelope-wrapper--locked': locked,
    }"
    @click="handleClick"
  >
    <div
      class="envelope-visual"
      :class="{
        'envelope-visual--open': flapOpen,
        'envelope-visual--floating': !flapOpen && !locked,
      }"
    >
      <div class="envelope-hover-target">
        <svg
  viewBox="0 0 520 320"
  class="envelope-svg"
  :class="{ 'envelope-svg--opening': flapOpen }"
  :style="{ width: (340 * (scale ?? 1)) + 'px' }"
  xmlns="http://www.w3.org/2000/svg"
>

  <!-- cuerpo -->

  <rect
    x="20"
    y="20"
    width="480"
    height="280"
    rx="12"
    :fill="color"
    :stroke="strokeColor"
    stroke-width="2"
  />

  <!-- Solapa superior -->

<path
  d="M 20 20 L 260 150 L 500 20"
  fill="none"
  :stroke="strokeColor"
  stroke-width="2"
/>

<!-- Triángulo inferior -->

<path
  d="M 20 300 L 260 145 L 500 300"
  fill="none"
  :stroke="strokeColor"
  stroke-width="1.5"
  stroke-opacity="0.25"
/>

  <!-- sello minimalista -->

  <path
  d="
    M 438 52
    C 438 46 445 44 448 49
    C 451 44 458 46 458 52
    C 458 58 448 65 448 65
    C 448 65 438 58 438 52
  "
  fill="#d89aa3"
/>

</svg>
      </div>
    </div>

    <!-- Lock overlay -->
    <div v-if="locked" class="envelope__lock-overlay">
      <span class="envelope__lock-icon">&#128274;</span>
      <span class="envelope__lock-tooltip">Termina de leer la carta anterior</span>
    </div>

    <div v-if="locked" class="envelope__lock-ghost"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  color?: string
  strokeColor?: string
  scale?: number
  locked?: boolean
  centered?: boolean
  autoOpen?: boolean
}>()

const emit = defineEmits<{
  open: []
  done: []
}>()

const color = props.color ?? '#EDE8DC'
const strokeColor = props.strokeColor ?? '#9E8E8E'
const scale = props.scale ?? 1

const flapOpen = ref(false)
const exiting = ref(false)

function startAnimation() {
  if (flapOpen.value) return
  emit('open')
  flapOpen.value = true

  setTimeout(() => {
    exiting.value = true
  }, 1000)

  setTimeout(() => {
    emit('done')
  }, 1300)
}

function handleClick() {
  if (props.locked || flapOpen.value || !props.centered) return
  startAnimation()
}

onMounted(() => {
  if (props.autoOpen) {
    startAnimation()
  }
})
</script>

<style scoped>
.envelope-svg {
  display: block;
  height: auto;
  filter: drop-shadow(0 10px 25px rgba(0,0,0,.12));
}

.envelope-flap-group {
  transform-origin: 260px 20px;
  transition: transform .6s ease;
}

.envelope-svg--opening .envelope-flap-group {
  transform: rotateX(-120deg);
}
</style>