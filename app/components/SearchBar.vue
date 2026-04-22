<template>
  <div ref="root" class="relative w-[80vw] md:w-96">

    <!-- Input -->
    <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-300 dark:border-zinc-600 shadow-md focus-within:border-zinc-500 dark:focus-within:border-zinc-400 transition-colors">
      <UIcon name="i-heroicons-magnifying-glass" class="size-4 text-zinc-400 shrink-0" />
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        placeholder="Search countries, commodities, years…"
        class="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 outline-none min-w-0"
        @keydown.down.prevent="moveSelection(1)"
        @keydown.up.prevent="moveSelection(-1)"
        @keydown.enter.prevent="confirmSelection()"
        @keydown.escape="clear()"
      />
      <button v-if="query" @click="clear()" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
        <UIcon name="i-heroicons-x-mark" class="size-4" />
      </button>
      <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 border border-zinc-300 dark:border-zinc-600 shrink-0 select-none">
        ⌘K
      </kbd>
    </div>

    <!-- Results dropdown -->
    <Transition name="dropdown">
      <div
        v-if="query.trim() && results.length"
        class="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50 max-h-96 overflow-y-auto"
      >
        <template v-for="group in results" :key="group.type">
          <div class="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60 sticky top-0">
            {{ group.label }}
          </div>
          <button
            v-for="(item, i) in group.items"
            :key="item.path"
            @click="navigate(item.path)"
            @mouseenter="flatIndex = groupOffsets[group.type] + i"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
              flatIndex === groupOffsets[group.type] + i
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
            ]"
          >
            <UIcon :name="group.icon" class="size-4 shrink-0" :class="group.iconColor" />
            <span class="flex-1 text-sm text-zinc-700 dark:text-zinc-200 truncate" v-html="highlight(item.label)" />
          </button>
        </template>
      </div>
    </Transition>

    <!-- No results -->
    <Transition name="dropdown">
      <div
        v-if="query.trim() && !results.length"
        class="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-6 text-center text-sm text-zinc-500 z-50"
      >
        No results for "{{ query }}"
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES, YEARS } from '~/utils/dummyData'
import { COMMODITIES } from '~/utils/tradeExtended'
import { categoryToSlug } from '~/utils/formatters'

const router = useRouter()

const query     = ref('')
const root      = ref<HTMLElement | null>(null)
const inputEl   = ref<HTMLInputElement | null>(null)
const flatIndex = ref(-1)

interface Item  { label: string; path: string }
interface Group { type: string; label: string; icon: string; iconColor: string; items: Item[] }

const MAX_PER_GROUP = 5

const results = computed<Group[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []

  const groups: Group[] = [
    {
      type: 'countries',
      label: 'Countries',
      icon: 'i-heroicons-globe-alt',
      iconColor: 'text-blue-400',
      items: TRADE_DATA
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, MAX_PER_GROUP)
        .map(c => ({ label: c.name, path: `/countries/${c.iso3.toLowerCase()}` })),
    },
    {
      type: 'categories',
      label: 'Categories',
      icon: 'i-heroicons-tag',
      iconColor: 'text-emerald-400',
      items: CATEGORIES
        .filter(cat => cat.toLowerCase().includes(q))
        .slice(0, MAX_PER_GROUP)
        .map(cat => ({ label: cat, path: `/categories/${categoryToSlug(cat)}` })),
    },
    {
      type: 'commodities',
      label: 'Commodities',
      icon: 'i-heroicons-cube',
      iconColor: 'text-violet-400',
      items: COMMODITIES
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, MAX_PER_GROUP)
        .map(c => ({ label: c.name, path: `/commodities/${c.id}` })),
    },
    {
      type: 'years',
      label: 'Years',
      icon: 'i-heroicons-calendar',
      iconColor: 'text-amber-400',
      items: YEARS
        .filter(y => String(y).includes(q))
        .slice(0, MAX_PER_GROUP)
        .map(y => ({ label: String(y), path: `/years/${y}` })),
    },
  ]

  return groups.filter(g => g.items.length > 0)
})

// Pre-compute offset of each group within the flat list for O(1) highlight lookup
const groupOffsets = computed(() => {
  const offsets: Record<string, number> = {}
  let offset = 0
  for (const g of results.value) {
    offsets[g.type] = offset
    offset += g.items.length
  }
  return offsets
})

const flatItems = computed(() => results.value.flatMap(g => g.items))

function moveSelection(dir: 1 | -1) {
  const len = flatItems.value.length
  if (!len) return
  flatIndex.value = flatIndex.value < 0
    ? (dir === 1 ? 0 : len - 1)
    : (flatIndex.value + dir + len) % len
}

function confirmSelection() {
  const item = flatItems.value[flatIndex.value]
  if (item) navigate(item.path)
}

function navigate(path: string) {
  router.push(path)
  clear()
}

function clear() {
  query.value  = ''
  flatIndex.value = -1
}

// Bold the matching substring
function highlight(text: string): string {
  const q = query.value.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    escapeHtml(text.slice(0, idx)) +
    `<strong class="font-semibold text-zinc-900 dark:text-white">${escapeHtml(text.slice(idx, idx + q.length))}</strong>` +
    escapeHtml(text.slice(idx + q.length))
  )
}
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

watch(query, () => { flatIndex.value = -1 })

function handleOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    flatIndex.value = -1
  }
}
onMounted(()  => document.addEventListener('mousedown', handleOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleOutside))

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
