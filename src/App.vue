<template>
  <div class="app-root">
    <EnvelopeScene />
  </div>
</template>

<script setup lang="ts">
import EnvelopeScene from './EnvelopeScene.vue'
</script>

<style>
.app-root {
  width: 100%;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #8ecfe9 0%, #6eaec1 60%, #306f98 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
</style>
