<template>
  <div ref="root" class="relative w-[80vw] md:w-96">

    <!-- Input -->
    <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 focus-within:border-white/30 transition-colors">
      <UIcon name="i-heroicons-magnifying-glass" class="size-4 text-white/40 shrink-0" />
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        placeholder="Search countries, commodities, years…"
        class="flex-1 bg-transparent text-sm text-white/85 placeholder-white/35 outline-none min-w-0"
        @keydown.down.prevent="moveSelection(1)"
        @keydown.up.prevent="moveSelection(-1)"
        @keydown.enter.prevent="confirmSelection()"
        @keydown.escape="clear()"
      />
      <button v-if="query" @click="clear()" class="text-white/40 hover:text-white/70 transition-colors shrink-0">
        <UIcon name="i-heroicons-x-mark" class="size-4" />
      </button>
      <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-white/30 border border-white/15 shrink-0 select-none">
        ⌘K
      </kbd>
    </div>

    <!-- Results dropdown -->
    <Transition name="dropdown">
      <div
        v-if="query.trim() && results.length"
        class="absolute top-full left-0 right-0 mt-1.5 bg-[#020c1f]/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 overflow-hidden z-50 max-h-96 overflow-y-auto"
      >
        <template v-for="group in results" :key="group.type">
          <div class="px-3 py-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider bg-white/5 sticky top-0">
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
                ? 'bg-white/12'
                : 'hover:bg-white/8'
            ]"
          >
            <UIcon :name="group.icon" class="size-4 shrink-0" :class="group.iconColor" />
            <span class="flex-1 text-sm text-white/80 truncate" v-html="highlight(item.label)" />

            <!-- Supply barometer badge for categories and commodities -->
            <span
              v-if="item.supplierCount !== undefined"
              class="shrink-0 flex items-center gap-1"
              :title="`${item.supplierCount} of ${TOTAL_COUNTRIES} countries export this`"
            >
              <span
                class="size-2 rounded-full inline-block"
                :class="barometerDot(item.supplierCount)"
              />
              <span class="text-[10px] tabular-nums" :class="barometerText(item.supplierCount)">
                {{ item.supplierCount }}<span class="text-white/25">/{{ TOTAL_COUNTRIES }}</span>
              </span>
            </span>
          </button>
        </template>
      </div>
    </Transition>

    <!-- No results -->
    <Transition name="dropdown">
      <div
        v-if="query.trim() && !results.length"
        class="absolute top-full left-0 right-0 mt-1.5 bg-[#020c1f]/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 py-6 text-center text-sm text-white/40 z-50"
      >
        No results for "{{ query }}"
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES, YEARS, countCategoryExporters, getBarometerLevel } from '~/utils/dummyData'
import { COMMODITIES } from '~/utils/tradeExtended'
import { categoryToSlug } from '~/utils/formatters'

const router = useRouter()

const query     = ref('')
const root      = ref<HTMLElement | null>(null)
const inputEl   = ref<HTMLInputElement | null>(null)
const flatIndex = ref(-1)

const TOTAL_COUNTRIES = TRADE_DATA.length

interface Item  { label: string; path: string; supplierCount?: number }
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
        .map(cat => ({
          label: cat,
          path: `/categories/${categoryToSlug(cat)}`,
          supplierCount: countCategoryExporters(cat),
        })),
    },
    {
      type: 'commodities',
      label: 'Commodities',
      icon: 'i-heroicons-cube',
      iconColor: 'text-violet-400',
      items: COMMODITIES
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, MAX_PER_GROUP)
        .map(c => ({
          label: c.name,
          path: `/commodities/${c.id}`,
          supplierCount: countCategoryExporters(c.category),
        })),
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

// Barometer badge colors
function barometerDot(count: number): string {
  const level = getBarometerLevel(count)
  if (level === 'high')   return 'bg-emerald-400'
  if (level === 'medium') return 'bg-amber-400'
  return 'bg-red-400'
}
function barometerText(count: number): string {
  const level = getBarometerLevel(count)
  if (level === 'high')   return 'text-emerald-400/80'
  if (level === 'medium') return 'text-amber-400/80'
  return 'text-red-400/80'
}

// Bold the matching substring
function highlight(text: string): string {
  const q = query.value.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    escapeHtml(text.slice(0, idx)) +
    `<strong class="font-semibold text-white">${escapeHtml(text.slice(idx, idx + q.length))}</strong>` +
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
