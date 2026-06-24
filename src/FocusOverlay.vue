<template>
  <div class="focus-overlay" :class="{ 'focus-overlay--visible': visible }"></div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<style scoped>
.focus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.focus-overlay--visible {
  opacity: 1;
}

.focus-overlay::before,
.focus-overlay::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  pointer-events: none;
}

.focus-overlay::before {
  top: 0;
  height: 28%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, transparent 100%);
}

.focus-overlay::after {
  bottom: 0;
  height: 28%;
  background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%);
}
</style>
