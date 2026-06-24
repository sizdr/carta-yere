<template>
  <LetterWithMusic
    :visible="visible"
    :content="content"
    @close="$emit('close')"
    @finish="$emit('letter-finished')"
    @music-visible="$emit('music-visible', $event)"
  >
    <template #music>
      <iframe data-testid="embed-iframe" style="border-radius:12px" src="https://open.spotify.com/embed/track/6YQG62T687TCDrTVyK3DK2?utm_source=generator&si=53d55264206c42a9" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    </template>
  </LetterWithMusic>
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
