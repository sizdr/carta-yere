import { ref, shallowReadonly, watch } from 'vue'
import type { Component } from 'vue'
import Letter1 from '../letters/Letter1.vue'
import Letter2 from '../letters/Letter2.vue'

export type LetterState = 'locked' | 'available' | 'read'

export interface LetterCard {
  id: number
  state: LetterState
  contentFile: string
  title: string
  component: Component
}

interface PersistedState {
  letters: { id: number; state: LetterState }[]
  activeIndex: number
}

const STORAGE_KEY = 'carta-carousel-state'

const defaultLetters: LetterCard[] = [
  { id: 1, state: 'available', contentFile: 'letter1.txt', title: '', component: Letter1 },
  { id: 2, state: 'locked',     contentFile: 'letter2.txt', title: '', component: Letter2 },
]

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function persist(letters: LetterCard[], activeIndex: number) {
  const data: PersistedState = {
    letters: letters.map((l) => ({ id: l.id, state: l.state })),
    activeIndex,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function buildLetters(persisted: PersistedState | null): LetterCard[] {
  const validIds = new Set(defaultLetters.map((l) => l.id))
  if (persisted) {
    return persisted.letters
      .filter((ps) => validIds.has(ps.id))
      .map((ps) => {
        const fallback = defaultLetters.find((d) => d.id === ps.id)!
        return {
          id: ps.id,
          state: ps.state,
          contentFile: fallback.contentFile,
          title: fallback.title,
          component: fallback.component,
        }
      })
  }
  return defaultLetters.map((l) => ({ ...l }))
}

const persisted = loadPersisted()
const letters = ref<LetterCard[]>(buildLetters(persisted))
const activeIndex = ref(Math.min(persisted?.activeIndex ?? 0, letters.value.length - 1))

watch([letters, activeIndex], () => {
  persist(letters.value, activeIndex.value)
}, { deep: true })

export function useCarousel() {
  function selectLetter(index: number): boolean {
    const letter = letters.value[index]
    if (!letter || letter.state === 'locked') return false
    activeIndex.value = index
    return true
  }

  function unlockNext(): boolean {
    const nextIdx = activeIndex.value + 1
    if (nextIdx >= letters.value.length) return false
    const next = letters.value[nextIdx]
    if (next.state === 'locked') {
      next.state = 'available'
    }
    return true
  }

  function markAsRead(index?: number) {
    const idx = index ?? activeIndex.value
    const letter = letters.value[idx]
    if (letter) {
      letter.state = 'read'
    }
  }

  function goToNext(): boolean {
    const nextIdx = activeIndex.value + 1
    if (nextIdx >= letters.value.length) return false
    unlockNext()
    activeIndex.value = nextIdx
    return true
  }

  function goToPrev(): boolean {
    const prevIdx = activeIndex.value - 1
    if (prevIdx < 0) return false
    activeIndex.value = prevIdx
    return true
  }

  function hasNext(): boolean {
    return activeIndex.value + 1 < letters.value.length
  }

  function hasPrev(): boolean {
    return activeIndex.value - 1 >= 0
  }

  function getActiveLetter(): LetterCard | null {
    return letters.value[activeIndex.value] ?? null
  }

  function reset() {
    letters.value = defaultLetters.map((l) => ({ ...l }))
    activeIndex.value = 0
  }

  return {
    letters: shallowReadonly(letters),
    activeIndex: shallowReadonly(activeIndex),
    selectLetter,
    unlockNext,
    markAsRead,
    goToNext,
    goToPrev,
    hasNext,
    hasPrev,
    getActiveLetter,
    reset,
  }
}
