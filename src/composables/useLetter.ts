import { ref, readonly, watch } from 'vue'

export type LetterState = 'carousel' | 'opening' | 'reading' | 'transition'

const state = ref<LetterState>('carousel')
const letterContent = ref('')
const loading = ref(false)

watch(state, (s) => {
  document.body.style.overflow = s === 'reading' ? 'auto' : 'hidden'
})

export function useLetter() {
  function startOpening() {
    state.value = 'opening'
  }

  function finishOpening() {
    if (state.value !== 'opening') return
    state.value = 'reading'
  }

  function startTransition() {
    state.value = 'transition'
  }

  function finishTransition() {
    state.value = 'carousel'
  }

  function goToCarousel() {
    state.value = 'carousel'
  }

  function reopenLetter() {
    state.value = 'reading'
  }

  async function loadLetter(fileName: string) {
    loading.value = true
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}content/${fileName}`)
      const text = await res.text()
      letterContent.value = text
    } catch {
      letterContent.value = 'No se pudo cargar la carta.'
    } finally {
      loading.value = false
    }
  }

  return {
    state: readonly(state),
    letterContent: readonly(letterContent),
    loading: readonly(loading),
    startOpening,
    finishOpening,
    startTransition,
    finishTransition,
    goToCarousel,
    reopenLetter,
    loadLetter,
  }
}
