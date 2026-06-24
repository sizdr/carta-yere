import { computed, ref, onBeforeUpdate, type ComputedRef } from 'vue'

function getFoldSizes(count: number): number[] {
  if (count <= 3) return [count]
  const sizes = [3]
  for (let i = 3; i < count; i++) sizes.push(1)
  return sizes
}

export function useFoldEffect(paragraphs: ComputedRef<string[]>) {
  const folds = computed(() => {
    const sizes = getFoldSizes(paragraphs.value.length)
    const result: string[][] = []
    let offset = 0
    for (const size of sizes) {
      result.push(paragraphs.value.slice(offset, offset + size))
      offset += size
    }
    return result
  })

  const foldProgress = ref<number[]>([])
  const foldRefs = ref<HTMLElement[]>([])

  function updateFoldRefs(el: unknown, index: number) {
    if (el instanceof HTMLElement) {
      foldRefs.value[index] = el
    }
  }

  function initFolds() {
    foldProgress.value = folds.value.map((_, i) => i === 0 ? 1.0 : 0.0)
  }

  function onScroll(e: Event) {
    const container = e.target as HTMLElement
    const scrollPct = container.scrollTop / Math.max(1, container.scrollHeight - container.clientHeight)
    const total = foldRefs.value.length
    const segments = total - 1

    for (let i = 1; i < total; i++) {
      const start = (i - 1) / segments
      const end = i / segments

      if (scrollPct <= start) {
        foldProgress.value[i] = 0.0
      } else if (scrollPct >= end) {
        foldProgress.value[i] = 1.0
      } else {
        foldProgress.value[i] = (scrollPct - start) / (end - start)
      }
    }
  }

  function getFoldStyle(index: number) {
    if (index === 0) return {} as Record<string, string | number>
    const p = foldProgress.value[index] ?? 0
    const angle = -90 * (1 - p)
    return {
      transform: `rotateX(${angle}deg)`,
      opacity: p < 0.02 ? 0 : Math.min(1, p * 5),
    } as Record<string, string | number>
  }

  onBeforeUpdate(() => {
    foldRefs.value = []
  })

  return {
    folds,
    foldProgress,
    foldRefs,
    updateFoldRefs,
    onScroll,
    getFoldStyle,
    initFolds,
  }
}
