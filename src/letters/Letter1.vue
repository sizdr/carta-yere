<template>
  <LetterWithMusic
    :visible="visible"
    :content="content"
    @close="$emit('close')"
    @finish="$emit('letter-finished')"
    @music-visible="$emit('music-visible', $event)"
  />
</template>

<script setup lang="ts">
import LetterWithMusic from '../components/LetterWithMusic.vue'

defineProps<{
  visible: boolean
  content: string
}>()

defineEmits<{
  close: []
  'letter-finished': []
  'music-visible': [visible: boolean]
}>()
</script>
